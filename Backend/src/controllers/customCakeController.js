import customCakeModel from "../models/customCakeModel.js";
import userModel from "../models/userModel.js";
import razorpay from "../services/paymentService.js";
import ImagetKitUpload from "../services/imagekit.js";
import sendEmail from "../services/emailService.js";
import { refundByPaymentId, refundErrorMessage } from "../services/refundService.js";
import { Config } from "../config/config.js";
import { validatePaymentVerification } from '../../node_modules/razorpay/dist/utils/razorpay-utils.js';

const shortId = (id) => id.toString().slice(-8).toUpperCase();

// ── Buyer: create a custom cake request ───────────────────────────────────
export const createCustomRequest = async (req, res) => {
    const userId = req.user;
    const { title, description, flavor, weight, requiredDate, budget } = req.body;

    if (!req.file) return res.status(400).json({
        message: "A design image is required",
        success: false,
        error: "No design image uploaded"
    });

    if (!requiredDate) return res.status(400).json({
        message: "Required date is needed",
        success: false,
        error: "requiredDate missing"
    });

    const designImage = await ImagetKitUpload(req.file.buffer, req.file.originalname, '/Cakeology/CustomDesigns/');

    const request = await customCakeModel.create({
        userId,
        designImage,
        title: title || '',
        description: description || '',
        flavor: flavor || '',
        weight: weight || '',
        requiredDate,
        budget: budget ? Number(budget) : null,
        status: 'pending',
    });

    // Best-effort: alert sellers that a new request is waiting.
    notifySellersOfNewRequest(request).catch((e) => console.error('Custom request seller email error:', e.message));

    res.status(201).json({
        message: "Custom cake request submitted",
        success: true,
        request
    });
};

// ── Buyer: list own requests ──────────────────────────────────────────────
export const getMyCustomRequests = async (req, res) => {
    const userId = req.user;
    const requests = await customCakeModel.find({ userId })
        .populate('sellerId', 'fullname email')
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "Fetched custom cake requests",
        success: true,
        requests
    });
};

// ── Buyer: cancel a request (only before payment) ─────────────────────────
export const cancelCustomRequest = async (req, res) => {
    const userId = req.user;
    const { requestId } = req.params;

    const request = await customCakeModel.findOne({ _id: requestId, userId });
    if (!request) return res.status(404).json({
        message: "Request not found", success: false, error: "Request not found"
    });

    if (!['pending', 'quoted', 'rejected'].includes(request.status)) {
        return res.status(400).json({
            message: "This request can no longer be cancelled",
            success: false,
            error: `Cannot cancel a request in status '${request.status}'`
        });
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({ message: "Request cancelled", success: true, request });
};

// ── Seller: list requests (open/pending + ones assigned to this seller) ───
export const getSellerCustomRequests = async (req, res) => {
    const sellerId = req.user;

    const requests = await customCakeModel.find({
        $or: [
            { status: 'pending' },          // open for any seller to quote
            { sellerId }                    // already claimed by this seller
        ]
    })
        .populate('userId', 'fullname email contact')
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "Fetched seller custom requests",
        success: true,
        requests
    });
};

// ── Seller: quote a price (claims the request) ────────────────────────────
export const quoteCustomRequest = async (req, res) => {
    const sellerId = req.user;
    const { requestId } = req.params;
    const { amount, currency = 'INR', sellerNote } = req.body;

    if (!amount || Number(amount) <= 0) return res.status(400).json({
        message: "A valid price is required",
        success: false,
        error: "Invalid quote amount"
    });

    const request = await customCakeModel.findById(requestId);
    if (!request) return res.status(404).json({
        message: "Request not found", success: false, error: "Request not found"
    });

    // Only pending requests (or ones already owned by this seller) can be quoted.
    if (request.status !== 'pending' && request.sellerId?.toString() !== sellerId) {
        return res.status(400).json({
            message: "This request has already been taken by another seller",
            success: false,
            error: "Request not available"
        });
    }

    request.sellerId = sellerId;
    request.quotedPrice = { amount: Number(amount), currency };
    request.sellerNote = sellerNote || '';
    request.status = 'quoted';
    await request.save();

    notifyBuyerQuoted(request).catch((e) => console.error('Custom request buyer email error:', e.message));

    res.status(200).json({ message: "Quote sent to buyer", success: true, request });
};

