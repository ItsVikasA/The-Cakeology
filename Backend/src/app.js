import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/authRouter.js';
import cors from 'cors';
import morgan from 'morgan';
import ProductRouter from './routes/productRouter.js';
import cartRouter from './routes/cartRouter.js';
import orderRouter from './routes/orderRouter.js';
import publicRouter from './routes/publicRouter.js';
import wishlistRouter from './routes/wishlistRouter.js';
import couponRouter from './routes/couponRouter.js';
import catalogRouter from './routes/catalogRouter.js';
import adminRouter from './routes/adminRouter.js';
import bannerRouter from './routes/bannerRouter.js';
import settingsRouter from './routes/settingsRouter.js';
import customCakeRouter from './routes/customCakeRouter.js';
import path from 'path';
import { fileURLToPath } from 'url';


const app = express();
app.use(express.json());

// Render (and most hosts) sit behind a proxy that terminates TLS. Trusting it
// lets secure cookies and the rate limiter see the real client protocol/IP.
app.set('trust proxy', 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const index = path.join(__dirname, '../', 'public/dist');

app.use(morgan("dev"));
app.use(express.static(index))

// Allow the configured client(s) plus local dev and the deployed apps.
const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'https://www.cakeology.com',
    'https://cakeology.com',
    'https://cakeology.onrender.com',
    'https://the-cakeology-1.onrender.com',
].filter(Boolean);

app.use(cors({
    // Allow the explicit allow-list (prod URLs + CLIENT_URL) and, for local
    // development, any localhost/127.0.0.1 port so Vite bumping 5173→5174→…
    // never trips a CORS "Network error".
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // curl / same-origin / mobile
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true
}));

app.use(cookieParser());

// Throttle auth endpoints to slow down brute-force / credential-stuffing.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts. Please try again later." },
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/products', ProductRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/coupon', couponRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/admin', adminRouter);
app.use('/api/banner', bannerRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/custom', customCakeRouter);

app.use('/', publicRouter);



export default app;