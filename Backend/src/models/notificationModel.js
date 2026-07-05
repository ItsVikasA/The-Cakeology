import mongoose from 'mongoose';

// Admin-facing notifications. Currently used for refund requests raised when a
// paid order is cancelled, but the `type` field leaves room for others.
const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['refund'],
        default: 'refund',
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orders',
        default: null,
    },
    message: { type: String, required: true },
    // Refund context so the admin can action it without opening the order.
    amount: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['razorpay', 'whatsapp'], default: 'razorpay' },
    // Cleared once the refund has been processed. `resolvedBy` records who did it
    // (admin or seller) so the two dashboards never double-refund.
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: String, enum: ['admin', 'seller'], default: null },
}, { timestamps: true });

const notificationModel = mongoose.model('notifications', notificationSchema);

export default notificationModel;