// ── Seller: reject a request ──────────────────────────────────────────────
export const rejectCustomRequest = async (req, res) => {
    const sellerId = req.user;
    const { requestId } = req.params;
    const { sellerNote } = req.body;

    const request = await customCakeModel.findById(requestId);
    if (!request) return res.status(404).json({
        message: "Request not found", success: false, error: "Request not found"
    });

    if (!['pending', 'quoted'].includes(request.status)) {
        return res.status(400).json({
            message: "This request can no longer be rejected",
            success: false,
            error: `Cannot reject a request in status '${request.status}'`
        });
    }

    request.sellerId = sellerId;
    request.sellerNote = sellerNote || '';
    request.status = 'rejected';
    await request.save();

    notifyBuyerRejected(request).catch((e) => console.error('Custom request buyer email error:', e.message));

    res.status(200).json({ message: "Request rejected", success: true, request });
};

// ── Seller: advance fulfilment status after payment ───────────────────────
export const updateCustomRequestStatus = async (req, res) => {
    const sellerId = req.user;
    const { requestId } = req.params;
    const { status } = req.body;

    const allowed = ['preparing', 'ready', 'delivered'];
    if (!allowed.includes(status)) return res.status(400).json({
        message: "Invalid status",
        success: false,
        error: `Status must be one of ${allowed.join(', ')}`
    });

    const request = await customCakeModel.findOne({ _id: requestId, sellerId });
    if (!request) return res.status(404).json({
        message: "Request not found", success: false, error: "Request not found"
    });

    if (!['paid', 'preparing', 'ready'].includes(request.status)) {
        return res.status(400).json({
            message: "Status can only change after payment",
            success: false,
            error: `Cannot update a request in status '${request.status}'`
        });
    }

    request.status = status;
    await request.save();

    notifyBuyerStatus(request, status).catch((e) => console.error('Custom request buyer email error:', e.message));

    res.status(200).json({ message: "Status updated", success: true, request });
};

// ── Seller / Admin: cancel a paid custom order and refund the buyer ────────
// Only confirmed/paid orders (paid | preparing | ready) reach here. Razorpay
// orders get a live full refund; WhatsApp (offline) orders are acknowledged for
// a manual refund. The two handlers differ only in ownership scope.
export const sellerCancelCustomOrder = async (req, res) => {
    const request = await customCakeModel.findOne({ _id: req.params.requestId, sellerId: req.user });
    if (!request) return res.status(404).json({ message: "Request not found", success: false, error: "Request not found" });
    return handleCustomCancelRefund(request, res);
};

export const adminCancelCustomOrder = async (req, res) => {
    const request = await customCakeModel.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found", success: false, error: "Request not found" });
    return handleCustomCancelRefund(request, res);
};

async function handleCustomCancelRefund(request, res) {
    if (!['paid', 'preparing', 'ready'].includes(request.status)) {
        return res.status(400).json({
            message: "Only a confirmed/paid custom order can be cancelled & refunded",
            success: false,
            error: `Request status is '${request.status}'`,
        });
    }

    // Razorpay = live gateway refund; WhatsApp/offline = manual acknowledgement.
    let result = { status: 'manual', amount: request.quotedPrice?.amount || 0, refundId: null };
    if (request.paymentMethod === 'razorpay' && request.payment?.razorpay_payment_id && !request.refund?.refunded) {
        try {
            const refund = await refundByPaymentId(request.payment.razorpay_payment_id);
            result = { status: 'refunded', refundId: refund.id, amount: request.quotedPrice?.amount || 0 };
        } catch (e) {
            return res.status(502).json({ message: `Razorpay refund failed: ${refundErrorMessage(e)}`, success: false, error: 'refund_failed' });
        }
    }

    request.refund = {
        refunded: result.status === 'refunded',
        status: result.status,
        refundId: result.refundId,
        amount: result.amount,
        refundedAt: new Date(),
    };
    request.status = 'cancelled';
    await request.save();

    notifyBuyerRefundCancelled(request, result).catch((e) => console.error('Custom refund email error:', e.message));

    return res.status(200).json({
        message: result.status === 'refunded'
            ? `Order cancelled · ₹${result.amount.toLocaleString('en-IN')} refunded via Razorpay`
            : "Order cancelled · marked for manual refund",
        success: true,
        request,
        refund: result,
    });
}

