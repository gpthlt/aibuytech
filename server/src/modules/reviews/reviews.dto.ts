import { z } from 'zod';

/**
 * Schema validation cho tạo review
 */
export const createReviewSchema = z.object({
  params: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
  body: z.object({
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    content: z
      .string()
      .min(10, 'Review content must be at least 10 characters')
      .max(1000, 'Review content must be at most 1000 characters')
      .trim(),
    isAnonymous: z.boolean().optional().default(false),
  }),
});

/**
 * Schema validation cho update review
 */
export const updateReviewSchema = z.object({
  params: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
    reviewId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID'),
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    content: z.string().min(10).max(1000).trim().optional(),
    isAnonymous: z.boolean().optional(),
  }),
});

/**
 * Schema validation cho lấy danh sách reviews
 */
export const getReviewsSchema = z.object({
  params: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.enum(['createdAt', '-createdAt', 'rating', '-rating']).optional(),
  }),
});

/**
 * Schema validation cho delete review
 */
export const deleteReviewSchema = z.object({
  params: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
    reviewId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID'),
  }),
});

// TypeScript types
export type CreateReviewDto = z.infer<typeof createReviewSchema>['body'];
export type UpdateReviewDto = z.infer<typeof updateReviewSchema>['body'];
export type GetReviewsQuery = z.infer<typeof getReviewsSchema>['query'];
