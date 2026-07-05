import axios from 'axios';
import withAuth from '../../../Shared/withAuth';

const api = withAuth(axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/settings`,
    withCredentials: true,
}));

export const getSettingsApi = async () => (await api.get('/')).data;
export const getPublicSettingsApi = async () => (await api.get('/public')).data;
export const updateSettingsApi = async (data) => (await api.patch('/', data)).data;
