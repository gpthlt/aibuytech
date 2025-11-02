import { Router } from 'express';
import { ReviewsController } from './reviews.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  createReviewSchema,
  getReviewsSchema,
  updateReviewSchema,
  deleteReviewSchema,
} from './reviews.dto.js';

const router: Router = Router();
const reviewsController = new ReviewsController();

/**
 * @swagger
 * /api/v1/products/{productId}/reviews:
 *   post:
 *     summary: Create a product review (authenticated users who purchased the product)
 *     tags: [Reviews]
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
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               isAnonymous:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Review created successfully
 *       403:
 *         description: User has not purchased the product or already reviewed
 */
router.post(
  '/:productId/reviews',
  authenticate,
  authorize('user', 'admin'),
  validate(createReviewSchema),
  reviewsController.createReview.bind(reviewsController)
);

/**
 * @swagger
 * /api/v1/products/{productId}/reviews:
 *   get:
 *     summary: Get all reviews for a product (public)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, -createdAt, rating, -rating]
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get(
  '/:productId/reviews',
  validate(getReviewsSchema),
  reviewsController.getReviews.bind(reviewsController)
);

/**
 * @swagger
 * /api/v1/products/{productId}/reviews/{reviewId}:
 *   put:
 *     summary: Update own review
 *     tags: [Reviews]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               isAnonymous:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: Not the review owner
 */
router.put(
  '/:productId/reviews/:reviewId',
  authenticate,
  authorize('user', 'admin'),
  validate(updateReviewSchema),
  reviewsController.updateReview.bind(reviewsController)
);

/**
 * @swagger
 * /api/v1/products/{productId}/reviews/{reviewId}:
 *   delete:
 *     summary: Delete review (owner or admin)
 *     tags: [Reviews]
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
 *       403:
 *         description: Not authorized
 */
router.delete(
  '/:productId/reviews/:reviewId',
  authenticate,
  authorize('user', 'admin'),
  validate(deleteReviewSchema),
  reviewsController.deleteReview.bind(reviewsController)
);

export default router;
