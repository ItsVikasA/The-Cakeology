import { variantStock } from "../dao/variantStock.dao.js";
import cartModel from "../models/cartModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import couponModel from "../models/couponModel.js";
import settingsModel from "../models/settingsModel.js";
import notificationModel from "../models/notificationModel.js";
import paymentModel from "../models/paymentModel.js";
import sendEmail from "../services/emailService.js";
import { refundForOrder, refundErrorMessage } from "../services/refundService.js";
import { computeOrderStatus } from "../utils/orderStatus.js";
import { evaluateCoupon } from "../utils/coupon.js";

// Shared order-finalization pipeline used by BOTH the logged-in and guest
// checkout paths: server-side total recompute, coupon re-validation, order
// creation, atomic coupon consumption, and atomic stock decrement with the race
// guard. Returns the created order. Does NOT delete carts or send emails — those
// differ between the two callers.
async function finalizeOrder({ userId = null, isGuest = false, cartId = null, items, address, couponCode, deliveryDate, contactEmail = '' }) {
    // Compute the cart total server-side (for coupon validation / records).
    let cartTotal = 0;
    for (const item of items) {
        const product = await productModel.findById(item.productId).select('variants price');
        if (!product) continue;
        const variant = product.variants.find((v) => v._id.toString() === item.variantId.toString());
        const unitPrice = variant?.price?.amount || product.price?.amount || 0;
        cartTotal += unitPrice * (item.quantity || 1);
    }

    // Apply coupon if provided (re-validated server-side; never trust the client).
    let appliedCode = null;
    let discount = 0;
    let coupon = null;
    if (couponCode) {
        coupon = await couponModel.findOne({ code: String(couponCode).toUpperCase().trim() });
        const result = evaluateCoupon(coupon, cartTotal);
        if (result.valid) {
            appliedCode = coupon.code;
            discount = result.discount;
        }
    }

    // Payment method is the store-wide active method at order time (admin toggle).
    // Razorpay orders are paid upfront → auto-confirmed and "preparing" straight
    // away; WhatsApp orders start 'placed' and the seller confirms manually.
    const settings = await settingsModel.findOne({ key: 'global' });
    const paymentMethod = settings?.payment?.activeMethod === 'razorpay' ? 'razorpay' : 'whatsapp';
    const initialStatus = paymentMethod === 'razorpay' ? 'confirmed' : 'placed';

    const orderItems = items.map((it) => ({
        productId: it.productId,
        variantId: it.variantId,
        quantity: it.quantity || 1,
        status: initialStatus,
    }));

    const order = await orderModel.create({
        userId,
        isGuest,
        cartId,
        items: orderItems,
        status: initialStatus,
        paymentMethod,
        address,
        contactEmail,
        deliveryDate: deliveryDate || null,
        couponCode: appliedCode,
        discount,
    });

    // Consume one coupon use (atomic).
    if (coupon && appliedCode) {
        await couponModel.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
    }

    // Reduce product stock atomically (guard prevents overselling on races).
    for (const item of items) {
        const decremented = await productModel.updateOne(
            {
                _id: item.productId,
                variants: { $elemMatch: { _id: item.variantId, stock: { $gte: item.quantity } } }
            },
            { $inc: { 'variants.$.stock': -item.quantity } }
        );

        // If the guard failed, another order took the stock first — floor at 0
        // so we never store negative stock (item is effectively sold out).
        if (decremented.modifiedCount === 0) {
            await productModel.updateOne(
                { _id: item.productId, 'variants._id': item.variantId },
                { $set: { 'variants.$.stock': 0 } }
            );
            console.warn(`Stock race: variant ${item.variantId} oversold, floored to 0.`);
        }
    }

    return order;
}

const requiredAddressFields = ['fullName', 'phone', 'line1', 'city', 'state'];

