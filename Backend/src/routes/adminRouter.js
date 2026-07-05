import express from 'express';
import { authAdmin } from '../middlewares/authMiddleware.js';
import { getAdminMetrics, getAdminOrders, getAllUsers, toggleBlockUser, deleteUser, getTransactions, refundTransaction, getReports, getNotifications, resolveNotification } from '../controllers/adminController.js';

const adminRouter = express.Router();

adminRouter.get('/metrics', authAdmin, getAdminMetrics);
adminRouter.get('/orders', authAdmin, getAdminOrders);
adminRouter.get('/users', authAdmin, getAllUsers);
adminRouter.patch('/users/:userId/block', authAdmin, toggleBlockUser);
adminRouter.delete('/users/:userId', authAdmin, deleteUser);
adminRouter.get('/transactions', authAdmin, getTransactions);
adminRouter.patch('/transactions/:paymentId/refund', authAdmin, refundTransaction);
adminRouter.get('/reports', authAdmin, getReports);
adminRouter.get('/notifications', authAdmin, getNotifications);
adminRouter.patch('/notifications/:notificationId/resolve', authAdmin, resolveNotification);

export default adminRouter;
