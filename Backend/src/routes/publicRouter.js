import express from 'express';
import { publicRoute } from '../controllers/publicController.js';

const publicRouter = express.Router();

publicRouter.get('*name', publicRoute);


export default publicRouter