import express from 'express';
import { authSeller, verifyToken } from '../middlewares/authMiddleware.js';
import { createCoupon, getSellerCoupons, toggleCoupon, deleteCoupon, validateCoupon } from '../controllers/couponController.js';

const couponRouter = express.Router();

// Seller management
couponRouter.post('/', authSeller, createCoupon);
couponRouter.get('/seller', authSeller, getSellerCoupons);
couponRouter.patch('/toggle/:couponId', authSeller, toggleCoupon);
couponRouter.delete('/:couponId', authSeller, deleteCoupon);

// Buyer validation at checkout
couponRouter.post('/validate', verifyToken, validateCoupon);

export default couponRouter;
