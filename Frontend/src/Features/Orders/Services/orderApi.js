import axios from 'axios';
import withAuth from '../../../Shared/withAuth';

const api = withAuth(axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/order`,
    withCredentials: true,
}));

export const createOrderApi = async (cartId, address, couponCode, deliveryDate) => {
    const response = await api.post('/createOrder', { cartId, address, couponCode, deliveryDate });
    return response.data;
}

// Guest checkout — no auth, items come from the client-side cart.
export const createGuestOrderApi = async (items, address, email, couponCode, deliveryDate) => {
    const response = await api.post('/guestOrder', { items, address, email, couponCode, deliveryDate });
    return response.data;
}

export const getOrderApi = async () => {
    const response = await api.post(`/getOrder`);
    return response.data;
}

export const getSellerOrdersApi = async () => {
    const response = await api.get('/sellerOrders');
    return response.data;
}

export const getSellerMetricsApi = async () => {
    const response = await api.get('/sellerMetrics');
    return response.data;
}

export const updateOrderStatusApi = async (orderId, status) => {
    const response = await api.patch(`/updateStatus/${orderId}`, { status });
    return response.data;
}

export const cancelOrderApi = async (orderId) => {
    const response = await api.patch(`/cancel/${orderId}`);
    return response.data;
}

export const getSellerNotificationsApi = async () => {
    const response = await api.get('/sellerNotifications');
    return response.data;
}

export const resolveSellerNotificationApi = async (notificationId) => {
    const response = await api.patch(`/sellerNotifications/${notificationId}/resolve`);
    return response.data;
}