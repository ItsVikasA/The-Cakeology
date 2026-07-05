import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { getWishlist, toggleWishlist } from '../controllers/wishlistController.js';

const wishlistRouter = express.Router();

wishlistRouter.get('/', verifyToken, getWishlist);

wishlistRouter.post('/toggle/:productId', verifyToken, toggleWishlist);

export default wishlistRouter;
