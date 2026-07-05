import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import paymentModel from "../models/paymentModel.js";
import notificationModel from "../models/notificationModel.js";
import customCakeModel from "../models/customCakeModel.js";
import { refundPayment, refundForOrder, refundErrorMessage } from "../services/refundService.js";

// Custom-cake orders live in their own collection with a richer lifecycle.
// These maps fold them into the admin Orders vocabulary (New/Preparing/Ready/
// Cancelled) so they filter, count, and display alongside catalog orders.
const CUSTOM_TO_ADMIN_STATUS = {
    pending: 'placed', quoted: 'placed', awaiting_payment: 'placed',
    paid: 'confirmed', preparing: 'confirmed',
    ready: 'ready', delivered: 'ready',
    rejected: 'cancelled', cancelled: 'cancelled',
};
const CUSTOM_STATUS_LABEL = {
    pending: 'New request', quoted: 'Quoted', awaiting_payment: 'Awaiting payment',
    paid: 'Confirmed', preparing: 'Preparing', ready: 'Ready',
    delivered: 'Delivered', rejected: 'Declined', cancelled: 'Cancelled',
};
// A custom order counts as revenue-generating once payment is confirmed.
const CUSTOM_PAID = new Set(['paid', 'preparing', 'ready', 'delivered']);

// Platform-wide dashboard metrics.
export const getAdminMetrics = async (req, res) => {
    const [users, products, orders, customReqs] = await Promise.all([
        userModel.find().select('role createdAt isBlocked'),
        productModel.find().select('variants price'),
        orderModel.find().select('items status createdAt'),
        customCakeModel.find().select('status quotedPrice createdAt'),
    ]);

    // Revenue across all non-cancelled order items (uses product/variant price).
    const productById = new Map(products.map((p) => [p._id.toString(), p]));
    let revenue = 0;
    let unitsSold = 0;
    const statusCounts = { placed: 0, confirmed: 0, ready: 0, cancelled: 0 };

    // 30-day revenue series.
    const DAYS = 30;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayMap = {};
    const seriesKeys = [];
    for (let i = DAYS - 1; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        seriesKeys.push(key);
        dayMap[key] = 0;
    }

    for (const order of orders) {
        if (statusCounts[order.status] !== undefined) statusCounts[order.status] += 1;
        const dayKey = (order.createdAt ? new Date(order.createdAt) : new Date()).toISOString().slice(0, 10);
        for (const item of order.items) {
            if (item.status === 'cancelled') continue;
            const product = productById.get(item.productId?.toString());
            if (!product) continue;
            const variant = product.variants.find((v) => v._id.toString() === item.variantId?.toString());
            const unitPrice = variant?.price?.amount || product.price?.amount || 0;
            const line = unitPrice * (item.quantity || 1);
            revenue += line;
            unitsSold += item.quantity || 1;
            if (dayMap[dayKey] !== undefined) dayMap[dayKey] += line;
        }
    }

    // Fold custom-cake orders into the same totals: count them in the status
    // breakdown (mapped buckets) and add confirmed/paid ones to revenue.
    for (const r of customReqs) {
        const bucket = CUSTOM_TO_ADMIN_STATUS[r.status];
        if (bucket && statusCounts[bucket] !== undefined) statusCounts[bucket] += 1;
        if (CUSTOM_PAID.has(r.status)) {
            const amt = r.quotedPrice?.amount || 0;
            revenue += amt;
            const dayKey = (r.createdAt ? new Date(r.createdAt) : new Date()).toISOString().slice(0, 10);
            if (dayMap[dayKey] !== undefined) dayMap[dayKey] += amt;
        }
    }

    const revenueSeries = seriesKeys.map((key) => ({ date: key, revenue: dayMap[key] }));

    const roleCounts = users.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
    }, {});

    res.status(200).json({
        message: "Fetched admin metrics",
        success: true,
        metrics: {
            revenue,
            unitsSold,
            orderCount: orders.length + customReqs.length,
            userCount: users.length,
            productCount: products.length,
            buyerCount: roleCounts.buyer || 0,
            sellerCount: roleCounts.seller || 0,
            blockedCount: users.filter((u) => u.isBlocked).length,
            statusBreakdown: Object.entries(statusCounts).filter(([, c]) => c > 0).map(([status, count]) => ({ status, count })),
            revenueSeries,
        }
    });
}

