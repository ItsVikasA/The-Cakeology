import mongoose from 'mongoose';
import priceSchema from './productModel.js';

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'User Id is required']
    },

    price: {
        type: {
            amount: {
                type: Number,
                required: [true, "Product price amount is required"]
            }, currency: {
                type: String,
                default: 'INR',
                enum: ["USD", "INR", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD"],
            }
        },
        required: true
    },

    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'carts',
        required: [true, 'Cart Id is required']
    },
    // Linked once the order is created (post-payment) so refunds can be traced
    // back to the captured Razorpay payment. Null for pre-link/legacy rows.
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orders',
        default: null,
    },
    order: {
        razorpay_order_id: {
            type: String,
            required: [true, 'Razorpay Order Id is required']
        },
        razorpay_payment_id: {
            type: String
        },
        razorpay_signature: {
            type: String
        }

    },
    status: {
        type: String,
        enum: ['paid', 'pending', 'failed'],
        default: 'pending',
        required: [true]
    },
    refunded: {
        type: Boolean,
        default: false,
    },
    refundedAt: {
        type: Date,
        default: null,
    },
    // Razorpay refund id (rfnd_...) once a live refund is issued via the API.
    refundId: {
        type: String,
        default: null,
    }
}, { timestamps: true })

const paymentModel = mongoose.model("Payments", paymentSchema);

export default paymentModel;