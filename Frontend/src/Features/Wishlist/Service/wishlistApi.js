import axios from 'axios';
import withAuth from '../../../Shared/withAuth';

const api = withAuth(axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/wishlist`,
    withCredentials: true,
}));

export const getWishlistApi = async () => {
    const response = await api.get('/');
    return response.data;
}

export const toggleWishlistApi = async (productId) => {
    const response = await api.post(`/toggle/${productId}`);
    return response.data;
}
