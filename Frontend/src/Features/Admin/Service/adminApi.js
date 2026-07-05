import axios from 'axios';
import withAuth from '../../../Shared/withAuth';

const api = withAuth(axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/admin`,
    withCredentials: true,
}));

export const getAdminMetricsApi = async () => {
    const res = await api.get('/metrics');
    return res.data;
};

export const getAdminOrdersApi = async (params = {}) => {
    const res = await api.get('/orders', { params });
    return res.data;
};

export const getAllUsersApi = async (params = {}) => {
    const res = await api.get('/users', { params });
    return res.data;
};

export const toggleBlockUserApi = async (userId) => {
    const res = await api.patch(`/users/${userId}/block`);
    return res.data;
};

export const deleteUserApi = async (userId) => {
    const res = await api.delete(`/users/${userId}`);
    return res.data;
};

export const getTransactionsApi = async (params = {}) => {
    const res = await api.get('/transactions', { params });
    return res.data;
};

export const refundTransactionApi = async (paymentId) => {
    const res = await api.patch(`/transactions/${paymentId}/refund`);
    return res.data;
};

export const getReportsApi = async (range = 30) => {
    const res = await api.get('/reports', { params: { range } });
    return res.data;
};

export const getNotificationsApi = async () => {
    const res = await api.get('/notifications');
    return res.data;
};

export const resolveNotificationApi = async (notificationId) => {
    const res = await api.patch(`/notifications/${notificationId}/resolve`);
    return res.data;
};
