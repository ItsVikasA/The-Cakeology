import axios from 'axios';
import withAuth from '../../../Shared/withAuth';
import { getApiBaseUrl } from '../../../Shared/apiBase';

const api = withAuth(axios.create({
    baseURL: `${getApiBaseUrl()}/catalog`,
    withCredentials: true,
}));

export const getCategoriesApi = async () => {
    const res = await api.get('/categories');
    return res.data;
};

export const createCategoryApi = async (data) => {
    const res = await api.post('/categories', data);
    return res.data;
};

export const updateCategoryApi = async (categoryId, data) => {
    const res = await api.patch(`/categories/${categoryId}`, data);
    return res.data;
};

export const deleteCategoryApi = async (categoryId) => {
    const res = await api.delete(`/categories/${categoryId}`);
    return res.data;
};

export const getBrandsApi = async () => {
    const res = await api.get('/brands');
    return res.data;
};

export const createBrandApi = async (data) => {
    const res = await api.post('/brands', data);
    return res.data;
};

export const deleteBrandApi = async (brandId) => {
    const res = await api.delete(`/brands/${brandId}`);
    return res.data;
};
