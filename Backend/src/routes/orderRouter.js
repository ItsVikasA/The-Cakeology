import express from 'express';
import { addItemToCart, getCartItems, addItemQuantity, subItemQuantity, removeItem, createPaymentOrder, verifyPayment } from '../controllers/cartController.js';
import { authSeller, verifyToken } from '../middlewares/authMiddleware.js';
import { addToCartValidator, cartItemValidator } from '../validation/cartValidation.js';
import { createOrder, createGuestOrder, getOrder, getSellerOrders, updateOrderStatus, cancelOrder, getSellerMetrics, getSellerNotifications, resolveSellerNotification } from '../controllers/orderController.js';
import { createOrderValidator } from '../validation/orderValidation.js';

const orderRouter = express.Router();

orderRouter.post('/createOrder', verifyToken, createOrderValidator, createOrder);

// Guest checkout — no auth. Gated server-side by the store's checkout mode.
orderRouter.post('/guestOrder', createGuestOrder);

orderRouter.post('/getOrder', verifyToken, getOrder);

orderRouter.patch('/cancel/:orderId', verifyToken, cancelOrder);

orderRouter.get('/sellerOrders', authSeller, getSellerOrders);

orderRouter.get('/sellerMetrics', authSeller, getSellerMetrics);

orderRouter.patch('/updateStatus/:orderId', authSeller, updateOrderStatus);

orderRouter.get('/sellerNotifications', authSeller, getSellerNotifications);

orderRouter.patch('/sellerNotifications/:notificationId/resolve', authSeller, resolveSellerNotification);

export default orderRouter;