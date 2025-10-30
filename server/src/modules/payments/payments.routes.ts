import { Router } from 'express';
import paymentsController from './payments.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../middlewares/error';
import { createPaymentIntentSchema, webhookSchema } from './payments.dto';

const router = Router();

/**
 * @swagger
 * /api/v1/payments/intent:
 *   post:
 *     tags: [Payments]
 *     summary: Create payment intent
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - paymentMethod
 *             properties:
 *               orderId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, momo, vnpay]
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 */
router.post(
  '/intent',
  authenticate,
  validate(createPaymentIntentSchema),
  asyncHandler(paymentsController.createPaymentIntent)
);

/**
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Handle payment webhook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - status
 *             properties:
 *               orderId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [success, failed]
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post(
  '/webhook',
  validate(webhookSchema),
  asyncHandler(paymentsController.handleWebhook)
);

/**
 * @swagger
 * /api/v1/payments/status/{orderId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 */
router.get(
  '/status/:orderId',
  authenticate,
  asyncHandler(paymentsController.getPaymentStatus)
);

/**
 * @swagger
 * /api/v1/payments/simulate/{orderId}:
 *   post:
 *     tags: [Payments]
 *     summary: Simulate payment success (for testing)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment simulated successfully
 */
router.post(
  '/simulate/:orderId',
  authenticate,
  asyncHandler(paymentsController.simulatePaymentSuccess)
);

export default router;
