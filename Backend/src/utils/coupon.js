// Pure evaluation of a coupon against an order amount.
// Returns { valid, reason, discount } — never throws.
export function evaluateCoupon(coupon, amount) {
    if (!coupon) return { valid: false, reason: 'Coupon not found', discount: 0 };
    if (!coupon.isActive) return { valid: false, reason: 'Coupon is inactive', discount: 0 };

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return { valid: false, reason: 'Coupon has expired', discount: 0 };
    }

    if (coupon.usageLimit && coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        return { valid: false, reason: 'Coupon usage limit reached', discount: 0 };
    }

    if (amount < (coupon.minOrderAmount || 0)) {
        return { valid: false, reason: `Minimum order amount is ₹${coupon.minOrderAmount}`, discount: 0 };
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
        discount = (amount * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
        }
    } else {
        discount = coupon.discountValue;
    }

    // Never discount more than the amount itself.
    discount = Math.min(Math.round(discount), amount);

    return { valid: true, reason: 'OK', discount };
}
