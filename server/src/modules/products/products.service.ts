import { Product } from '../../models/Product.js';
import { Category } from '../../models/Category.js';
import { AppError } from '../../middlewares/error.js';
import {
  getPaginationParams,
  createPaginationResult,
  PaginationResult,
} from '../../utils/pagination.js';
import { CreateProductDto, UpdateProductDto, GetProductsQuery } from './products.dto.js';

export class ProductsService {
  async getCategories() {
    const categories = await Category.find().sort({ name: 1 });
    return categories;
  }

  async getAll(query: GetProductsQuery): Promise<PaginationResult<any>> {
    const { page, limit, skip } = getPaginationParams(query.page, query.limit);

    // Build filter
    const filter: any = {};
    if (query.q) {
      filter.$text = { $search: query.q };
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = Number(query.minPrice);
      if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
    }

    // Build sort
    const sort: any = {};
    if (query.sort) {
      const sortField = query.sort.startsWith('-') ? query.sort.substring(1) : query.sort;
      sort[sortField] = query.sort.startsWith('-') ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).populate('category', 'name slug'),
      Product.countDocuments(filter),
    ]);

    return createPaginationResult(products, total, page, limit);
  }

  async getById(id: string) {
    const product = await Product.findById(id).populate('category', 'name slug description');
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    return product;
  }

  async create(data: CreateProductDto) {
    const product = await Product.create(data);
    return product.populate('category', 'name slug');
  }

  async update(id: string, data: UpdateProductDto) {
    const product = await Product.findByIdAndUpdate(id, data, { new: true }).populate(
      'category',
      'name slug'
    );
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    return product;
  }

  async delete(id: string) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    return { message: 'Product deleted successfully' };
  }
}
