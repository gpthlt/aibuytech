import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
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

const adminService = new AdminService();

export class AdminController {
  // ============================================
  // User Management
  // ============================================

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as GetUsersQuery;
      const result = await adminService.getUsers(query);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const user = await adminService.getUserById(userId);
      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const data = req.body as UpdateUserRoleBody;
      const user = await adminService.updateUserRole(userId, data);
      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await adminService.deleteUser(userId);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Product Management
  // ============================================

  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as GetProductsQuery;
      const result = await adminService.getProducts(query);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as CreateProductBody;
      
      // Handle uploaded images
      const files = req.files as Express.Multer.File[];
      const images = files?.map((file) => `/uploads/products/${file.filename}`) || [];
      
      const product = await adminService.createProduct(data, images);
      return ApiResponse.created(res, product);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const data = req.body as UpdateProductBody;
      
      // Handle uploaded images
      const files = req.files as Express.Multer.File[];
      const newImages = files?.length > 0 
        ? files.map((file) => `/uploads/products/${file.filename}`)
        : [];
      
      // Get existing images from request body (images that weren't removed)
      const existingImages = req.body['existingImages[]'] 
        ? Array.isArray(req.body['existingImages[]']) 
          ? req.body['existingImages[]']
          : [req.body['existingImages[]']]
        : [];
      
      // Combine existing images with new images
      const allImages = [...existingImages, ...newImages];
      
      const product = await adminService.updateProduct(productId, data, allImages.length > 0 ? allImages : undefined);
      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const result = await adminService.deleteProduct(productId);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Order Management
  // ============================================

  async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as GetOrdersQuery;
      const result = await adminService.getAllOrders(query);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const data = req.body as UpdateOrderStatusBody;
      const order = await adminService.updateOrderStatus(orderId, data);
      return ApiResponse.success(res, order);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Dashboard & Statistics
  // ============================================

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as GetStatsQuery;
      const stats = await adminService.getDashboardStats(query);
      return ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async getSalesChart(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as GetStatsQuery;
      const data = await adminService.getSalesChart(query);
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}
