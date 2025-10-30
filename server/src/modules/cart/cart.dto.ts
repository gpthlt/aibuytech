import { z } from 'zod';

// Schema for adding item to cart
export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  }),
});

// Schema for updating cart item
export const updateCartItemSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().min(0, 'Quantity must be at least 0'),
  }),
});

// Schema for removing item from cart
export const removeFromCartSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
});

export type AddToCartDto = z.infer<typeof addToCartSchema>['body'];
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>['body'];