// All orders across the store, enriched for the admin Orders view: status,
// payment method + whether payment is done, computed amount, and refund state.
export const getAdminOrders = async (req, res) => {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    const orders = await orderModel.find(query)
        .populate('items.productId', 'title variants price')
        .populate('userId', 'fullname email')
        .sort({ createdAt: -1 })
        .limit(200);

    // Map refund notifications by order so each row can show its refund state.
    const refundNotifs = await notificationModel.find({ type: 'refund' }).select('orderId resolved resolvedBy');
    const refundByOrder = new Map();
    for (const n of refundNotifs) {
        if (n.orderId) refundByOrder.set(n.orderId.toString(), { resolved: n.resolved, resolvedBy: n.resolvedBy });
    }

    const shaped = orders.map((o) => {
        let amount = 0;
        const items = (o.items || []).map((it) => {
            const product = it.productId;
            const variant = product?.variants?.find((v) => v._id?.toString() === it.variantId?.toString());
            const unit = variant?.price?.amount || product?.price?.amount || 0;
            amount += unit * (it.quantity || 1);
            return { title: product?.title || 'Item', quantity: it.quantity || 1, status: it.status };
        });
        amount = Math.max(0, amount - (o.discount || 0));

        const paymentMethod = o.paymentMethod || 'razorpay';
        // Razorpay is paid upfront; a WhatsApp order counts as paid once it's past 'placed'.
        const paid = paymentMethod === 'razorpay' || o.status !== 'placed';

        return {
            _id: o._id,
            createdAt: o.createdAt,
            status: o.status,
            paymentMethod,
            paid,
            isGuest: o.isGuest,
            buyerName: o.userId?.fullname || o.address?.fullName || 'Customer',
            buyerEmail: o.userId?.email || o.contactEmail || '',
            amount,
            items,
            deliveryDate: o.deliveryDate,
            refund: refundByOrder.get(o._id.toString()) || null, // null | { resolved, resolvedBy }
        };
    });

    // Merge in custom-cake orders (own collection) so the admin sees every order
    // in one place. Each is tagged isCustom + carries its true custom status label.
    const customReqs = await customCakeModel.find()
        .populate('userId', 'fullname email')
        .sort({ createdAt: -1 })
        .limit(200);

    const shapedCustom = customReqs.map((r) => ({
        _id: r._id,
        createdAt: r.createdAt,
        status: CUSTOM_TO_ADMIN_STATUS[r.status] || 'placed',
        isCustom: true,
        customStatus: r.status,
        customStatusLabel: CUSTOM_STATUS_LABEL[r.status] || r.status,
        paymentMethod: r.paymentMethod || 'razorpay',
        paid: CUSTOM_PAID.has(r.status),
        isGuest: false,
        buyerName: r.userId?.fullname || 'Customer',
        buyerEmail: r.userId?.email || '',
        amount: r.quotedPrice?.amount || r.budget || 0,
        items: [{ title: r.title || 'Custom Cake', quantity: 1, status: r.status }],
        deliveryDate: r.requiredDate,
        // Reflect the custom order's own refund state in the shared admin shape.
        refund: r.refund?.status
            ? { resolved: true, resolvedBy: r.refund.status === 'refunded' ? 'razorpay' : 'staff' }
            : null,
        canRefund: ['paid', 'preparing', 'ready'].includes(r.status),
    }));

    let all = [...shaped, ...shapedCustom];
    // The catalog query already applied the status filter server-side; apply the
    // same (mapped) filter to the custom orders so both honour ?status=.
    if (status && status !== 'all') all = all.filter((o) => o.status === status);
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ message: "Fetched orders", success: true, orders: all });
}

