import { getAdminMetricsApi, getAdminOrdersApi, getAllUsersApi, toggleBlockUserApi, deleteUserApi, getTransactionsApi, refundTransactionApi, getReportsApi, getNotificationsApi, resolveNotificationApi } from "../Service/adminApi";

const useAdmin = () => {
    const getAdminMetricsHandler = async () => (await getAdminMetricsApi()).metrics;
    const getAdminOrdersHandler = async (params) => (await getAdminOrdersApi(params)).orders;
    const getAllUsersHandler = async (params) => (await getAllUsersApi(params)).users;
    const toggleBlockUserHandler = async (userId) => (await toggleBlockUserApi(userId));
    const deleteUserHandler = async (userId) => (await deleteUserApi(userId));
    const getTransactionsHandler = async (params) => (await getTransactionsApi(params));
    const refundTransactionHandler = async (paymentId) => (await refundTransactionApi(paymentId));
    const getReportsHandler = async (range) => (await getReportsApi(range)).report;
    const getNotificationsHandler = async () => (await getNotificationsApi());
    const resolveNotificationHandler = async (notificationId) => (await resolveNotificationApi(notificationId));

    return { getAdminMetricsHandler, getAdminOrdersHandler, getAllUsersHandler, toggleBlockUserHandler, deleteUserHandler, getTransactionsHandler, refundTransactionHandler, getReportsHandler, getNotificationsHandler, resolveNotificationHandler };
};

export default useAdmin;
