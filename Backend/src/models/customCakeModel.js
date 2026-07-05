import mongoose from 'mongoose';

// A buyer-initiated request for a fully custom cake. Unlike catalog orders,
// there is no fixed price up front: the buyer uploads a design and details,
// a seller reviews it and quotes a price, the buyer is notified and pays,
// then the seller fulfils it with status updates.
const customCakeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'userId is required']
    },
    // Set when a seller picks up / quotes the request.
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    designImage: {
        type: String,
        required: [true, 'A design image is required']
    },
    title: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    flavor: { type: String, default: '' },
    weight: { type: String, default: '' },
    // When the buyer needs the cake.
    requiredDate: {
        type: Date,
        required: [true, 'A required date is needed']
    },
    // Optional budget the buyer has in mind.
    budget: { type: Number, default: null },

    // Seller's quote.
    quotedPrice: {
        amount: { type: Number, default: null },
        currency: {
            type: String,
            default: 'INR',
            enum: ["USD", "INR", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD"],
        }
    },
    sellerNote: { type: String, default: '' },

    // Lifecycle:
    //  pending → quoted → (razorpay) paid            → preparing → ready → delivered
    //                   → (whatsapp) awaiting_payment → paid (seller confirms) → …
    // 'awaiting_payment' = buyer committed via WhatsApp; seller must confirm the
    // offline payment before the order is confirmed and the buyer is emailed.
    status: {
        type: String,
        enum: ['pending', 'quoted', 'rejected', 'awaiting_payment', 'paid', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'pending'
    },

    // How the buyer committed to the order once the seller quoted, derived from
    // the store's active checkout method (Admin → Settings → Payment):
    //  - 'razorpay' → paid online (status 'paid' means truly prepaid).
    //  - 'whatsapp' → confirmed via WhatsApp, payment settled offline (status
    //    'paid' here means "confirmed / in the fulfilment queue", not prepaid).
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'whatsapp'],
        default: 'razorpay'
    },

    payment: {
        razorpay_order_id: { type: String, default: null },
        razorpay_payment_id: { type: String, default: null },
        razorpay_signature: { type: String, default: null },
    },

    // Refund state, set when a paid order is cancelled. `status`:
    //  - 'refunded' → a live Razorpay refund was issued (online payment).
    //  - 'manual'   → offline (WhatsApp) payment; acknowledged, settle outside.
    refund: {
        refunded: { type: Boolean, default: false },
        status: { type: String, enum: ['refunded', 'manual', null], default: null },
        refundId: { type: String, default: null },
        amount: { type: Number, default: 0 },
        refundedAt: { type: Date, default: null },
    }
}, { timestamps: true });

const customCakeModel = mongoose.model('customcakes', customCakeSchema);

export default customCakeModel;
