import { Order } from '../../models/Order.js';
import { AppError } from '../../middlewares/error.js';
import { CreatePaymentIntentDto, WebhookDto } from './payments.dto.js';

export class PaymentsService {
  /**
   * Create payment intent (mock)
   */
  async createPaymentIntent(
    userId: string,
    data: CreatePaymentIntentDto
  ): Promise<any> {
    const { orderId, paymentMethod } = data;

    // Validate order exists and belongs to user
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.paymentStatus === 'completed') {
      throw new AppError('Order already paid', 400);
    }

    // Mock payment intent response
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: order._id,
      amount: order.totalAmount,
      currency: 'VND',
      paymentMethod,
      status: 'pending',
      clientSecret: `secret_${Date.now()}`,
      // Mock payment URLs
      paymentUrl:
        paymentMethod === 'momo'
          ? `https://test-payment.momo.vn/pay/${order._id}`
          : paymentMethod === 'vnpay'
          ? `https://sandbox.vnpayment.vn/pay/${order._id}`
          : null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };

    // In real implementation, would call actual payment gateway API
    // For now, just return mock data

    return paymentIntent;
  }

  /**
   * Handle payment webhook (mock)
   */
  async handleWebhook(data: WebhookDto): Promise<any> {
    const { orderId, status, transactionId } = data;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (status === 'success') {
      order.paymentStatus = 'completed';
      order.paidAt = new Date();
      order.status = 'processing';

      if (transactionId) {
        // Store transaction ID in order metadata or create a separate Payment record
        // For simplicity, we'll just acknowledge it here
      }

      await order.save();

      return {
        success: true,
        message: 'Payment confirmed',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          status: order.status,
        },
      };
    } else {
      order.paymentStatus = 'failed';
      await order.save();

      return {
        success: false,
        message: 'Payment failed',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
        },
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(orderId: string, userId: string): Promise<any> {
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      paidAt: order.paidAt,
    };
  }

  /**
   * Simulate payment success (for testing)
   */
  async simulatePaymentSuccess(orderId: string, userId: string): Promise<any> {
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.paymentStatus === 'completed') {
      throw new AppError('Order already paid', 400);
    }

    // Simulate successful payment
    order.paymentStatus = 'completed';
    order.paidAt = new Date();
    order.status = 'processing';
    await order.save();

    return {
      success: true,
      message: 'Payment simulated successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        status: order.status,
      },
    };
  }
}

export default new PaymentsService();
