import { describe, it, expect } from 'vitest';
import { evaluateCoupon } from './coupon.js';

// Coupon re-validation is a shared safety guarantee that runs server-side on
// EVERY order, regardless of payment method (Razorpay or WhatsApp). These tests
// pin that behaviour so neither checkout branch can drift or bypass it.
describe('evaluateCoupon', () => {
    const base = {
        code: 'SAVE10',
        isActive: true,
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 0,
    };

    it('rejects a missing coupon', () => {
        expect(evaluateCoupon(null, 1000)).toEqual({ valid: false, reason: 'Coupon not found', discount: 0 });
    });

    it('rejects an inactive coupon', () => {
        const res = evaluateCoupon({ ...base, isActive: false }, 1000);
        expect(res.valid).toBe(false);
        expect(res.discount).toBe(0);
    });

    it('rejects an expired coupon', () => {
        const res = evaluateCoupon({ ...base, expiresAt: '2000-01-01' }, 1000);
        expect(res.valid).toBe(false);
        expect(res.reason).toBe('Coupon has expired');
    });

    it('rejects when the usage limit is reached', () => {
        const res = evaluateCoupon({ ...base, usageLimit: 5, usedCount: 5 }, 1000);
        expect(res.valid).toBe(false);
        expect(res.reason).toBe('Coupon usage limit reached');
    });

    it('rejects when the amount is below the minimum order', () => {
        const res = evaluateCoupon({ ...base, minOrderAmount: 500 }, 300);
        expect(res.valid).toBe(false);
        expect(res.discount).toBe(0);
    });

    it('applies a percentage discount, rounded', () => {
        const res = evaluateCoupon({ ...base, discountValue: 10 }, 999);
        expect(res.valid).toBe(true);
        expect(res.discount).toBe(100); // round(99.9)
    });

    it('caps a percentage discount at maxDiscount', () => {
        const res = evaluateCoupon({ ...base, discountValue: 50, maxDiscount: 200 }, 1000);
        expect(res.discount).toBe(200);
    });

    it('applies a flat discount', () => {
        const res = evaluateCoupon({ ...base, discountType: 'flat', discountValue: 150 }, 1000);
        expect(res.valid).toBe(true);
        expect(res.discount).toBe(150);
    });

    it('never discounts more than the order amount', () => {
        const res = evaluateCoupon({ ...base, discountType: 'flat', discountValue: 5000 }, 1000);
        expect(res.discount).toBe(1000);
    });
});
