import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().min(0, 'Price must be positive'),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    stock: z.number().min(0, 'Stock must be non-negative'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(10).optional(),
    price: z.number().min(0).optional(),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    stock: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getProductsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    q: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    sort: z.enum(['price', '-price', 'createdAt', '-createdAt']).optional(),
  }),
});

export type CreateProductDto = z.infer<typeof createProductSchema>['body'];
export type UpdateProductDto = z.infer<typeof updateProductSchema>['body'];
export type GetProductsQuery = z.infer<typeof getProductsSchema>['query'];
