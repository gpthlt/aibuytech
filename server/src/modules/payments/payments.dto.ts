import { z } from 'zod';

// Schema for creating payment intent
export const createPaymentIntentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    paymentMethod: z.enum(['credit_card', 'momo', 'vnpay'], {
      errorMap: () => ({
        message: 'Payment method must be credit_card, momo, or vnpay',
      }),
    }),
  }),
});

// Schema for webhook (mock)
export const webhookSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    status: z.enum(['success', 'failed']),
    transactionId: z.string().optional(),
  }),
});

export type CreatePaymentIntentDto = z.infer<
  typeof createPaymentIntentSchema
>['body'];
export type WebhookDto = z.infer<typeof webhookSchema>['body'];
