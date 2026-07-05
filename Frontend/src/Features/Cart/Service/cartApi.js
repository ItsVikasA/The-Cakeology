import axios from 'axios';
import withAuth from '../../../Shared/withAuth';
import { getApiBaseUrl } from '../../../Shared/apiBase';

const api = withAuth(axios.create({
  baseURL: `${getApiBaseUrl()}/cart`,
  withCredentials: true,
}));

export const addItemToCartApi = async (productId, variantId) => {
  const response = await api.post(`/add/${productId}/${variantId}`, { quantity: 1 });
  return response.data;
}

export const getCartItemsAPi = async () => {

  const response = await api.get('/items');
  return response.data;
}

export const addItemQuantityApi = async (itemId) => {
  const response = await api.post('/addItemQuantity', { itemId });
}


export const subItemQuantityApi = async (itemId) => {
  const response = await api.post('/subItemQuantity', { itemId });
}

export const removeItemApi = async (itemId) => {
  const response = await api.post('/removeItem', { itemId });
}

export const createOrderPaymentApi = async (amount, currency) => {
  const response = await api.post('/order/payment', { amount, currency });
  return response.data;
}

export const verifyPaymentApi = async ({ orderId, paymentId, paymentSignature }) => {
  const response = await api.post('/order/payment/verify', { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: paymentSignature });
  return response.data;
} 