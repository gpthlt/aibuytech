import { Response } from 'express';
import paymentsService from './payments.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { CreatePaymentIntentDto, WebhookDto } from './payments.dto';
import { AuthRequest } from '../../middlewares/auth';

export class PaymentsController {
  /**
   * Create payment intent
   */
  async createPaymentIntent(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
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
  async handleWebhook(req: AuthRequest, res: Response): Promise<void> {
    const data: WebhookDto = req.body;

    const result = await paymentsService.handleWebhook(data);

    res.json(
      ApiResponse.success(result, 'Webhook processed successfully')
    );
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { orderId } = req.params;

    const status = await paymentsService.getPaymentStatus(orderId, userId);

    res.json(
      ApiResponse.success(status, 'Payment status retrieved successfully')
    );
  }

  /**
   * Simulate payment success (for testing)
   */
  async simulatePaymentSuccess(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
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
