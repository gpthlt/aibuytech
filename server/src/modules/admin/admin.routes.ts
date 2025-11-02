import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { upload } from '../../config/upload.js';
import {
  getUsersQuerySchema,
  updateUserRoleSchema,
  deleteUserSchema,
  getProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  updateOrderStatusSchema,
  getOrdersQuerySchema,
  getStatsQuerySchema,
  getReviewsQuerySchema,
  deleteReviewSchema,
} from './admin.dto.js';

const router = Router();
const controller = new AdminController();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// ============================================
// Dashboard & Statistics
// ============================================

/**
 * @swagger
 * /api/v1/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard/stats', validate(getStatsQuerySchema), controller.getDashboardStats);

/**
 * @swagger
 * /api/v1/admin/dashboard/sales:
 *   get:
 *     summary: Get sales chart data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *     responses:
 *       200:
 *         description: Sales chart data
 */
router.get('/dashboard/sales', validate(getStatsQuerySchema), controller.getSalesChart);

// ============================================
// User Management
// ============================================

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', validate(getUsersQuerySchema), controller.getUsers);

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/users/:userId', controller.getUserById);

/**
 * @swagger
 * /api/v1/admin/users/{userId}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: User role updated
 */
router.patch('/users/:userId/role', validate(updateUserRoleSchema), controller.updateUserRole);

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/users/:userId', validate(deleteUserSchema), controller.deleteUser);

// ============================================
// Product Management
// ============================================

/**
 * @swagger
 * /api/v1/admin/products:
 *   get:
 *     summary: Get all products (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/products', validate(getProductsQuerySchema), controller.getProducts);

/**
 * @swagger
 * /api/v1/admin/products:
 *   post:
 *     summary: Create new product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               stock:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/products', upload.array('images', 6), controller.createProduct);

/**
 * @swagger
 * /api/v1/admin/products/{productId}:
 *   put:
 *     summary: Update product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put('/products/:productId', upload.array('images', 6), controller.updateProduct);
router.patch('/products/:productId', upload.array('images', 6), controller.updateProduct);

/**
 * @swagger
 * /api/v1/admin/products/{productId}:
 *   delete:
 *     summary: Delete product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete('/products/:productId', validate(deleteProductSchema), controller.deleteProduct);

// ============================================
// Order Management
// ============================================

/**
 * @swagger
 * /api/v1/admin/orders:
 *   get:
 *     summary: Get all orders (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/orders', validate(getOrdersQuerySchema), controller.getAllOrders);

/**
 * @swagger
 * /api/v1/admin/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.patch('/orders/:orderId/status', validate(updateOrderStatusSchema), controller.updateOrderStatus);

// ============================================
// Review Management
// ============================================

/**
 * @swagger
 * /api/v1/admin/reviews:
 *   get:
 *     summary: Get all reviews (admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           description: Search by review content
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/reviews', validate(getReviewsQuerySchema), controller.getReviews);

/**
 * @swagger
 * /api/v1/admin/reviews/{productId}/{reviewId}:
 *   delete:
 *     summary: Delete a review (admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 */
router.delete('/reviews/:productId/:reviewId', validate(deleteReviewSchema), controller.deleteReview);

export default router;
