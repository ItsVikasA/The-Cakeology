import mongoose, { mongo, Mongoose } from 'mongoose';

const orderSchema = new mongoose.Schema({
    // Optional: guest orders have no account. Buyer identity for guests lives
    // in `address` (fullName/phone) instead.
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null,
    },
    // True when the order was placed without logging in (guest checkout).
    isGuest: {
        type: Boolean,
        default: false,
    },
    // The cart this order was created from — a deterministic key back to the
    // Razorpay payment record (which stores the same cartId). Null for guest
    // orders (no server-side cart) and legacy rows.
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'carts',
        default: null,
    },
    status: {
        type: String,
        enum: ['placed', 'confirmed', 'ready', 'cancelled'],
        required: [true, "Order status is required"],

    },
    // How the buyer paid. Razorpay orders are paid upfront (auto-confirmed);
    // WhatsApp orders are confirmed manually by the seller once payment lands.
    // Defaults to 'razorpay' so historical rows stay meaningful.
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'whatsapp'],
        default: 'razorpay',
    },
    address: {
        fullName: { type: String, required: [true, "Full name is required"] },
        phone: { type: String, required: [true, "Phone number is required"] },
        line1: { type: String, required: [true, "Address line 1 is required"] },
        line2: { type: String },
        city: { type: String, required: [true, "City is required"] },
        state: { type: String, required: [true, "State is required"] },
        pincode: { type: String },
    },
    // Contact email for order confirmation (guest checkout collects this; logged-in
    // buyers are reached via their account email instead).
    contactEmail: { type: String, default: '' },
    couponCode: { type: String, default: null },
    discount: { type: Number, default: 0 },
    // When the buyer needs the cake delivered/ready.
    deliveryDate: { type: Date, default: null },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
            required: [true, "userId is required"]
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products.variants",
            required: [true, "variantId is required"]
        },
        quantity: {
            type: Number,
            default: 1
        },
        status: {
            type: String,
            enum: ['placed', 'confirmed', 'ready', 'cancelled'],
            default: 'placed'
        }
    }
    ]
}, { timestamps: true })

const orderModel = mongoose.model("orders", orderSchema);

export default orderModel;