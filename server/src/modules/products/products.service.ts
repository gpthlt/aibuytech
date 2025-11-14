import mongoose from 'mongoose';
import { Product } from '../../models/Product.js';
import { Category } from '../../models/Category.js';
import { AppError } from '../../middlewares/error.js';
import {
  getPaginationParams,
  createPaginationResult,
  PaginationResult,
} from '../../utils/pagination.js';
import { CreateProductDto, UpdateProductDto, GetProductsQuery } from './products.dto.js';
import {
  retrieveSimilarImagesFromBuffer,
  extractConstraints,
  ProductConstraint,
  compareProducts,
  ProductForComparison,
  ComparisonResponse,
} from '../../utils/aiService.js';

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
      // Use regex for partial text search (case-insensitive)
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { description: { $regex: query.q, $options: 'i' } },
      ];
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

  async searchByImage(imageBuffer: Buffer, topK: number = 5): Promise<PaginationResult<any>> {
    try {
      // Call AI service to retrieve similar images
      const aiResults = await retrieveSimilarImagesFromBuffer(imageBuffer, topK);

      // Group results by item_id and keep the highest similarity for each product
      // Filter out results with similarity below threshold (0.4) to prevent showing unrelated products
      const SIMILARITY_THRESHOLD = 0.4;
      const itemSimilarityMap = new Map<string, number>();
      for (const result of aiResults.results) {
        // Skip results below the similarity threshold
        if (result.similarity < SIMILARITY_THRESHOLD) continue;

        const itemId = result.metadata.item_id;
        if (!itemId) continue;

        const currentSimilarity = itemSimilarityMap.get(itemId) || 0;
        if (result.similarity > currentSimilarity) {
          itemSimilarityMap.set(itemId, result.similarity);
        }
      }

      // Extract unique item_ids
      const itemIds = Array.from(itemSimilarityMap.keys());

      if (itemIds.length === 0) {
        return createPaginationResult([], 0, 1, topK);
      }

      // Convert string IDs to ObjectIds
      const objectIds = itemIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (objectIds.length === 0) {
        return createPaginationResult([], 0, 1, topK);
      }

      // Fetch products by IDs
      const products = await Product.find({
        _id: { $in: objectIds },
        isActive: true,
      }).populate('category', 'name slug');

      // Map products with their highest similarity scores, sorted by similarity (descending)
      // Filter out products with similarity below threshold
      const productsWithSimilarity = products
        .map((product) => {
          const similarity = itemSimilarityMap.get(product._id.toString()) || 0;
          return { ...product.toObject(), similarity };
        })
        .filter((product) => product.similarity >= SIMILARITY_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity);

      return createPaginationResult(productsWithSimilarity, productsWithSimilarity.length, 1, topK);
    } catch (error) {
      throw new AppError('Image search failed', 500, 'IMAGE_SEARCH_ERROR');
    }
  }

  async searchByAI(
    userQuery: string,
    page: number = 1,
    limit: number = 12
  ): Promise<PaginationResult<any>> {
    try {
      // Extract constraints from AI service
      const constraints = await extractConstraints(userQuery);

      const { skip } = getPaginationParams(page, limit);

      // Build filter based on constraints
      const filter: any = { isActive: true };

      // Filter by category if provided
      if (constraints.category) {
        // Find category by name (case-insensitive)
        const category = await Category.findOne({
          name: { $regex: new RegExp(`^${constraints.category}$`, 'i') },
        });
        if (category) {
          filter.category = category._id;
        } else {
          // If category not found, try slug
          const categoryBySlug = await Category.findOne({
            slug: { $regex: new RegExp(`^${constraints.category}$`, 'i') },
          });
          if (categoryBySlug) {
            filter.category = categoryBySlug._id;
          }
        }
      }

      // Filter by budget if provided
      if (constraints.budget !== null && constraints.budget !== undefined) {
        if (constraints.expression === 'Less') {
          filter.price = { $lte: constraints.budget };
        } else if (constraints.expression === 'More') {
          filter.price = { $gte: constraints.budget };
        } else {
          // If no expression, treat as maximum budget
          filter.price = { $lte: constraints.budget };
        }
      }

      // Build sort
      const sort: any = { createdAt: -1 };

      const [products, total] = await Promise.all([
        Product.find(filter).sort(sort).skip(skip).limit(limit).populate('category', 'name slug'),
        Product.countDocuments(filter),
      ]);

      return createPaginationResult(products, total, page, limit);
    } catch (error) {
      throw new AppError('AI search failed', 500, 'AI_SEARCH_ERROR');
    }
  }

  async compareProducts(productIds: string[]): Promise<ComparisonResponse> {
    if (productIds.length < 2 || productIds.length > 4) {
      throw new AppError(
        'Please select between 2-4 products for comparison',
        400,
        'INVALID_COMPARISON_COUNT'
      );
    }

    // Fetch products with reviews
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    }).populate('category', 'name');

    if (products.length !== productIds.length) {
      throw new AppError('One or more products not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Format products for AI service
    const productsForComparison: ProductForComparison[] = products.map((product) => {
      const reviews = product.reviews.map((review, index) => ({
        id: review._id.toString(),
        content: review.content,
        rating: review.rating,
        date: review.createdAt.toISOString(),
        verified_purchase: false, // We don't track this in our schema
      }));

      return {
        id: product._id.toString(),
        name: product.name,
        reviews: reviews,
        description: product.description,
        price: product.price,
        category: product.category ? (product.category as any).name : undefined,
        stock: product.stock,
      };
    });

    // Call AI service
    const comparisonResult = await compareProducts(productsForComparison);
    return comparisonResult;
  }
}
