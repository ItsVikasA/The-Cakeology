import { useDispatch } from "react-redux";
import { createOrderApi, createGuestOrderApi, getOrderApi, getSellerOrdersApi, updateOrderStatusApi, cancelOrderApi, getSellerMetricsApi, getSellerNotificationsApi, resolveSellerNotificationApi } from "../Services/orderApi"
import { setOrderDets, setSellerOrders } from "../State/orderSlice";

const useOrder = () => {


    const dispatch = useDispatch();

    const createOrderHandler = async (cartId, address, couponCode, deliveryDate) => {
        const res = await createOrderApi(cartId, address, couponCode, deliveryDate);
        dispatch(setOrderDets(res.order));
        return res;
    }

    const createGuestOrderHandler = async (items, address, email, couponCode, deliveryDate) => {
        const res = await createGuestOrderApi(items, address, email, couponCode, deliveryDate);
        return res;
    }

    const getOrderHandler = async () => {
        const res = await getOrderApi();
        dispatch(setOrderDets(res.order));
        return res;
    }

    const cancelOrderHandler = async (orderId) => {
        const res = await cancelOrderApi(orderId);
        // Refresh buyer orders so the cancelled status reflects immediately.
        await getOrderHandler();
        return res;
    }

    const getSellerOrdersHandler = async () => {
        const res = await getSellerOrdersApi();
        dispatch(setSellerOrders(res.orders));
        return res;
    }

    const getSellerMetricsHandler = async () => {
        const res = await getSellerMetricsApi();
        return res.metrics;
    }

    const updateOrderStatusHandler = async (orderId, status) => {
        const res = await updateOrderStatusApi(orderId, status);
        // Refresh the seller order list so the change is reflected.
        await getSellerOrdersHandler();
        return res;
    }

    const getSellerNotificationsHandler = async () => (await getSellerNotificationsApi());
    const resolveSellerNotificationHandler = async (notificationId) => (await resolveSellerNotificationApi(notificationId));


    return { createOrderHandler, createGuestOrderHandler, getOrderHandler, cancelOrderHandler, getSellerOrdersHandler, getSellerMetricsHandler, updateOrderStatusHandler, getSellerNotificationsHandler, resolveSellerNotificationHandler }
}

export default useOrder;