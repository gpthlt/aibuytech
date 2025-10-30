import { Router } from 'express';
import { ProductsController } from './products.controller.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import {
  createProductSchema,
  updateProductSchema,
  getProductsSchema,
} from './products.dto.js';

const router = Router();
const productsController = new ProductsController();

/**
 * @swagger
 * /api/v1/products/categories:
 *   get:
 *     tags: [Products]
 *     summary: Get all categories
 */
router.get('/categories', productsController.getCategories);

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products
 */
router.get('/', validate(getProductsSchema), productsController.getAll);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 */
router.get('/:id', productsController.getById);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     tags: [Products]
 *     summary: Create product (Admin only)
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createProductSchema),
  productsController.create
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update product (Admin only)
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateProductSchema),
  productsController.update
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete product (Admin only)
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, authorize('admin'), productsController.delete);

export default router;
