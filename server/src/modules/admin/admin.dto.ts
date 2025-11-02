import { z } from 'zod';

// ============================================
// User Management DTOs
// ============================================

export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    role: z.enum(['user', 'admin']).optional(),
    q: z.string().optional(),
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
  body: z.object({
    role: z.enum(['user', 'admin']),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
});

// ============================================
// Product Management DTOs
// ============================================

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(200),
    description: z.string().min(10),
    price: z.number().positive(),
    category: z.string().min(1),
    stock: z.number().int().min(0),
    images: z.array(z.string().url()).min(1).optional(),
    brand: z.string().optional(),
    specifications: z.record(z.string()).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    productId: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(3).max(200).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    category: z.string().min(1).optional(),
    stock: z.number().int().min(0).optional(),
    images: z.array(z.string().url()).min(1).optional(),
    brand: z.string().optional(),
    specifications: z.record(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const deleteProductSchema = z.object({
  params: z.object({
    productId: z.string().min(1),
  }),
});

export const getProductsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    q: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

// ============================================
// Order Management DTOs
// ============================================

export const updateOrderStatusSchema = z.object({
  params: z.object({
    orderId: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  }),
});

export const getOrdersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    userId: z.string().optional(),
  }),
});

// ============================================
// Review Management DTOs
// ============================================

export const getReviewsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    productId: z.string().optional(),
    rating: z.coerce.number().min(1).max(5).optional(),
    q: z.string().optional(), // Search by content
  }),
});

export const deleteReviewSchema = z.object({
  params: z.object({
    productId: z.string().min(1),
    reviewId: z.string().min(1),
  }),
});

// ============================================
// Statistics DTOs
// ============================================

export const getStatsQuerySchema = z.object({
  query: z.object({
    period: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
  }),
});

// Type exports
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>['query'];
export type UpdateUserRoleBody = z.infer<typeof updateUserRoleSchema>['body'];
export type CreateProductBody = z.infer<typeof createProductSchema>['body'];
export type UpdateProductBody = z.infer<typeof updateProductSchema>['body'];
export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>['query'];
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusSchema>['body'];
export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>['query'];
export type GetStatsQuery = z.infer<typeof getStatsQuerySchema>['query'];
export type GetReviewsQuery = z.infer<typeof getReviewsQuerySchema>['query'];
