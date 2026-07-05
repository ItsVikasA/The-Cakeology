import axios from 'axios';
import withAuth from '../../../Shared/withAuth';
import { getApiBaseUrl } from '../../../Shared/apiBase';

const api = withAuth(axios.create({
  baseURL: `${getApiBaseUrl()}/products`,
  withCredentials: true,
}));

export const createProductApi = async (formData) => {
  const response = await api.post('/create', formData);
  return response.data;
}

export const getSellerProductsApi = async () => {
  const response = await api.get('/seller');
  return response.data;
}

export const getProductsApi = async () => {
  const response = await api.get('/');
  return response.data;
}

export const getProductApi = async ({ productId }) => {
  const response = await api.get(`/${productId}`);
  return response.data;
}

export const updateProductApi = async (productId, formData) => {
  const response = await api.patch(`/seller/${productId}`, formData);
  return response.data;
}

export const createVariantApi = async (productId, formData) => {
  const response = await api.post(`/createVariant/${productId}`, formData);
  return response.data;
}

export const deleteVariantApi = async (productId, variantId) => {
  await api.post(`/deleteVariant/${productId}`, { variantId: variantId });
}

export const deleteProductApi = async (productId) => {
  const response = await api.delete(`/${productId}`);
  return response.data;
}

export const updateVariantStockApi = async (productId, variantId, stock) => {
  const response = await api.patch(`/${productId}/variant/${variantId}/stock`, { stock });
  return response.data;
}


