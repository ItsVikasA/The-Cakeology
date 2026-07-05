import mongoose from 'mongoose';

// Singleton document holding store-wide configuration.
const settingsSchema = new mongoose.Schema({
    key: { type: String, default: 'global', unique: true },

    general: {
        storeName: { type: String, default: 'Cakeology' },
        supportEmail: { type: String, default: '' },
        currency: { type: String, default: 'INR' },
        maintenanceMode: { type: Boolean, default: false },
    },
    shipping: {
        // Orders at/above this subtotal ship free (0 = always charge).
        freeShippingThreshold: { type: Number, default: 0 },
        shippingCharge: { type: Number, default: 0 },
    },
    tax: {
        gstPercent: { type: Number, default: 0 },
        // If true, prices already include tax (no extra line added).
        taxInclusive: { type: Boolean, default: false },
    },
    payment: {
        // Public key id only — the secret stays in server env.
        razorpayKeyId: { type: String, default: '' },
        // Store WhatsApp number (no +, country code included) for manual checkout.
        whatsappNumber: { type: String, default: '919900082208' },
        // Which checkout path is live; flip without redeploy. Razorpay stays reachable.
        activeMethod: { type: String, enum: ['razorpay', 'whatsapp'], default: 'whatsapp' },
    },
    email: {
        senderName: { type: String, default: 'Cakeology' },
        fromEmail: { type: String, default: '' },
    },
    checkout: {
        // How buyers identify themselves at checkout.
        // 'guest'  → collect name/address/phone, login optional (no account needed).
        // 'google' → Google OAuth sign-in (planned; not yet implemented).
        mode: { type: String, enum: ['guest', 'google'], default: 'guest' },
    },
}, { timestamps: true });

const settingsModel = mongoose.model('settings', settingsSchema);

export default settingsModel;
