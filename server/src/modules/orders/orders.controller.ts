import { Response } from 'express';
import ordersService from './orders.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { CreateOrderDto, UpdateOrderStatusDto } from './orders.dto';
import { AuthRequest } from '../../middlewares/auth';

export class OrdersController {
  /**
   * Create order from cart
   */
  async createOrder(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const data: CreateOrderDto = req.body;

    const order = await ordersService.createOrder(userId, data);

    ApiResponse.created(res, order);
  }

  /**
   * Get all orders
   */
  async getOrders(req: AuthRequest, res: Response): Promise<void> {
    const { status, page = '1', limit = '10' } = req.query;
    const userId = req.user!.role === 'admin' ? undefined : req.user!.userId;

    const result = await ordersService.getOrders(
      userId,
      status as string,
      parseInt(page as string),
      parseInt(limit as string)
    );

    ApiResponse.success(res, result);
  }

  /**
   * Get order by ID
   */
  async getOrderById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user!.role === 'admin' ? undefined : req.user!.userId;

    const order = await ordersService.getOrderById(id, userId);

    ApiResponse.success(res, order);
  }

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const data: UpdateOrderStatusDto = req.body;

    const order = await ordersService.updateOrderStatus(id, data);

    ApiResponse.success(res, order);
  }

  /**
   * Cancel order
   */
  async cancelOrder(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user!.userId;

    const order = await ordersService.cancelOrder(id, userId);

    ApiResponse.success(res, order);
  }
}

export default new OrdersController();
