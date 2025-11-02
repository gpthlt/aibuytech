import { Product, IReview } from '../../models/Product.js';
import { Order } from '../../models/Order.js';
import { User } from '../../models/User.js';
import { AppError } from '../../middlewares/error.js';
import {
  getPaginationParams,
  createPaginationResult,
  PaginationResult,
} from '../../utils/pagination.js';
import { CreateReviewDto, UpdateReviewDto, GetReviewsQuery } from './reviews.dto.js';
import { Types } from 'mongoose';

export class ReviewsService {
  /**
   * Kiểm tra xem user đã mua sản phẩm chưa (order status = delivered)
   */
  private async checkUserPurchased(userId: string, productId: string): Promise<boolean> {
    const order = await Order.findOne({
      user: userId,
      'items.product': productId,
      status: 'delivered',
    });
    return !!order;
  }

  /**
   * Tính toán và cập nhật rating trung bình của sản phẩm
   */
  private async updateProductRating(productId: string): Promise<void> {
    const product = await Product.findById(productId);
    if (!product) return;

    const totalReviews = product.reviews.length;
    if (totalReviews === 0) {
      product.averageRating = 0;
      product.totalReviews = 0;
    } else {
      const sumRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      product.averageRating = Math.round((sumRating / totalReviews) * 10) / 10; // Round to 1 decimal
      product.totalReviews = totalReviews;
    }

    await product.save();
  }

  /**
   * Tạo review mới
   */
  async createReview(
    userId: string,
    productId: string,
    data: CreateReviewDto
  ): Promise<IReview> {
    // 1. Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // 2. Kiểm tra user đã mua sản phẩm chưa
    const hasPurchased = await this.checkUserPurchased(userId, productId);
    if (!hasPurchased) {
      throw new AppError(
        'You must purchase and receive this product before reviewing',
        403,
        'REVIEW_NOT_ALLOWED'
      );
    }

    // 3. Kiểm tra user đã review chưa (chỉ được review 1 lần)
    const existingReview = product.reviews.find(
      (review) => review.user.toString() === userId
    );
    if (existingReview) {
      throw new AppError(
        'You have already reviewed this product',
        400,
        'REVIEW_ALREADY_EXISTS'
      );
    }

    // 4. Tạo review mới
    const newReview = {
      _id: new Types.ObjectId(),
      user: new Types.ObjectId(userId),
      rating: data.rating,
      content: data.content,
      isAnonymous: data.isAnonymous ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IReview;

    product.reviews.push(newReview);
    await product.save();

    // 5. Cập nhật rating trung bình
    await this.updateProductRating(productId);

    return newReview;
  }

  /**
   * Lấy danh sách reviews của sản phẩm (có phân trang)
   */
  async getReviews(
    productId: string,
    query: GetReviewsQuery
  ): Promise<PaginationResult<any>> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const { page, limit, skip } = getPaginationParams(query.page, query.limit);

    // Sort reviews
    let reviews = [...product.reviews];
    if (query.sort) {
      const sortField = query.sort.startsWith('-') ? query.sort.substring(1) : query.sort;
      const sortOrder = query.sort.startsWith('-') ? -1 : 1;

      reviews.sort((a: any, b: any) => {
        if (sortField === 'createdAt') {
          return sortOrder * (a.createdAt.getTime() - b.createdAt.getTime());
        } else if (sortField === 'rating') {
          return sortOrder * (a.rating - b.rating);
        }
        return 0;
      });
    } else {
      // Default: newest first
      reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Pagination
    const total = reviews.length;
    const paginatedReviews = reviews.slice(skip, skip + limit);

    // Populate user info
    const reviewIds = paginatedReviews.map((r) => r.user);
    const users = await User.find({ _id: { $in: reviewIds } }).select('fullName email');
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const populatedReviews = paginatedReviews.map((review: any) => {
      const reviewObj = review.toObject ? review.toObject() : review;
      
      if (!reviewObj.isAnonymous) {
        const user = userMap.get(reviewObj.user.toString());
        return {
          ...reviewObj,
          user: user
            ? {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
              }
            : {
                _id: reviewObj.user,
                fullName: 'Unknown User',
                email: null,
              },
        };
      }
      
      return {
        ...reviewObj,
        user: {
          _id: reviewObj.user,
          fullName: 'Anonymous User',
          email: null,
        },
      };
    });

    return createPaginationResult(populatedReviews, total, page, limit);
  }

  /**
   * Update review (chỉ chủ review mới được sửa)
   */
  async updateReview(
    userId: string,
    productId: string,
    reviewId: string,
    data: UpdateReviewDto
  ): Promise<IReview> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const review = product.reviews.find((r) => r._id.toString() === reviewId);
    if (!review) {
      throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    // Kiểm tra quyền sở hữu
    if (review.user.toString() !== userId) {
      throw new AppError('You can only edit your own review', 403, 'FORBIDDEN');
    }

    // Update fields
    if (data.rating !== undefined) review.rating = data.rating;
    if (data.content !== undefined) review.content = data.content;
    if (data.isAnonymous !== undefined) review.isAnonymous = data.isAnonymous;
    review.updatedAt = new Date();

    await product.save();

    // Cập nhật rating trung bình
    await this.updateProductRating(productId);

    return review;
  }

  /**
   * Xoá review (chủ review hoặc admin)
   */
  async deleteReview(
    userId: string,
    userRole: string,
    productId: string,
    reviewId: string
  ): Promise<{ message: string }> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const review = product.reviews.find((r) => r._id.toString() === reviewId);
    if (!review) {
      throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    // Kiểm tra quyền (chủ review hoặc admin)
    const isOwner = review.user.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new AppError('You can only delete your own review', 403, 'FORBIDDEN');
    }

    // Xoá review
    product.reviews = product.reviews.filter((r) => r._id.toString() !== reviewId);
    await product.save();

    // Cập nhật rating trung bình
    await this.updateProductRating(productId);

    return { message: 'Review deleted successfully' };
  }
}