export const createOrder = async (req, res) => {

    const userId = req.user;
    const { cartId, address, couponCode, deliveryDate } = req.body;

    if (!cartId) return res.status(400).json({
        message: "Cart Id not provided",
        success: false,
        error: "Cart Id not provided"
    })

    // Validate the shipping address.
    if (!address || requiredAddressFields.some((f) => !address[f])) {
        return res.status(400).json({
            message: "Complete shipping address is required",
            success: false,
            error: "Missing address fields"
        })
    }

    const cart = await cartModel.findById(cartId);

    if (!cart) return res.status(404).json({
        message: "Cart not found",
        success: false,
        error: "Cart not found from cartId: " + cartId
    })

    const order = await finalizeOrder({ userId, cartId, items: cart.items, address, couponCode, deliveryDate });

    // Link the Razorpay payment (created during checkout for this cart) to the
    // order so a refund can later be traced to the captured payment. No-op for
    // WhatsApp/manual orders, which have no payment record.
    await paymentModel.updateOne(
        { cartId, status: 'paid', orderId: null },
        { $set: { orderId: order._id } }
    );

    // Remove cart
    await cartModel.deleteOne({ _id: cartId });

    // Send order emails (non-blocking; no-op if email isn't configured).
    dispatchNewOrderEmails(order, userId).catch((e) => console.error('Order email error:', e.message));

    res.status(201).json({
        message: "Order placed successfully",
        success: true,
        order
    })

}

// Guest checkout: no account and no server-side cart. Items + address come from
// the client. Reuses the exact same finalizeOrder safety pipeline as the
// logged-in path (price recompute, coupon re-validation, atomic stock guard).
export const createGuestOrder = async (req, res) => {

    const { items, address, email, couponCode, deliveryDate } = req.body;

    // Only permitted when the store is configured for guest checkout.
    const settings = await settingsModel.findOne({ key: 'global' });
    if ((settings?.checkout?.mode || 'guest') !== 'guest') {
        return res.status(403).json({
            message: "Guest checkout is not enabled",
            success: false,
            error: "Guest checkout disabled"
        });
    }

    // Validate + normalise the client-supplied items.
    const validItems = Array.isArray(items)
        ? items
            .filter((it) => it && it.productId && it.variantId && (it.quantity || 0) > 0)
            .map((it) => ({ productId: it.productId, variantId: it.variantId, quantity: it.quantity }))
        : [];

    if (validItems.length === 0) {
        return res.status(400).json({
            message: "No valid items to order",
            success: false,
            error: "Items are required"
        });
    }

    // Validate the shipping address.
    if (!address || requiredAddressFields.some((f) => !address[f])) {
        return res.status(400).json({
            message: "Complete shipping address is required",
            success: false,
            error: "Missing address fields"
        });
    }

    const order = await finalizeOrder({ isGuest: true, items: validItems, address, couponCode, deliveryDate, contactEmail: email || '' });

    // Notify sellers + buyer (guest buyer reached via their checkout email).
    dispatchNewOrderEmails(order, null).catch((e) => console.error('Order email error:', e.message));

    res.status(201).json({
        message: "Order placed successfully",
        success: true,
        order
    });

}

// Routes the right emails for a brand-new order based on how it was paid.
// Razorpay orders are already paid → the buyer gets the "confirmed & preparing"
// email automatically (no separate "received" note); WhatsApp orders get the
// standard "order received" note and await manual confirmation.
async function dispatchNewOrderEmails(order, buyerId) {
    if (order.paymentMethod === 'razorpay') {
        await sendOrderEmails(order, buyerId, { buyerReceipt: false }); // seller alerts only
        await sendStatusEmail(order._id, buyerId, 'confirmed');         // auto confirmed & preparing
    } else {
        await sendOrderEmails(order, buyerId); // buyer "received" + seller alerts
    }
}

