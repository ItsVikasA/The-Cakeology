import axios from 'axios';
import withAuth from '../../../Shared/withAuth';
import { getApiBaseUrl } from '../../../Shared/apiBase';

const api = withAuth(axios.create({
    baseURL: `${getApiBaseUrl()}/wishlist`,
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
