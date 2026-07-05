import razorpay from './paymentService.js';
import paymentModel from '../models/paymentModel.js';
import orderModel from '../models/orderModel.js';

// Issues a live Razorpay refund for a paid payment record, then marks it
// refunded and stores the refund id. Mutates + saves the passed payment.
// Throws if there is no captured payment id or the gateway rejects the refund.
export async function refundPayment(payment) {
    const paymentId = payment.order?.razorpay_payment_id;
    if (!paymentId) throw new Error('No Razorpay payment id on this transaction');

    // Omitting `amount` tells Razorpay to refund the FULL captured amount — the
    // correct behaviour for a cancellation, and it avoids any drift between our
    // stored price and what was actually captured. `optimum` speed picks an
    // instant refund when the buyer's bank supports it, else normal speed.
    const refund = await razorpay.payments.refund(paymentId, {
        speed: 'optimum',
        notes: { reason: 'Order cancelled — Cakeology' },
    });

    payment.refunded = true;
    payment.refundedAt = new Date();
    payment.refundId = refund.id;
    await payment.save();

    return refund;
}

// Refunds the captured Razorpay payment linked to an order, if there is one.
// Returns { status: 'refunded', refundId, amount } on success, or
// { status: 'manual' } when there is no gateway payment to refund (WhatsApp/UPI
// or legacy orders placed before payment↔order linking). Throws on gateway error.
export async function refundForOrder(orderId) {
    // Primary link: payment.orderId (set in createOrder). Fallback: match on the
    // order's cartId, which the payment record also stores — a deterministic key
    // that survives even if the orderId link was never set.
    let payment = await paymentModel.findOne({ orderId, status: 'paid', refunded: false });
    if (!payment) {
        const order = await orderModel.findById(orderId).select('cartId');
        if (order?.cartId) {
            payment = await paymentModel.findOne({ cartId: order.cartId, status: 'paid', refunded: false });
        }
    }
    if (!payment) return { status: 'manual' };

    const refund = await refundPayment(payment);
    return { status: 'refunded', refundId: refund.id, amount: payment.price?.amount || 0 };
}

// Issues a live full refund for a raw captured Razorpay payment id. Used by the
// custom-cake flow, whose payment lives on the request document (not paymentModel).
// Returns the Razorpay refund object; throws on missing id / gateway error.
export async function refundByPaymentId(paymentId) {
    if (!paymentId) throw new Error('No Razorpay payment id on this order');
    return razorpay.payments.refund(paymentId, {
        speed: 'optimum',
        notes: { reason: 'Custom cake order cancelled — Cakeology' },
    });
}

// Normalises a Razorpay SDK / network error into a readable message.
export const refundErrorMessage = (e) =>
    e?.error?.description || e?.message || 'Razorpay refund failed';