// Sends a confirmation email to the buyer and a "new order" alert to each
// seller whose product is in the order. Best-effort, never throws to caller.
// Pass { buyerReceipt: false } to send only the seller alerts (e.g. when the
// buyer email is handled elsewhere, such as the razorpay auto-confirm path).
async function sendOrderEmails(order, buyerId, { buyerReceipt = true } = {}) {
    const populated = await orderModel.findById(order._id)
        .populate('items.productId', 'title sellerId');

    if (!populated) return;

    const shortId = order._id.toString().slice(-8).toUpperCase();
    const itemsList = populated.items
        .map((it) => `<li>${it.productId?.title || 'Item'} × ${it.quantity}</li>`)
        .join('');

    // Buyer confirmation
    const buyer = buyerId ? await userModel.findById(buyerId).select('email fullname') : null;
    if (buyerReceipt && buyer?.email) {
        const html = `
            <div style="font-family: Arial, sans-serif; color: #1a1612;">
                <h2>Thank you for your order, ${buyer.fullname || ''}!</h2>
                <p>Your order <strong>#${shortId}</strong> has been placed successfully.</p>
                <ul>${itemsList}</ul>
                <p>We'll let you know when it's ready. — Cakeology</p>
            </div>`;
        await sendEmail(buyer.email, `Order Confirmed · #${shortId}`, html);
    }

    // Seller alerts (one email per distinct seller)
    const sellerIds = [...new Set(
        populated.items
            .map((it) => it.productId?.sellerId?.toString())
            .filter(Boolean)
    )];

    for (const sellerId of sellerIds) {
        const seller = await userModel.findById(sellerId).select('email fullname');
        if (!seller?.email) continue;

        const sellerItems = populated.items
            .filter((it) => it.productId?.sellerId?.toString() === sellerId)
            .map((it) => `<li>${it.productId?.title || 'Item'} × ${it.quantity}</li>`)
            .join('');

        const html = `
            <div style="font-family: Arial, sans-serif; color: #1a1612;">
                <h2>New order received</h2>
                <p>Order <strong>#${shortId}</strong> includes your product(s):</p>
                <ul>${sellerItems}</ul>
                <p>Log in to your Cakeology dashboard to fulfil it.</p>
            </div>`;
        await sendEmail(seller.email, `New Order · #${shortId}`, html);
    }
}

// Buyer cancels their own order (only while it is still 'placed' or 'packed').
export const cancelOrder = async (req, res) => {
    const userId = req.user;
    const { orderId } = req.params;

    const order = await orderModel.findOne({ _id: orderId, userId });

    if (!order) return res.status(404).json({
        message: "Order not found",
        success: false,
        error: "No order found for this user with the provided id"
    });

    if (['ready', 'cancelled'].includes(order.status)) {
        return res.status(400).json({
            message: `Order cannot be cancelled once it is ${order.status}`,
            success: false,
            error: "Order not cancellable"
        });
    }

    await orderModel.updateOne(
        { _id: orderId },
        { status: 'cancelled', $set: { 'items.$[].status': 'cancelled' } }
    );

    // Return stock for the cancelled items (atomic increment).
    for (const item of order.items) {
        if (item.status === 'cancelled') continue;
        await productModel.updateOne(
            { _id: item.productId, 'variants._id': item.variantId },
            { $inc: { 'variants.$.stock': item.quantity } }
        );
    }

    // Notify the buyer their cancellation went through (non-blocking).
    sendStatusEmail(order._id, userId, 'cancelled').catch((e) => console.error('Status email error:', e.message));

    // If the buyer had already paid, alert the admin to issue a refund.
    if (refundOwed(order.paymentMethod, order.status)) {
        notifyAdminRefund(order._id).catch((e) => console.error('Refund notice error:', e.message));
    }

    res.status(200).json({
        message: "Order cancelled",
        success: true,
        order: { _id: order._id, status: 'cancelled' }
    });
}

export const getOrder = async (req, res) => {
    const userId = req.user;

    const order = await orderModel.find({ userId })
        .populate('items.productId', 'title images price variants')
        .sort({ _id: -1 });

    if (!order || order.length === 0) return res.status(404).json({
        message: "Order not exist",
        success: false,
        error: "No order found"
    })

    res.status(200).json({
        message: "Fetched order details",
        success: true,
        order
    })


}

// Orders that contain at least one product owned by the logged-in seller.
// Each returned order only includes the items belonging to this seller, and a
// `sellerStatus` derived from just those items.
export const getSellerOrders = async (req, res) => {
    const sellerId = req.user;

    const products = await productModel.find({ sellerId }).select('_id');
    const productIds = products.map((p) => p._id);

    if (productIds.length === 0) {
        return res.status(200).json({
            message: "No products for this seller yet",
            success: true,
            orders: []
        });
    }

    const orders = await orderModel.find({ 'items.productId': { $in: productIds } })
        .populate('items.productId', 'title images price variants sellerId')
        .populate('userId', 'fullname email contact')
        .sort({ createdAt: -1 });

    // Keep only the items that belong to this seller.
    const sellerProductIdSet = new Set(productIds.map((id) => id.toString()));

    const sellerOrders = orders.map((order) => {
        const obj = order.toObject();
        obj.items = obj.items.filter(
            (item) => item.productId && sellerProductIdSet.has(item.productId._id.toString())
        );
        obj.sellerStatus = computeOrderStatus(obj.items);
        return obj;
    });

    res.status(200).json({
        message: "Fetched seller orders",
        success: true,
        orders: sellerOrders
    });
}

