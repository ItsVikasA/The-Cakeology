import { useDispatch } from "react-redux";
import { registerApi, loginApi, getMeApi, protectedRouteApi, resetPasswordApi, forgotPasswordApi, checkSessionIdApi, logoutApi, getAddressesApi, addAddressApi, deleteAddressApi } from "../Service/authApi.js"
import { setLoading, setUser } from "../State/authSlice.js";

const useAuth = () => {

    const dispatch = useDispatch();

    const registerHandler = async ({ fullname, email, contact, password, role }) => {
        try {
            const userData = await registerApi({ fullname: fullname.trim(), email: email.trim().toLowerCase(), contact: contact.trim(), password: password.trim(), role });
            if (userData.token) localStorage.setItem('token', userData.token);
            dispatch(setUser(userData.user));
            dispatch(setLoading(true));
            return { success: true };
        } catch (error) {
            const message = error?.response?.data?.message
                || error?.response?.data?.error
                || error?.response?.data?.errors?.[0]?.msg
                || error?.message
                || 'Unable to create account';
            console.error("Register Error: ", message);
            return { success: false, message };
        }
        finally {
            dispatch(setLoading(false));
        }
    }

    const loginHandler = async ({ email, password }) => {
        try {

            const userData = await loginApi({ email, password });
            if (userData.token) localStorage.setItem('token', userData.token);
            dispatch(setUser(userData.user));
            dispatch(setLoading(true));
            return { success: true };
        } catch (error) {
            const message = error?.response?.data?.message
                || error?.response?.data?.error
                || error?.response?.data?.errors?.[0]?.msg
                || error?.message
                || 'Unable to sign in';
            console.error("Login Error: ", message);
            return { success: false, message };
        }
        finally {
            dispatch(setLoading(false));
        }
    }

    const logoutHandler = async () => {

        const userData = await logoutApi();
        localStorage.removeItem('token');
        dispatch(setUser(null));
        dispatch(setLoading(true));
        dispatch(setLoading(false));

    }

    const protectedRouteHandler = async () => {
        try {
            await protectedRouteApi();
            return true;
        }
        catch (error) {
            return false;
        }
    }

    const resetPasswordHandler = async (newPassword, confirmPassword, token) => {
        try {
            const userData = await resetPasswordApi(newPassword, confirmPassword, token);
            return userData;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    const forgotPasswordHandler = async (clientEmail) => {
        try {
            await forgotPasswordApi(clientEmail);

        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    const getMeHandler = async () => {
        try {
            const userData = await getMeApi();
            dispatch(setLoading(true));
            dispatch(setUser(userData.user));
        } catch (error) {
            return error;
        }
        finally {
            dispatch(setLoading(false));
        }

    }

    const checkSessionIdHandler = async (token) => {
        try {
            await checkSessionIdApi(token);
            return true;
        }
        catch (error) {
            return false;
        }
    }

    const getAddressesHandler = async () => {
        const res = await getAddressesApi();
        return res.addresses;
    }

    const addAddressHandler = async (address) => {
        const res = await addAddressApi(address);
        return res.addresses;
    }

    const deleteAddressHandler = async (addressId) => {
        const res = await deleteAddressApi(addressId);
        return res.addresses;
    }

    return { registerHandler, loginHandler, logoutHandler, forgotPasswordHandler, resetPasswordHandler, getMeHandler, checkSessionIdHandler, protectedRouteHandler, getAddressesHandler, addAddressHandler, deleteAddressHandler }
}

export default useAuth
