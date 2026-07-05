import express from 'express';
import { authAdmin } from '../middlewares/authMiddleware.js';
import { getSettings, getPublicSettings, updateSettings } from '../controllers/settingsController.js';

const settingsRouter = express.Router();

settingsRouter.get('/public', getPublicSettings);
settingsRouter.get('/', authAdmin, getSettings);
settingsRouter.patch('/', authAdmin, updateSettings);

export default settingsRouter;