// ── Buyer: create a Razorpay order to pay a quoted request ────────────────
export const createCustomPayment = async (req, res) => {
    const userId = req.user;
    const { requestId } = req.params;

    const request = await customCakeModel.findOne({ _id: requestId, userId });
    if (!request) return res.status(404).json({
        message: "Request not found", success: false, error: "Request not found"
    });

    if (request.status !== 'quoted') return res.status(400).json({
        message: "This request is not ready for payment",
        success: false,
        error: `Request status is '${request.status}'`
    });

    const options = {
        amount: Math.round(request.quotedPrice.amount * 100),
        currency: request.quotedPrice.currency || 'INR',
    };

    const order = await razorpay.orders.create(options);

    request.payment.razorpay_order_id = order.id;
    await request.save();

    res.status(200).json({ message: "Payment pending", success: true, order });
};

// ── Buyer: verify payment and mark the request paid ───────────────────────
export const verifyCustomPayment = async (req, res) => {
    const userId = req.user;
    const { requestId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const request = await customCakeModel.findOne({ _id: requestId, userId });
    if (!request) return res.status(404).json({
        message: "Request not found", success: false, error: "Request not found"
    });

    const isValid = validatePaymentVerification(
        { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
        razorpay_signature,
        Config.RAZORPAY_KEY_SECRET
    );

    if (!isValid) return res.status(400).json({
        message: "Payment verification failed",
        success: false,
        error: "Invalid signature"
    });

    request.payment = { razorpay_order_id, razorpay_payment_id, razorpay_signature };
    request.paymentMethod = 'razorpay';
    request.status = 'paid';
    await request.save();

    notifySellerPaid(request).catch((e) => console.error('Custom request seller email error:', e.message));
    // Paid online = instantly confirmed → send the buyer their confirmation now.
    notifyBuyerConfirmed(request).catch((e) => console.error('Custom request buyer email error:', e.message));

    res.status(200).json({ message: "Payment successful", success: true, request });
};

// ── Buyer: confirm a quoted request via WhatsApp (offline payment) ─────────
// Mirrors the cart's WhatsApp checkout — no online payment is taken; the order
// is committed into the seller's fulfilment queue and the buyer settles payment
// with the seller over WhatsApp. Only reachable once the seller has quoted.
export const confirmWhatsappRequest = async (req, res) => {
    const userId = req.user;
    const { requestId } = req.params;

    const request = await customCakeModel.findOne({ _id: requestId, userId });
    if (!request) return res.status(404).json({
        message: "Request not found", success: false, error: "Request not found"
    });

    if (request.status !== 'quoted') return res.status(400).json({
        message: "This request is not ready to confirm",
        success: false,
        error: `Request status is '${request.status}'`
    });

    request.paymentMethod = 'whatsapp';
    // Buyer has committed but payment is settled offline — hold at
    // 'awaiting_payment' until the seller confirms receipt (mirrors the cart's
    // 'placed' state). No buyer confirmation email until the seller confirms.
    request.status = 'awaiting_payment';
    await request.save();

    notifySellerWhatsappConfirmed(request).catch((e) => console.error('Custom request seller email error:', e.message));

    res.status(200).json({ message: "Order confirmed", success: true, request });
};

// ── Seller: confirm a WhatsApp (offline) payment was received ──────────────
// Moves an 'awaiting_payment' request to 'paid' and sends the buyer the
// confirmation email — the analogue of the cart's "Confirmed & Preparing" step.
export const confirmCustomPayment = async (req, res) => {
    const sellerId = req.user;
    const { requestId } = req.params;

    const request = await customCakeModel.findOne({ _id: requestId, sellerId });
    if (!request) return res.status(404).json({
        message: "Request not found", success: false, error: "Request not found"
    });

    if (request.status !== 'awaiting_payment') return res.status(400).json({
        message: "This request is not awaiting a payment confirmation",
        success: false,
        error: `Request status is '${request.status}'`
    });

    request.status = 'paid';
    await request.save();

    notifyBuyerConfirmed(request).catch((e) => console.error('Custom request buyer email error:', e.message));

    res.status(200).json({ message: "Payment confirmed", success: true, request });
};

// ── Email helpers (best-effort; no-op if email isn't configured) ──────────
async function notifySellersOfNewRequest(request) {
    const sellers = await userModel.find({ role: 'seller', isBlocked: { $ne: true } }).select('email');
    const emails = sellers.map((s) => s.email).filter(Boolean);
    const html = `
        <div style="font-family: Arial, sans-serif; color:#1a1612;">
            <h2>New custom cake request</h2>
            <p>A customer has submitted a custom cake request${request.requiredDate ? ` for <strong>${new Date(request.requiredDate).toDateString()}</strong>` : ''}.</p>
            <p>Log in to your Cakeology dashboard to review the design and send a quote.</p>
            <p style="color:#9a9089; font-size:12px;">— Cakeology</p>
        </div>`;
    await Promise.all(emails.map((to) => sendEmail(to, 'New Custom Cake Request', html)));
}

async function notifyBuyerQuoted(request) {
    const buyer = await userModel.findById(request.userId).select('email fullname');
    if (!buyer?.email) return;
    const price = `${request.quotedPrice.currency} ${request.quotedPrice.amount}`;
    const html = `
        <div style="font-family: Arial, sans-serif; color:#1a1612;">
            <h2>Your custom cake is ready to order</h2>
            <p>Hi ${buyer.fullname || ''},</p>
            <p>Good news — a baker has accepted your request <strong>#${shortId(request._id)}</strong> and quoted <strong>${price}</strong>.</p>
            ${request.sellerNote ? `<p>Note from the baker: ${request.sellerNote}</p>` : ''}
            <p>Log in to "My Custom Cakes" to review and pay to confirm your order.</p>
            <p style="color:#9a9089; font-size:12px;">— Cakeology</p>
        </div>`;
    await sendEmail(buyer.email, `Custom Cake #${shortId(request._id)} · Quote ready`, html);
}

async function notifyBuyerRejected(request) {
    const buyer = await userModel.findById(request.userId).select('email fullname');
    if (!buyer?.email) return;
    const html = `
        <div style="font-family: Arial, sans-serif; color:#1a1612;">
            <h2>Update on your custom cake request</h2>
            <p>Hi ${buyer.fullname || ''},</p>
            <p>Unfortunately your request <strong>#${shortId(request._id)}</strong> could not be taken on at this time.</p>
            ${request.sellerNote ? `<p>Note: ${request.sellerNote}</p>` : ''}
            <p style="color:#9a9089; font-size:12px;">— Cakeology</p>
        </div>`;
    await sendEmail(buyer.email, `Custom Cake #${shortId(request._id)} · Update`, html);
}

async function notifyBuyerStatus(request, status) {
    const buyer = await userModel.findById(request.userId).select('email fullname');
    if (!buyer?.email) return;
    const labels = {
        preparing: 'is being prepared',
        ready: 'is ready',
        delivered: 'has been delivered',
    };
    const html = `
        <div style="font-family: Arial, sans-serif; color:#1a1612;">
            <h2>Custom cake update</h2>
            <p>Hi ${buyer.fullname || ''},</p>
            <p>Your custom cake <strong>#${shortId(request._id)}</strong> ${labels[status] || `is now ${status}`}.</p>
            <p style="color:#9a9089; font-size:12px;">— Cakeology</p>
        </div>`;
    await sendEmail(buyer.email, `Custom Cake #${shortId(request._id)} · ${status.charAt(0).toUpperCase() + status.slice(1)}`, html);
}

async function notifyBuyerRefundCancelled(request, result) {
    const buyer = await userModel.findById(request.userId).select('email fullname');
    if (!buyer?.email) return;
    const price = result.amount ? `₹${Number(result.amount).toLocaleString('en-IN')}` : 'your payment';
    const refundLine = result.status === 'refunded'
        ? `A refund of ${price} has been issued to your original payment method and typically appears within 5–7 business days.`
        : `${price} will be refunded to you directly — we'll reach out to arrange it.`;
    const html = `
        <div style="font-family: Arial, sans-serif; color:#1a1612;">
            <h2>Your custom cake order was cancelled</h2>
            <p>Hi ${buyer.fullname || ''},</p>
            <p>Your custom cake order <strong>#${shortId(request._id)}</strong> has been cancelled.</p>
            <p>${refundLine}</p>
            <p style="color:#9a9089; font-size:12px;">— Cakeology</p>
        </div>`;
    await sendEmail(buyer.email, `Custom Cake #${shortId(request._id)} · Cancelled & Refunded`, html);
}

async function notifyBuyerConfirmed(request) {
    const buyer = await userModel.findById(request.userId).select('email fullname');
    if (!buyer?.email) return;
    const price = request.quotedPrice?.amount
        ? `${request.quotedPrice.currency} ${request.quotedPrice.amount}`
        : '';
    const html = `
        <div style="font-family: Arial, sans-serif; color:#1a1612;">
            <h2>Your custom cake order is confirmed 🎂</h2>
            <p>Hi ${buyer.fullname || ''},</p>
            <p>Your custom cake order <strong>#${shortId(request._id)}</strong>${price ? ` (${price})` : ''} is confirmed and now in our baking queue${request.requiredDate ? ` for <strong>${new Date(request.requiredDate).toDateString()}</strong>` : ''}.</p>
            <p>We'll email you as it progresses through preparing, ready, and delivered.</p>
            <p style="color:#9a9089; font-size:12px;">— Cakeology</p>
        </div>`;
    await sendEmail(buyer.email, `Custom Cake #${shortId(request._id)} · Confirmed`, html);
}

async function notifySellerPaid(request) {
    if (!request.sellerId) return;
    const seller = await userModel.findById(request.sellerId).select('email');
    if (!seller?.email) return;
    const html = `
        <div style="font-family: Arial, sans-serif; color:#1a1612;">
            <h2>Custom cake payment received</h2>
            <p>The buyer has paid for custom cake request <strong>#${shortId(request._id)}</strong>${request.requiredDate ? ` (needed by ${new Date(request.requiredDate).toDateString()})` : ''}.</p>
            <p>Log in to your dashboard to start preparing it.</p>
            <p style="color:#9a9089; font-size:12px;">— Cakeology</p>
        </div>`;
    await sendEmail(seller.email, `Custom Cake #${shortId(request._id)} · Paid`, html);
}

async function notifySellerWhatsappConfirmed(request) {
    if (!request.sellerId) return;
    const seller = await userModel.findById(request.sellerId).select('email');
    if (!seller?.email) return;
    const html = `
        <div style="font-family: Arial, sans-serif; color:#1a1612;">
            <h2>Custom cake confirmed (WhatsApp)</h2>
            <p>The buyer has confirmed custom cake request <strong>#${shortId(request._id)}</strong> and will settle payment with you over WhatsApp${request.requiredDate ? ` (needed by ${new Date(request.requiredDate).toDateString()})` : ''}.</p>
            <p>Log in to your dashboard to start preparing it once payment is arranged.</p>
            <p style="color:#9a9089; font-size:12px;">— Cakeology</p>
        </div>`;
    await sendEmail(seller.email, `Custom Cake #${shortId(request._id)} · Confirmed (WhatsApp)`, html);
}