// Emails the buyer when their order's fulfillment status changes. Reaches the
// logged-in buyer's account email, or the guest's contact email for guest orders.
async function sendStatusEmail(orderId, buyerId, status) {
    let recipient = null;
    let recipientName = '';

    if (buyerId) {
        const buyer = await userModel.findById(buyerId).select('email fullname');
        recipient = buyer?.email || null;
        recipientName = buyer?.fullname || '';
    }
    // Guest order (or account without email): use the email collected at checkout.
    if (!recipient) {
        const order = await orderModel.findById(orderId).select('contactEmail address');
        recipient = order?.contactEmail || null;
        recipientName = order?.address?.fullName || '';
    }
    if (!recipient) return;

    const shortId = orderId.toString().slice(-8).toUpperCase();
    // Subject + body copy per seller-settable status.
    const messages = {
        placed: {
            subject: 'Received',
            line: 'has been received and is awaiting confirmation.',
        },
        confirmed: {
            subject: 'Confirmed & Preparing',
            line: "has been confirmed and we've started preparing it. We'll let you know the moment it's ready.",
        },
        ready: {
            subject: 'Ready for Delivery / Pickup',
            line: 'is ready for delivery or pickup.',
        },
        cancelled: {
            subject: 'Cancelled',
            line: 'has been cancelled.',
        },
    };
    const copy = messages[status] || { subject: status, line: `is now ${status}.` };

    const html = `
        <div style="font-family: Arial, sans-serif; color: #1a1612;">
            <h2>Order Update</h2>
            <p>Hi ${recipientName || ''},</p>
            <p>Your order <strong>#${shortId}</strong> ${copy.line}</p>
            <p style="color:#9a9089; font-size:12px; margin-top:24px;">— Cakeology</p>
        </div>`;

    await sendEmail(recipient, `Order #${shortId} · ${copy.subject}`, html);
}

// True when the buyer had actually paid before cancelling, so a refund is owed:
// Razorpay is paid upfront; a WhatsApp order counts as paid once the seller had
// confirmed it (status moved past 'placed').
const refundOwed = (paymentMethod, statusBeforeCancel) =>
    paymentMethod === 'razorpay' || ['confirmed', 'ready'].includes(statusBeforeCancel);

// Raises an admin "refund needed" notification for a cancelled, paid order.
// Best-effort; never throws to the caller.
async function notifyAdminRefund(orderId) {
    const order = await orderModel.findById(orderId).populate('items.productId', 'title variants price');
    if (!order) return;

    // Sum line prices for the order, minus any applied discount.
    let amount = 0;
    for (const item of order.items) {
        const product = item.productId;
        if (!product) continue;
        const variant = product.variants?.find((v) => v._id?.toString() === item.variantId?.toString());
        const unit = variant?.price?.amount || product.price?.amount || 0;
        amount += unit * (item.quantity || 1);
    }
    amount = Math.max(0, amount - (order.discount || 0));

    const shortId = order._id.toString().slice(-8).toUpperCase();
    const buyerName = order.address?.fullName || 'Customer';
    const via = order.paymentMethod === 'razorpay' ? 'Razorpay' : 'WhatsApp / UPI';

    await notificationModel.create({
        type: 'refund',
        orderId: order._id,
        paymentMethod: order.paymentMethod,
        amount,
        message: `Refund needed for cancelled order #${shortId} (${buyerName}) — ₹${amount.toLocaleString('en-IN')} paid via ${via}.`,
    });
}