// List all users (with optional role/search filters via query).
export const getAllUsers = async (req, res) => {
    const { role, search } = req.query;
    const query = {};
    if (role && role !== 'all') query.role = role;
    if (search) {
        query.$or = [
            { fullname: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }
    const users = await userModel.find(query).sort({ createdAt: -1 });
    res.status(200).json({ message: "Fetched users", success: true, users });
}

// Block or unblock a user (cannot target other admins).
export const toggleBlockUser = async (req, res) => {
    const { userId } = req.params;

    if (userId === req.user) {
        return res.status(400).json({ message: "You cannot block yourself", success: false, error: "Self action" });
    }

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found", success: false, error: "Not found" });

    if (user.role === 'admin') {
        return res.status(403).json({ message: "Cannot block an admin", success: false, error: "Protected" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: user.isBlocked ? "User blocked" : "User unblocked", success: true, userId, isBlocked: user.isBlocked });
}

// Delete a user (cannot delete admins or self).
export const deleteUser = async (req, res) => {
    const { userId } = req.params;

    if (userId === req.user) {
        return res.status(400).json({ message: "You cannot delete yourself", success: false, error: "Self action" });
    }

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found", success: false, error: "Not found" });

    if (user.role === 'admin') {
        return res.status(403).json({ message: "Cannot delete an admin", success: false, error: "Protected" });
    }

    await userModel.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted", success: true, userId });
}

// List payment transactions with optional status filter + summary totals.
export const getTransactions = async (req, res) => {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') {
        if (status === 'refunded') query.refunded = true;
        else query.status = status;
    }

    const payments = await paymentModel.find(query)
        .populate('userId', 'fullname email')
        .sort({ createdAt: -1 })
        .limit(200);

    // Summary across all payments (not just the filtered page).
    const all = await paymentModel.find().select('price status refunded');
    const collected = all.filter((p) => p.status === 'paid' && !p.refunded).reduce((s, p) => s + (p.price?.amount || 0), 0);
    const refundedTotal = all.filter((p) => p.refunded).reduce((s, p) => s + (p.price?.amount || 0), 0);

    res.status(200).json({
        message: "Fetched transactions",
        success: true,
        payments,
        summary: {
            collected,
            refundedTotal,
            paidCount: all.filter((p) => p.status === 'paid' && !p.refunded).length,
            pendingCount: all.filter((p) => p.status === 'pending').length,
            failedCount: all.filter((p) => p.status === 'failed').length,
            refundedCount: all.filter((p) => p.refunded).length,
        }
    });
}

// Issue a live Razorpay refund for a paid transaction.
export const refundTransaction = async (req, res) => {
    const { paymentId } = req.params;
    const payment = await paymentModel.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Transaction not found", success: false, error: "Not found" });

    if (payment.status !== 'paid') {
        return res.status(400).json({ message: "Only paid transactions can be refunded", success: false, error: "Not refundable" });
    }
    if (payment.refunded) {
        return res.status(400).json({ message: "Already refunded", success: false, error: "Already refunded" });
    }
    if (!payment.order?.razorpay_payment_id) {
        return res.status(400).json({ message: "No Razorpay payment id — cannot auto-refund", success: false, error: "No payment id" });
    }

    try {
        const refund = await refundPayment(payment);
        res.status(200).json({ message: `Refund issued via Razorpay (${refund.id})`, success: true, paymentId, refundId: refund.id });
    } catch (e) {
        res.status(502).json({ message: `Razorpay refund failed: ${refundErrorMessage(e)}`, success: false, error: "refund_failed" });
    }
}

// Admin notifications (currently refund requests). Unresolved first, newest first.
export const getNotifications = async (req, res) => {
    const notifications = await notificationModel
        .find()
        .sort({ resolved: 1, createdAt: -1 })
        .limit(100);

    const unresolvedCount = await notificationModel.countDocuments({ resolved: false });

    res.status(200).json({
        message: "Fetched notifications",
        success: true,
        notifications,
        unresolvedCount,
    });
}

// Resolve a refund notification. For a Razorpay order this issues the live
// refund via the API; WhatsApp/UPI orders are just acknowledged (manual refund).
export const resolveNotification = async (req, res) => {
    const { notificationId } = req.params;
    const notification = await notificationModel.findById(notificationId);
    if (!notification) return res.status(404).json({ message: "Notification not found", success: false, error: "Not found" });

    if (notification.resolved) {
        return res.status(200).json({ message: "Already resolved", success: true, notificationId });
    }

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
    notification.resolvedBy = 'admin';
    await notification.save();

    res.status(200).json({
        message: refund.status === 'refunded' ? `Refund of ₹${refund.amount} issued via Razorpay` : "Marked refunded",
        success: true,
        notificationId,
        refund,
    });
}

// Aggregated reports over a date range (?range=days, default 30).
export const getReports = async (req, res) => {
    const days = Math.max(1, Math.min(365, Number(req.query.range) || 30));
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const products = await productModel.find().select('title category variants price');
    const productById = new Map(products.map((p) => [p._id.toString(), p]));

    const orders = await orderModel.find({ createdAt: { $gte: start } }).populate('userId', 'fullname email');

    // Day buckets.
    const dayMap = {};
    const seriesKeys = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        seriesKeys.push(key);
        dayMap[key] = { revenue: 0, orders: 0 };
    }

    let totalRevenue = 0;
    let totalUnits = 0;
    const statusCounts = { placed: 0, confirmed: 0, ready: 0, cancelled: 0 };
    const revByCategory = {};
    const byProduct = {}; // pid -> { title, units, revenue }
    const byCustomer = {}; // userId -> { name, email, spent, orders }

    for (const order of orders) {
        if (statusCounts[order.status] !== undefined) statusCounts[order.status] += 1;
        const dayKey = (order.createdAt ? new Date(order.createdAt) : new Date()).toISOString().slice(0, 10);
        if (dayMap[dayKey]) dayMap[dayKey].orders += 1;

        const custId = order.userId?._id?.toString() || 'unknown';
        if (!byCustomer[custId]) byCustomer[custId] = { name: order.userId?.fullname || 'Customer', email: order.userId?.email || '', spent: 0, orders: 0 };
        byCustomer[custId].orders += 1;

        for (const item of order.items) {
            if (item.status === 'cancelled') continue;
            const product = productById.get(item.productId?.toString());
            if (!product) continue;
            const variant = product.variants.find((v) => v._id.toString() === item.variantId?.toString());
            const unitPrice = variant?.price?.amount || product.price?.amount || 0;
            const line = unitPrice * (item.quantity || 1);

            totalRevenue += line;
            totalUnits += item.quantity || 1;
            if (dayMap[dayKey]) dayMap[dayKey].revenue += line;

            const cat = product.category || 'uncategorized';
            revByCategory[cat] = (revByCategory[cat] || 0) + line;

            const pid = product._id.toString();
            if (!byProduct[pid]) byProduct[pid] = { title: product.title, units: 0, revenue: 0 };
            byProduct[pid].units += item.quantity || 1;
            byProduct[pid].revenue += line;

            byCustomer[custId].spent += line;
        }
    }

    const salesSeries = seriesKeys.map((key) => ({ date: key, revenue: dayMap[key].revenue, orders: dayMap[key].orders }));
    const categoryRevenue = Object.entries(revByCategory).map(([category, revenue]) => ({ category, revenue })).sort((a, b) => b.revenue - a.revenue);
    const topProducts = Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    const topCustomers = Object.values(byCustomer).filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent).slice(0, 8);

    const newCustomers = await userModel.countDocuments({ role: 'buyer', createdAt: { $gte: start } });

    res.status(200).json({
        message: "Fetched reports",
        success: true,
        report: {
            range: days,
            totalRevenue,
            totalOrders: orders.length,
            totalUnits,
            newCustomers,
            avgOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0,
            salesSeries,
            categoryRevenue,
            topProducts,
            topCustomers,
            statusBreakdown: Object.entries(statusCounts).filter(([, c]) => c > 0).map(([status, count]) => ({ status, count })),
        }
    });
}
