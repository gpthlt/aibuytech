import { z } from 'zod';

// Schema for creating order
export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      zipCode: z.string().min(1, 'Zip code is required'),
      country: z.string().min(1, 'Country is required'),
    }),
    paymentMethod: z.enum(['cod', 'credit_card', 'momo', 'vnpay'], {
      errorMap: () => ({
        message: 'Payment method must be cod, credit_card, momo, or vnpay',
      }),
    }),
    note: z.string().optional(),
  }),
});

// Schema for updating order status
export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(
      ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      {
        errorMap: () => ({
          message:
            'Status must be pending, processing, shipped, delivered, or cancelled',
        }),
      }
    ),
  }),
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
});

// Schema for getting order by ID
export const getOrderByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusDto = z.infer<
  typeof updateOrderStatusSchema
>['body'];
