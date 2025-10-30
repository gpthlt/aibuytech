import { Request, Response, NextFunction } from 'express';
import { ProductsService } from './products.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const productsService = new ProductsService();

export class ProductsController {
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await productsService.getCategories();
      return ApiResponse.success(res, categories);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productsService.getAll(req.query);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.getById(req.params.id);
      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.create(req.body);
      return ApiResponse.created(res, product);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.update(req.params.id, req.body);
      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productsService.delete(req.params.id);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