// Seller updates the fulfillment status of *their* items in an order.
// Other sellers' items in the same order are untouched.
export const updateOrderStatus = async (req, res) => {
    const sellerId = req.user;
    const { orderId } = req.params;
    const { status } = req.body;

    // Sellers can set one of three fulfillment states.
    const allowedStatuses = ['confirmed', 'ready', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid order status",
            success: false,
            error: `Status must be one of: ${allowedStatuses.join(', ')}`
        });
    }

    const order = await orderModel.findById(orderId).populate('items.productId', 'sellerId');

    if (!order) return res.status(404).json({
        message: "Order not found",
        success: false,
        error: "No order found with the provided id"
    });

    // Status before this update — used to decide whether a refund is owed.
    const prevStatus = order.status;

    // Items belonging to this seller.
    const sellerItems = order.items.filter(
        (item) => item.productId && item.productId.sellerId?.toString() === sellerId
    );

    if (sellerItems.length === 0) return res.status(403).json({
        message: "Not authorised to update this order",
        success: false,
        error: "Order does not contain any of your products"
    });

    // Restock the seller's items that are newly cancelled.
    if (status === 'cancelled') {
        for (const item of sellerItems) {
            if (item.status === 'cancelled') continue;
            const productId = item.productId?._id || item.productId;
            await productModel.updateOne(
                { _id: productId, 'variants._id': item.variantId },
                { $inc: { 'variants.$.stock': item.quantity } }
            );
        }
    }

    // Apply the new status to the seller's items only.
    sellerItems.forEach((item) => { item.status = status; });

    // Recompute the overall order status from all items.
    order.status = computeOrderStatus(order.items);

    await order.save({ validateBeforeSave: false });

    // Notify the buyer of the status change (non-blocking).
    sendStatusEmail(order._id, order.userId, status).catch((e) => console.error('Status email error:', e.message));

    // If a paid order was just cancelled, alert the admin to issue a refund.
    if (status === 'cancelled' && refundOwed(order.paymentMethod, prevStatus)) {
        notifyAdminRefund(order._id).catch((e) => console.error('Refund notice error:', e.message));
    }

    res.status(200).json({
        message: "Order status updated",
        success: true,
        order: { _id: order._id, status: order.status }
    });
}

// Refund notifications for orders that contain one of this seller's products.
// Lets a seller see and action refunds for their own cancelled orders.
export const getSellerNotifications = async (req, res) => {
    const sellerId = req.user;

    const products = await productModel.find({ sellerId }).select('_id');
    const productIds = products.map((p) => p._id);

    if (productIds.length === 0) {
        return res.status(200).json({ message: "No products for this seller yet", success: true, notifications: [], unresolvedCount: 0 });
    }

    // Orders containing at least one of the seller's products.
    const orders = await orderModel.find({ 'items.productId': { $in: productIds } }).select('_id');
    const orderIds = orders.map((o) => o._id);

    const notifications = await notificationModel
        .find({ orderId: { $in: orderIds } })
        .sort({ resolved: 1, createdAt: -1 })
        .limit(100);

    const unresolvedCount = notifications.filter((n) => !n.resolved).length;

    res.status(200).json({ message: "Fetched notifications", success: true, notifications, unresolvedCount });
}

// Seller marks a refund done for one of *their own* orders' notifications.
export const resolveSellerNotification = async (req, res) => {
    const sellerId = req.user;
    const { notificationId } = req.params;

    const notification = await notificationModel.findById(notificationId);
    if (!notification) return res.status(404).json({ message: "Notification not found", success: false, error: "Not found" });

    if (notification.resolved) {
        return res.status(200).json({ message: "Already resolved", success: true, notificationId });
    }

    // Confirm the notification's order actually contains one of this seller's products.
    const order = await orderModel.findById(notification.orderId).populate('items.productId', 'sellerId');
    const ownsItem = order?.items?.some((it) => it.productId?.sellerId?.toString() === sellerId);
    if (!ownsItem) {
        return res.status(403).json({ message: "Not authorised for this notification", success: false, error: "Order has none of your products" });
    }

    // For a Razorpay order, issue the live refund; WhatsApp/UPI is acknowledged only.
    let refund = { status: 'manual' };
    if (notification.paymentMethod === 'razorpay' && notification.orderId) {
        try {
            refund = await refundForOrder(notification.orderId);
        } catch (e) {
            return res.status(502).json({ message: `Razorpay refund failed: ${refundErrorMessage(e)}`, success: false, error: "refund_failed" });
        }
    }

    notification.resolved = true;
    notification.resolvedAt = new Date();
    notification.resolvedBy = 'seller';
    await notification.save();

    res.status(200).json({
        message: refund.status === 'refunded' ? `Refund of ₹${refund.amount} issued via Razorpay` : "Marked refunded",
        success: true,
        notificationId,
        refund,
    });
}

