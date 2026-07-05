import express from 'express';
import { forgotPassword, getMe, login, logout, protectedRoute, register, resetPassword, sessionProtectedRoute, getAddresses, addAddress, deleteAddress } from '../controllers/authController.js';
import { loginValidator, newPasswordValidator, registerValidator } from '../validation/authValidation.js';
import { verifySessionId, verifyToken } from '../middlewares/authMiddleware.js';

const authRouter = express.Router();

authRouter.post('/register', registerValidator, register);

authRouter.post('/login', loginValidator, login);

authRouter.get('/logout', logout);

authRouter.get('/getMe', verifyToken, getMe);

authRouter.post('/forgotPassword', forgotPassword);

authRouter.patch('/resetPassword', verifySessionId, newPasswordValidator, resetPassword);

authRouter.get('/checkSessionId', verifySessionId, sessionProtectedRoute);

authRouter.get('/protectedRoute', verifyToken, protectedRoute);

authRouter.get('/addresses', verifyToken, getAddresses);

authRouter.post('/addresses', verifyToken, addAddress);

authRouter.delete('/addresses/:addressId', verifyToken, deleteAddress);


export default authRouter