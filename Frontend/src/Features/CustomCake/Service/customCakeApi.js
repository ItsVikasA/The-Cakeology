import axios from 'axios';
import withAuth from '../../../Shared/withAuth';

const api = withAuth(axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/custom`,
    withCredentials: true,
}));

// ── Buyer ──
export const createCustomRequestApi = async ({ design, title, description, flavor, weight, requiredDate, budget }) => {
    const formData = new FormData();
    formData.append('design', design);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (flavor) formData.append('flavor', flavor);
    if (weight) formData.append('weight', weight);
    formData.append('requiredDate', requiredDate);
    if (budget) formData.append('budget', budget);

    const response = await api.post('/request', formData);
    return response.data;
};

export const getMyCustomRequestsApi = async () => {
    const response = await api.get('/my');
    return response.data;
};

export const cancelCustomRequestApi = async (requestId) => {
    const response = await api.patch(`/cancel/${requestId}`);
    return response.data;
};

export const createCustomPaymentApi = async (requestId) => {
    const response = await api.post(`/pay/${requestId}`);
    return response.data;
};

export const verifyCustomPaymentApi = async (requestId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    const response = await api.post(`/pay/${requestId}/verify`, { razorpay_order_id, razorpay_payment_id, razorpay_signature });
    return response.data;
};

// Confirm a quoted request via WhatsApp (offline payment) when the store's
// active checkout method is WhatsApp — mirrors the cart's WhatsApp checkout.
export const confirmWhatsappCustomApi = async (requestId) => {
    const response = await api.post(`/confirm-whatsapp/${requestId}`);
    return response.data;
};

// ── Seller ──
export const getSellerCustomRequestsApi = async () => {
    const response = await api.get('/seller');
    return response.data;
};

export const quoteCustomRequestApi = async (requestId, { amount, currency, sellerNote }) => {
    const response = await api.patch(`/quote/${requestId}`, { amount, currency, sellerNote });
    return response.data;
};

export const rejectCustomRequestApi = async (requestId, sellerNote) => {
    const response = await api.patch(`/reject/${requestId}`, { sellerNote });
    return response.data;
};

export const updateCustomRequestStatusApi = async (requestId, status) => {
    const response = await api.patch(`/status/${requestId}`, { status });
    return response.data;
};

// Seller confirms an offline (WhatsApp) payment was received.
export const confirmCustomPaymentApi = async (requestId) => {
    const response = await api.patch(`/confirm-payment/${requestId}`);
    return response.data;
};

// Cancel a paid custom order and refund the buyer (seller-scoped / admin-scoped).
export const sellerCancelCustomApi = async (requestId) => {
    const response = await api.patch(`/seller/cancel/${requestId}`);
    return response.data;
};

export const adminCancelCustomApi = async (requestId) => {
    const response = await api.patch(`/admin/cancel/${requestId}`);
    return response.data;
};
