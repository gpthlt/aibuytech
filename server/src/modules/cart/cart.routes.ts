import { Router } from 'express';
import cartController from './cart.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../middlewares/error';
import {
  addToCartSchema,
  updateCartItemSchema,
  removeFromCartSchema,
} from './cart.dto';

const router = Router();

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get user's cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
router.get('/', authenticate, asyncHandler(cartController.getCart));

/**
 * @swagger
 * /api/v1/cart:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Item added to cart
 */
router.post(
  '/',
  authenticate,
  validate(addToCartSchema),
  asyncHandler(cartController.addToCart)
);

/**
 * @swagger
 * /api/v1/cart:
 *   put:
 *     tags: [Cart]
 *     summary: Update cart item quantity
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cart item updated
 */
router.put(
  '/',
  authenticate,
  validate(updateCartItemSchema),
  asyncHandler(cartController.updateCartItem)
);

/**
 * @swagger
 * /api/v1/cart/{productId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
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
 *         description: Item removed from cart
 */
router.delete(
  '/:productId',
  authenticate,
  validate(removeFromCartSchema),
  asyncHandler(cartController.removeFromCart)
);

/**
 * @swagger
 * /api/v1/cart/clear:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/clear/all', authenticate, asyncHandler(cartController.clearCart));

export default router;
