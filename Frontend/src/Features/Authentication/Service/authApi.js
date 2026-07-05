import axios from 'axios';
import withAuth from '../../../Shared/withAuth';
import { getApiBaseUrl } from '../../../Shared/apiBase';

const api = withAuth(axios.create({
    baseURL: `${getApiBaseUrl()}/auth`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
}))

export const registerApi = async ({ fullname, email, contact, password, role }) => {
    const response = await api.post('/register', { fullname, email, contact, password, role });
    return response.data;
}

export const loginApi = async ({ email, password }) => {
    const response = await api.post('/login', { email, password });
    return response.data;
}

export const logoutApi = async () => {
    const response = await api.get('/logout');
    return response.data;
}

export const getMeApi = async () => {
    const response = await api.get('/getMe');
    return response.data;
}

export const protectedRouteApi = async () => {
    const response = await api.get('/protectedRoute');
    return response.data;
}

export const forgotPasswordApi = async (clientEmail) => {
    const response = await api.post(`/forgotPassword`, { clientEmail });
    return response.data;
}

export const resetPasswordApi = async (newPassword, confirmationPassword, token) => {
    const response = await api.patch(`/resetPassword`, { newPassword, confirmationPassword, token });
    return response.data;

}

export const checkSessionIdApi = async (token) => {
    const response = await api.get('/checkSessionId', { params: { token } });
    return response.data;
}

export const getAddressesApi = async () => {
    const response = await api.get('/addresses');
    return response.data;
}

export const addAddressApi = async (address) => {
    const response = await api.post('/addresses', address);
    return response.data;
}

export const deleteAddressApi = async (addressId) => {
    const response = await api.delete(`/addresses/${addressId}`);
    return response.data;
}
