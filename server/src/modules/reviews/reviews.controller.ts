import { Request, Response, NextFunction } from 'express';
import { ReviewsService } from './reviews.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { AuthRequest } from '../../middlewares/auth.js';

const reviewsService = new ReviewsService();

export class ReviewsController {
  /**
   * Tạo review mới cho sản phẩm
   * POST /api/v1/products/:productId/reviews
   */
  async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).user!.userId;
      const { productId } = req.params;
      const review = await reviewsService.createReview(userId, productId, req.body);
      ApiResponse.created(res, review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách reviews của sản phẩm
   * GET /api/v1/products/:productId/reviews
   */
  async getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const result = await reviewsService.getReviews(productId, req.query);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật review của user
   * PUT /api/v1/products/:productId/reviews/:reviewId
   */
  async updateReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).user!.userId;
      const { productId, reviewId } = req.params;
      const review = await reviewsService.updateReview(userId, productId, reviewId, req.body);
      ApiResponse.success(res, review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xoá review (chủ review hoặc admin)
   * DELETE /api/v1/products/:productId/reviews/:reviewId
   */
  async deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).user!.userId;
      const userRole = (req as AuthRequest).user!.role;
      const { productId, reviewId } = req.params;
      const result = await reviewsService.deleteReview(userId, userRole, productId, reviewId);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
