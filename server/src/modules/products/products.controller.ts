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

  async searchByImage(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        return ApiResponse.error(res, { message: 'No image file provided' }, 400);
      }

      const topK = req.body.topK ? parseInt(req.body.topK, 10) : 5;
      const imageBuffer = file.buffer;

      const result = await productsService.searchByImage(imageBuffer, topK);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async searchByAI(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, page, limit } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return ApiResponse.error(res, { message: 'Search query is required' }, 400);
      }

      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 12;

      const result = await productsService.searchByAI(query.trim(), pageNum, limitNum);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async compareProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { productIds } = req.body;

      if (!Array.isArray(productIds) || productIds.length < 2 || productIds.length > 4) {
        return ApiResponse.error(
          res,
          { message: 'Please provide 2-4 product IDs for comparison' },
          400
        );
      }

      const comparisonResult = await productsService.compareProducts(productIds);

      // Generate docx
      const { generateComparisonDocx } = await import('../../utils/generateComparisonDocx.js');
      const productNames = Object.keys(comparisonResult.product_summaries);
      const docxBuffer = await generateComparisonDocx(comparisonResult, productNames);

      // Set headers for file download
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="so-sanh-san-pham-${Date.now()}.docx"`
      );

      return res.send(docxBuffer);
    } catch (error) {
      next(error);
    }
  }
}
