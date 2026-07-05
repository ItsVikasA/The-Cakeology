import express from 'express';
import multer from 'multer';
import { verifyToken, authSeller, authAdmin } from '../middlewares/authMiddleware.js';
import {
    createCustomRequest,
    getMyCustomRequests,
    cancelCustomRequest,
    getSellerCustomRequests,
    quoteCustomRequest,
    rejectCustomRequest,
    updateCustomRequestStatus,
    createCustomPayment,
    verifyCustomPayment,
    confirmWhatsappRequest,
    confirmCustomPayment,
    sellerCancelCustomOrder,
    adminCancelCustomOrder,
} from '../controllers/customCakeController.js';

const customCakeRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ── Buyer ──
customCakeRouter.post('/request', verifyToken, upload.single('design'), createCustomRequest);
customCakeRouter.get('/my', verifyToken, getMyCustomRequests);
customCakeRouter.patch('/cancel/:requestId', verifyToken, cancelCustomRequest);
customCakeRouter.post('/pay/:requestId', verifyToken, createCustomPayment);
customCakeRouter.post('/pay/:requestId/verify', verifyToken, verifyCustomPayment);
customCakeRouter.post('/confirm-whatsapp/:requestId', verifyToken, confirmWhatsappRequest);

// ── Seller ──
customCakeRouter.get('/seller', authSeller, getSellerCustomRequests);
customCakeRouter.patch('/quote/:requestId', authSeller, quoteCustomRequest);
customCakeRouter.patch('/reject/:requestId', authSeller, rejectCustomRequest);
customCakeRouter.patch('/confirm-payment/:requestId', authSeller, confirmCustomPayment);
customCakeRouter.patch('/status/:requestId', authSeller, updateCustomRequestStatus);
customCakeRouter.patch('/seller/cancel/:requestId', authSeller, sellerCancelCustomOrder);

// ── Admin ──
customCakeRouter.patch('/admin/cancel/:requestId', authAdmin, adminCancelCustomOrder);

export default customCakeRouter;
