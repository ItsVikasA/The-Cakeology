import express from 'express';
import multer from 'multer';
import { authAdmin } from '../middlewares/authMiddleware.js';
import { getActiveBanners, getAllBanners, createBanner, toggleBanner, deleteBanner } from '../controllers/bannerController.js';

const bannerRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

bannerRouter.get('/', getActiveBanners);
bannerRouter.get('/all', authAdmin, getAllBanners);
bannerRouter.post('/', authAdmin, upload.single('image'), createBanner);
bannerRouter.patch('/toggle/:bannerId', authAdmin, toggleBanner);
bannerRouter.delete('/:bannerId', authAdmin, deleteBanner);

export default bannerRouter;
