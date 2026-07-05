import {
    createCouponApi, getSellerCouponsApi, toggleCouponApi, deleteCouponApi, validateCouponApi,
} from "../Service/couponApi";

const useCoupon = () => {
    const createCouponHandler = async (data) => {
        const res = await createCouponApi(data);
        return res.coupon;
    };

    const getSellerCouponsHandler = async () => {
        const res = await getSellerCouponsApi();
        return res.coupons;
    };

    const toggleCouponHandler = async (couponId) => {
        const res = await toggleCouponApi(couponId);
        return res.coupon;
    };

    const deleteCouponHandler = async (couponId) => {
        await deleteCouponApi(couponId);
    };

    // Returns { success, discount, finalAmount, code } or throws on invalid.
    const validateCouponHandler = async (code, cartTotal) => {
        const res = await validateCouponApi(code, cartTotal);
        return res;
    };

    return {
        createCouponHandler,
        getSellerCouponsHandler,
        toggleCouponHandler,
        deleteCouponHandler,
        validateCouponHandler,
    };
};

export default useCoupon;
