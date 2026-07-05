import axios from 'axios';
import withAuth from '../../../Shared/withAuth';
import { getApiBaseUrl } from '../../../Shared/apiBase';

const api = withAuth(axios.create({
    baseURL: `${getApiBaseUrl()}/coupon`,
    withCredentials: true,
}));

export const createCouponApi = async (data) => {
    const response = await api.post('/', data);
    return response.data;
}

export const getSellerCouponsApi = async () => {
    const response = await api.get('/seller');
    return response.data;
}

export const toggleCouponApi = async (couponId) => {
    const response = await api.patch(`/toggle/${couponId}`);
    return response.data;
}

export const deleteCouponApi = async (couponId) => {
    const response = await api.delete(`/${couponId}`);
    return response.data;
}

export const validateCouponApi = async (code, cartTotal) => {
    const response = await api.post('/validate', { code, cartTotal });
    return response.data;
}
