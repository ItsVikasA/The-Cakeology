import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, "Coupon code is required"],
        unique: true,
        uppercase: true,
        trim: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],
        required: [true, "Discount type is required"],
    },
    discountValue: {
        type: Number,
        required: [true, "Discount value is required"],
        min: 0,
    },
    // Optional cap on the discount amount for percentage coupons.
    maxDiscount: {
        type: Number,
        default: null,
    },
    minOrderAmount: {
        type: Number,
        default: 0,
    },
    expiresAt: {
        type: Date,
        required: [true, "Expiry date is required"],
    },
    // Total number of times the coupon can be used (across all users). 0 = unlimited.
    usageLimit: {
        type: Number,
        default: 0,
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
}, { timestamps: true });

const couponModel = mongoose.model('coupons', couponSchema);

export default couponModel;
