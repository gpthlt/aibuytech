import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../models/User.js';
import { Product } from '../../models/Product.js';
import { Order } from '../../models/Order.js';
import { ApiError } from '../../utils/ApiResponse.js';
import { paginate, PaginationOptions } from '../../utils/pagination.js';
import { deleteFiles } from '../../config/upload.js';
import { upsertImage } from '../../utils/aiService.js';
import { logger } from '../../utils/logger.js';
import type {
  GetUsersQuery,
  UpdateUserRoleBody,
  CreateProductBody,
  UpdateProductBody,
  GetProductsQuery,
  UpdateOrderStatusBody,
  GetOrdersQuery,
  GetStatsQuery,
  GetReviewsQuery,
} from './admin.dto.js';

export class AdminService {
  // ============================================
  // User Management
  // ============================================

  async getUsers(query: GetUsersQuery) {
    const { page = 1, limit = 10, role, q } = query;

    const filter: any = {};
    if (role) filter.role = role;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const options: PaginationOptions = { page, limit, sort: { createdAt: -1 } };

    return paginate(User, filter, options, { password: 0 });
  }

  async getUserById(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  async updateUserRole(userId: string, data: UpdateUserRoleBody) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    user.role = data.role;
    await user.save();

    return user;
  }

  async deleteUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Don't allow deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new ApiError(400, 'Cannot delete the last admin user');
      }
    }

    await User.findByIdAndDelete(userId);
    return { message: 'User deleted successfully' };
  }

  // ============================================
  // Product Management
  // ============================================

  async getProducts(query: GetProductsQuery) {
    const { page = 1, limit = 10, q, isActive } = query;
    
    const filter: any = {};
    
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const result = await paginate<any>(
      Product,
      filter,
      { page, limit, sort: { createdAt: -1 } },
      {},
      ['category']
    );

    return result;
  }

  async createProduct(data: CreateProductBody, images?: string[]) {
    const productData: any = { ...data };
    
    // Add images if provided
    if (images && images.length > 0) {
      productData.images = images;
    }
    
    const product = await Product.create(productData);
    
    // Embed images to AI service (Milvus) after product is created
    if (images && images.length > 0) {
      await this.embedProductImages(product._id.toString(), images);
    }
    
    return product;
  }

  async updateProduct(productId: string, data: UpdateProductBody, newImages?: string[]) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Handle image updates
    if (newImages !== undefined) {
      const oldImages = product.images || [];
      
      // Find newly added images (images in newImages but not in oldImages)
      const addedImages = newImages.filter(img => !oldImages.includes(img));
      
      // Find removed images (images in oldImages but not in newImages)
      const removedImages = oldImages.filter(img => !newImages.includes(img));
      
      // Delete removed image files from filesystem
      if (removedImages.length > 0) {
        const oldImagePaths = removedImages.map((img) => img.replace('/uploads/', 'uploads/'));
        deleteFiles(oldImagePaths);
        
        // The old embeddings will remain but won't be matched since item_id won't match active products
        logger.info(`Removed ${removedImages.length} image(s) from product ${productId}`);
      }
      
      // Embed newly added images to AI service
      if (addedImages.length > 0) {
        await this.embedProductImages(productId, addedImages);
      }
      
      data.images = newImages;
    }

    Object.assign(product, data);
    await product.save();

    return product;
  }

  async deleteProduct(productId: string) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Delete associated images
    if (product.images && product.images.length > 0) {
      const imagePaths = product.images.map((img) => img.replace('/uploads/', 'uploads/'));
      deleteFiles(imagePaths);
    }

    await Product.findByIdAndDelete(productId);
    return { message: 'Product deleted successfully' };
  }

  // ============================================
  // Order Management
  // ============================================

  async getAllOrders(query: GetOrdersQuery) {
    const { page = 1, limit = 10, status, userId } = query;

    const filter: any = {};
    if (status) filter.status = status;
    if (userId) filter.user = userId;

    const options: PaginationOptions = { page, limit, sort: { createdAt: -1 } };

    return paginate(
      Order,
      filter,
      options,
      {},
      [
        { path: 'user', select: 'name email' },
        { path: 'items.product', select: 'name price images' },
      ]
    );
  }

  async updateOrderStatus(orderId: string, data: UpdateOrderStatusBody) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Prevent updating cancelled orders
    if (order.status === 'cancelled') {
      throw new ApiError(400, 'Cannot update status of cancelled order');
    }

    order.status = data.status;
    await order.save();

    return order;
  }

  // ============================================
  // Dashboard Statistics
  // ============================================

  async getDashboardStats(query: GetStatsQuery) {
    const { period = 'month' } = query;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get statistics
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      revenueData,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      // User stats
      User.countDocuments(),

      // Product stats
      Product.countDocuments({ isActive: true }),

      // Order stats
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),

      // Revenue calculation
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $nin: ['cancelled'] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' },
          },
        },
      ]),

      // Low stock products
      Product.find({ stock: { $lte: 10 }, isActive: true })
        .select('name stock')
        .limit(10),

      // Recent orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .populate('items.product', 'name'),
    ]);

    const revenue = revenueData[0] || { totalRevenue: 0, averageOrderValue: 0 };

    return {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenue.totalRevenue,
        averageOrderValue: revenue.averageOrderValue,
      },
      orders: {
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      lowStockProducts,
      recentOrders,
      period,
    };
  }

  async getSalesChart(query: GetStatsQuery) {
    const { period = 'month' } = query;

    const now = new Date();
    let startDate: Date;
    let groupBy: any;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' },
        };
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        };
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $nin: ['cancelled'] },
        },
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 },
      },
    ]);

    return salesData;
  }

  // ============================================
  // Review Management
  // ============================================

  async getReviews(query: GetReviewsQuery) {
    const { page = 1, limit = 10, productId, rating, q } = query;

    // Build filter for products
    const productFilter: any = {};
    if (productId) {
      productFilter._id = productId;
    }

    // Find products with reviews
    const products = await Product.find({
      ...productFilter,
      'reviews.0': { $exists: true }, // Has at least one review
    }).populate('reviews.user', 'fullName email');

    // Flatten reviews from all products
    const allReviews: any[] = [];
    products.forEach((product) => {
      product.reviews.forEach((review: any) => {
        // Apply filters
        if (rating && review.rating !== rating) return;
        if (q && !review.content.toLowerCase().includes(q.toLowerCase())) return;

        allReviews.push({
          _id: review._id,
          productId: product._id,
          productName: product.name,
          rating: review.rating,
          content: review.content,
          isAnonymous: review.isAnonymous,
          user: review.user,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        });
      });
    });

    // Sort by creation date (newest first)
    allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Paginate
    const total = allReviews.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = allReviews.slice(startIndex, endIndex);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1,
      },
    };
  }

  async deleteReview(productId: string, reviewId: string) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const reviewIndex = product.reviews.findIndex((r: any) => r._id.toString() === reviewId);
    if (reviewIndex === -1) {
      throw new ApiError(404, 'Review not found');
    }

    // Remove review
    product.reviews.splice(reviewIndex, 1);

    // Recalculate rating
    if (product.reviews.length > 0) {
      const totalRating = product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
      product.averageRating = totalRating / product.reviews.length;
      product.totalReviews = product.reviews.length;
    } else {
      product.averageRating = 0;
      product.totalReviews = 0;
    }

    await product.save();

    return { message: 'Review deleted successfully' };
  }

  // ============================================
  // Image Embedding Helper
  // ============================================

  /**
   * Embed product images to AI service (Milvus)
   * @param productId - The product ID to use as item_id in metadata
   * @param imagePaths - Array of image paths (e.g., ['/uploads/products/image.jpg'])
   */
  private async embedProductImages(productId: string, imagePaths: string[]): Promise<void> {
    for (const imagePath of imagePaths) {
      try {
        // Remove leading slash if present
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        const fullImagePath = path.join(process.cwd(), cleanPath);
        
        if (!fs.existsSync(fullImagePath)) {
          logger.warn(`Image file not found: ${fullImagePath}`);
          continue;
        }

        // Generate UUID for image_id
        const imageId = uuidv4();
        const itemId = productId;
        
        // Embed image to AI service
        await upsertImage(imageId, fullImagePath, itemId);
        logger.info(`✓ Embedded image ${imageId} for product ${productId}`);
      } catch (error) {
        logger.error(`Failed to embed image ${imagePath} for product ${productId}:`, error);
        // Continue with other images even if one fails
      }
    }
  }
}
