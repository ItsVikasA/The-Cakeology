import couponModel from "../models/couponModel.js";
import { evaluateCoupon } from "../utils/coupon.js";

// Seller creates a coupon.
export const createCoupon = async (req, res) => {
    const { code, discountType, discountValue, maxDiscount, minOrderAmount, expiresAt, usageLimit } = req.body;

    if (!code || !discountType || discountValue == null || !expiresAt) {
        return res.status(400).json({
            message: "Code, discount type, value and expiry are required",
            success: false,
            error: "Missing required fields"
        });
    }

    const normalized = String(code).toUpperCase().trim();

    const exists = await couponModel.findOne({ code: normalized });
    if (exists) return res.status(400).json({
        message: "A coupon with this code already exists",
        success: false,
        error: "Duplicate code"
    });

    const coupon = await couponModel.create({
        code: normalized,
        discountType,
        discountValue,
        maxDiscount: maxDiscount || null,
        minOrderAmount: minOrderAmount || 0,
        expiresAt,
        usageLimit: usageLimit || 0,
        createdBy: req.user,
    });

    res.status(201).json({ message: "Coupon created", success: true, coupon });
}

// Seller lists their own coupons.
export const getSellerCoupons = async (req, res) => {
    const coupons = await couponModel.find({ createdBy: req.user }).sort({ createdAt: -1 });
    res.status(200).json({ message: "Fetched coupons", success: true, coupons });
}

// Seller toggles a coupon active/inactive.
export const toggleCoupon = async (req, res) => {
    const { couponId } = req.params;
    const coupon = await couponModel.findOne({ _id: couponId, createdBy: req.user });
    if (!coupon) return res.status(404).json({ message: "Coupon not found", success: false, error: "Not found" });

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({ message: "Coupon updated", success: true, coupon });
}

// Seller deletes a coupon.
export const deleteCoupon = async (req, res) => {
    const { couponId } = req.params;
    const coupon = await couponModel.findOneAndDelete({ _id: couponId, createdBy: req.user });
    if (!coupon) return res.status(404).json({ message: "Coupon not found", success: false, error: "Not found" });

    res.status(200).json({ message: "Coupon deleted", success: true, couponId });
}

// Buyer validates a coupon against their cart total (does not consume usage).
export const validateCoupon = async (req, res) => {
    const { code, cartTotal } = req.body;

    if (!code) return res.status(400).json({ message: "Coupon code is required", success: false, error: "No code" });

    const coupon = await couponModel.findOne({ code: String(code).toUpperCase().trim() });

    const result = evaluateCoupon(coupon, Number(cartTotal) || 0);

    if (!result.valid) {
        return res.status(400).json({ message: result.reason, success: false, error: result.reason });
    }

    res.status(200).json({
        message: "Coupon applied",
        success: true,
        code: coupon.code,
        discount: result.discount,
        finalAmount: (Number(cartTotal) || 0) - result.discount,
    });
}
