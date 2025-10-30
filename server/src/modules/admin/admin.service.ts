import { User } from '../../models/User.js';
import { Product } from '../../models/Product.js';
import { Order } from '../../models/Order.js';
import { ApiError } from '../../utils/ApiResponse.js';
import { paginate, PaginationOptions } from '../../utils/pagination.js';
import { deleteFiles } from '../../config/upload.js';
import type {
  GetUsersQuery,
  UpdateUserRoleBody,
  CreateProductBody,
  UpdateProductBody,
  GetProductsQuery,
  UpdateOrderStatusBody,
  GetOrdersQuery,
  GetStatsQuery,
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
    return product;
  }

  async updateProduct(productId: string, data: UpdateProductBody, newImages?: string[]) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Handle image updates
    if (newImages !== undefined) {
      // Delete old images that are not in newImages
      if (product.images && product.images.length > 0) {
        const imagesToDelete = product.images.filter(img => !newImages.includes(img));
        if (imagesToDelete.length > 0) {
          const oldImagePaths = imagesToDelete.map((img) => img.replace('/uploads/', 'uploads/'));
          deleteFiles(oldImagePaths);
        }
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
}
