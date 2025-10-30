import { Request, Response } from 'express';
import paymentsService from './payments.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { CreatePaymentIntentDto, WebhookDto } from './payments.dto';

export class PaymentsController {
  /**
   * Create payment intent
   */
  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data: CreatePaymentIntentDto = req.body;

    const paymentIntent = await paymentsService.createPaymentIntent(
      userId,
      data
    );

    res.status(201).json(
      ApiResponse.success(paymentIntent, 'Payment intent created successfully')
    );
  }

  /**
   * Handle payment webhook
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const data: WebhookDto = req.body;

    const result = await paymentsService.handleWebhook(data);

    res.json(
      ApiResponse.success(result, 'Webhook processed successfully')
    );
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { orderId } = req.params;

    const status = await paymentsService.getPaymentStatus(orderId, userId);

    res.json(
      ApiResponse.success(status, 'Payment status retrieved successfully')
    );
  }

  /**
   * Simulate payment success (for testing)
   */
  async simulatePaymentSuccess(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { orderId } = req.params;

    const result = await paymentsService.simulatePaymentSuccess(
      orderId,
      userId
    );

    res.json(
      ApiResponse.success(result, 'Payment simulated successfully')
    );
  }
}

export default new PaymentsController();
