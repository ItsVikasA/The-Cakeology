import { useDispatch } from 'react-redux';
import {
    createCustomRequestApi,
    getMyCustomRequestsApi,
    cancelCustomRequestApi,
    createCustomPaymentApi,
    verifyCustomPaymentApi,
    confirmWhatsappCustomApi,
    getSellerCustomRequestsApi,
    quoteCustomRequestApi,
    rejectCustomRequestApi,
    updateCustomRequestStatusApi,
    confirmCustomPaymentApi,
    sellerCancelCustomApi,
    adminCancelCustomApi,
} from '../Service/customCakeApi';
import { setMyRequests, setSellerRequests } from '../State/customCakeSlice';

const useCustomCake = () => {
    const dispatch = useDispatch();

    // ── Buyer ──
    const createCustomRequestHandler = async (payload) => {
        const res = await createCustomRequestApi(payload);
        return res;
    };

    const getMyRequestsHandler = async () => {
        const res = await getMyCustomRequestsApi();
        dispatch(setMyRequests(res.requests || []));
        return res.requests || [];
    };

    const cancelCustomRequestHandler = async (requestId) => {
        const res = await cancelCustomRequestApi(requestId);
        await getMyRequestsHandler();
        return res;
    };

    const createCustomPaymentHandler = async (requestId) => {
        const res = await createCustomPaymentApi(requestId);
        return res.order;
    };

    const verifyCustomPaymentHandler = async (requestId, payload) => {
        const res = await verifyCustomPaymentApi(requestId, payload);
        return res;
    };

    const confirmWhatsappHandler = async (requestId) => {
        const res = await confirmWhatsappCustomApi(requestId);
        return res;
    };

    // ── Seller ──
    const getSellerRequestsHandler = async () => {
        const res = await getSellerCustomRequestsApi();
        dispatch(setSellerRequests(res.requests || []));
        return res.requests || [];
    };

    const quoteCustomRequestHandler = async (requestId, payload) => {
        const res = await quoteCustomRequestApi(requestId, payload);
        await getSellerRequestsHandler();
        return res;
    };

    const rejectCustomRequestHandler = async (requestId, sellerNote) => {
        const res = await rejectCustomRequestApi(requestId, sellerNote);
        await getSellerRequestsHandler();
        return res;
    };

    const updateCustomStatusHandler = async (requestId, status) => {
        const res = await updateCustomRequestStatusApi(requestId, status);
        await getSellerRequestsHandler();
        return res;
    };

    const confirmCustomPaymentHandler = async (requestId) => {
        const res = await confirmCustomPaymentApi(requestId);
        await getSellerRequestsHandler();
        return res;
    };

    const sellerCancelCustomHandler = async (requestId) => {
        const res = await sellerCancelCustomApi(requestId);
        await getSellerRequestsHandler();
        return res;
    };

    // Admin cancel+refund — no seller-list refresh (admin doesn't use that state).
    const adminCancelCustomHandler = async (requestId) => {
        const res = await adminCancelCustomApi(requestId);
        return res;
    };

    return {
        createCustomRequestHandler,
        getMyRequestsHandler,
        cancelCustomRequestHandler,
        createCustomPaymentHandler,
        verifyCustomPaymentHandler,
        confirmWhatsappHandler,
        getSellerRequestsHandler,
        quoteCustomRequestHandler,
        rejectCustomRequestHandler,
        updateCustomStatusHandler,
        confirmCustomPaymentHandler,
        sellerCancelCustomHandler,
        adminCancelCustomHandler,
    };
};

export default useCustomCake;
