import { Router } from 'express';
import { ProductsController } from './products.controller.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { uploadMemory } from '../../config/upload.js';
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
 * /api/v1/products/search/image:
 *   post:
 *     tags: [Products]
 *     summary: Search products by image similarity
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               topK:
 *                 type: integer
 *                 default: 5
 */
router.post('/search/image', uploadMemory.single('image'), productsController.searchByImage);

/**
 * @swagger
 * /api/v1/products/search/ai:
 *   post:
 *     tags: [Products]
 *     summary: Search products using AI natural language query
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 example: "I want a smartphone under $800"
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 12
 */
router.post('/search/ai', productsController.searchByAI);

/**
 * @swagger
 * /api/v1/products/compare:
 *   post:
 *     tags: [Products]
 *     summary: Compare products and generate comparison document
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 2
 *                 maxItems: 4
 *                 example: ["productId1", "productId2"]
 *     responses:
 *       200:
 *         description: Comparison document (docx file)
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/compare', productsController.compareProducts);

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