// Seller dashboard metrics: revenue, units sold, order count, low stock, best sellers.
export const getSellerMetrics = async (req, res) => {
    const sellerId = req.user;

    const products = await productModel.find({ sellerId });
    const productIdSet = new Set(products.map((p) => p._id.toString()));

    const orders = await orderModel.find({ 'items.productId': { $in: products.map((p) => p._id) } });

    let revenue = 0;
    let unitsSold = 0;
    const orderIds = new Set();
    const unitsByProduct = {}; // productId -> { title, units, revenue }
    const revenueByCategory = {}; // category -> revenue
    const statusCounts = { placed: 0, confirmed: 0, ready: 0, cancelled: 0 };

    // Daily series for the last 30 days.
    const DAYS = 30;
    const dayMap = {}; // 'YYYY-MM-DD' -> { revenue, orders:Set, units }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const seriesKeys = [];
    for (let i = DAYS - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        seriesKeys.push(key);
        dayMap[key] = { revenue: 0, orderSet: new Set(), units: 0 };
    }

    for (const order of orders) {
        // Per-seller order status for the status breakdown.
        const sellerItemsForStatus = order.items.filter((it) => productIdSet.has(it.productId?.toString()));
        const sStatus = computeOrderStatus(sellerItemsForStatus);
        if (statusCounts[sStatus] !== undefined) statusCounts[sStatus] += 1;

        const dayKey = (order.createdAt ? new Date(order.createdAt) : new Date()).toISOString().slice(0, 10);

        for (const item of order.items) {
            const pid = item.productId?.toString();
            if (!pid || !productIdSet.has(pid)) continue;
            if (item.status === 'cancelled') continue;

            const product = products.find((p) => p._id.toString() === pid);
            if (!product) continue;

            const variant = product.variants.find((v) => v._id.toString() === item.variantId?.toString());
            const unitPrice = variant?.price?.amount || product.price?.amount || 0;
            const lineRevenue = unitPrice * (item.quantity || 1);

            revenue += lineRevenue;
            unitsSold += item.quantity || 1;
            orderIds.add(order._id.toString());

            if (!unitsByProduct[pid]) unitsByProduct[pid] = { title: product.title, units: 0, revenue: 0 };
            unitsByProduct[pid].units += item.quantity || 1;
            unitsByProduct[pid].revenue += lineRevenue;

            const cat = product.category || 'uncategorized';
            revenueByCategory[cat] = (revenueByCategory[cat] || 0) + lineRevenue;

            if (dayMap[dayKey]) {
                dayMap[dayKey].revenue += lineRevenue;
                dayMap[dayKey].units += item.quantity || 1;
                dayMap[dayKey].orderSet.add(order._id.toString());
            }
        }
    }

    const salesSeries = seriesKeys.map((key) => ({
        date: key,
        revenue: dayMap[key].revenue,
        orders: dayMap[key].orderSet.size,
        units: dayMap[key].units,
    }));

    const categoryBreakdown = Object.entries(revenueByCategory)
        .map(([category, rev]) => ({ category, revenue: rev }))
        .sort((a, b) => b.revenue - a.revenue);

    const statusBreakdown = Object.entries(statusCounts)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({ status, count }));

    // Low / out-of-stock products (by total variant stock).
    const lowStock = products
        .map((p) => {
            const totalStock = (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
            return { _id: p._id, title: p.title, stock: totalStock };
        })
        .filter((p) => p.stock <= 5)
        .sort((a, b) => a.stock - b.stock);

    const bestSellers = Object.values(unitsByProduct)
        .sort((a, b) => b.units - a.units)
        .slice(0, 5);

    res.status(200).json({
        message: "Fetched seller metrics",
        success: true,
        metrics: {
            revenue,
            unitsSold,
            orderCount: orderIds.size,
            productCount: products.length,
            lowStock,
            bestSellers,
            salesSeries,
            categoryBreakdown,
            statusBreakdown,
        }
    });
}