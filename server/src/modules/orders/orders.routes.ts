import { Router } from 'express';
import ordersController from './orders.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../middlewares/error';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  getOrderByIdSchema,
} from './orders.dto';

const router = Router();

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create order from cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cod, credit_card, momo, vnpay]
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post(
  '/',
  authenticate,
  validate(createOrderSchema),
  asyncHandler(ordersController.createOrder)
);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/', authenticate, asyncHandler(ordersController.getOrders));

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 */
router.get(
  '/:id',
  authenticate,
  validate(getOrderByIdSchema),
  asyncHandler(ordersController.getOrderById)
);

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  validate(updateOrderStatusSchema),
  asyncHandler(ordersController.updateOrderStatus)
);

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
router.post(
  '/:id/cancel',
  authenticate,
  asyncHandler(ordersController.cancelOrder)
);

export default router;
