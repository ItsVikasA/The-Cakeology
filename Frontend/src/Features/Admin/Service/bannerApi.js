import axios from 'axios';
import withAuth from '../../../Shared/withAuth';

const api = withAuth(axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/banner`,
    withCredentials: true,
}));

export const getActiveBannersApi = async () => {
    const res = await api.get('/');
    return res.data;
};

export const getAllBannersApi = async () => {
    const res = await api.get('/all');
    return res.data;
};

export const createBannerApi = async (formData) => {
    const res = await api.post('/', formData);
    return res.data;
};

export const toggleBannerApi = async (bannerId) => {
    const res = await api.patch(`/toggle/${bannerId}`);
    return res.data;
};

export const deleteBannerApi = async (bannerId) => {
    const res = await api.delete(`/${bannerId}`);
    return res.data;
};
