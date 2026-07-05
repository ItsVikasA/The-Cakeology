import express from 'express';
import { authSeller } from '../middlewares/authMiddleware.js';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { getBrands, createBrand, deleteBrand } from '../controllers/brandController.js';

const router = express.Router();

// Categories
router.get('/categories', getCategories);
router.post('/categories', authSeller, createCategory);
router.patch('/categories/:categoryId', authSeller, updateCategory);
router.delete('/categories/:categoryId', authSeller, deleteCategory);

// Brands
router.get('/brands', getBrands);
router.post('/brands', authSeller, createBrand);
router.delete('/brands/:brandId', authSeller, deleteBrand);

export default router;
