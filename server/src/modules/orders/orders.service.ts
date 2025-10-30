import { Types } from 'mongoose';
import { Order, IOrder } from '../../models/Order.js';
import { Cart } from '../../models/Cart.js';
import { Product } from '../../models/Product.js';
import { AppError } from '../../middlewares/error.js';
import { CreateOrderDto, UpdateOrderStatusDto } from './orders.dto.js';

export class OrdersService {
  /**
   * Create order from cart
   */
  async createOrder(userId: string, data: CreateOrderDto): Promise<IOrder> {
    const { shippingAddress, paymentMethod, note } = data;

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    // Validate stock for all items
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new AppError(`Product ${item.product} not found`, 404);
      }

      if (product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}. Only ${product.stock} available`,
          400
        );
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippingFee = 30000; // Fixed shipping fee: 30,000 VND
    const tax = subtotal * 0.1; // 10% tax
    const totalAmount = subtotal + shippingFee + tax;

    // Create order
    const order = new Order({
      user: userId,
      orderNumber: this.generateOrderNumber(),
      items: cart.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal,
      shippingFee,
      tax,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      status: 'pending',
      note,
    });

    await order.save();

    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear cart
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    return order.populate([
      { path: 'user', select: 'name email' },
      { path: 'items.product', select: 'name price images' },
    ]);
  }

  /**
   * Get all orders (with filters)
   */
  async getOrders(
    userId?: string,
    status?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ orders: IOrder[]; total: number; page: number; pages: number }> {
    const query: any = {};

    if (userId) {
      query.user = userId;
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .populate('items.product', 'name price images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string, userId?: string): Promise<IOrder> {
    const query: any = { _id: orderId };

    if (userId) {
      query.user = userId;
    }

    const order = await Order.findOne(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price images');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    data: UpdateOrderStatusDto
  ): Promise<IOrder> {
    const { status } = data;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Validate status transition
    if (order.status === 'delivered' || order.status === 'cancelled') {
      throw new AppError(
        `Cannot update order with status ${order.status}`,
        400
      );
    }

    order.status = status;

    // Update payment status if delivered
    if (status === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'completed';
      order.paidAt = new Date();
    }

    await order.save();

    return order.populate([
      { path: 'user', select: 'name email' },
      { path: 'items.product', select: 'name price images' },
    ]);
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, userId: string): Promise<IOrder> {
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (
      order.status === 'shipped' ||
      order.status === 'delivered' ||
      order.status === 'cancelled'
    ) {
      throw new AppError(`Cannot cancel order with status ${order.status}`, 400);
    }

    order.status = 'cancelled';
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    return order.populate([
      { path: 'user', select: 'name email' },
      { path: 'items.product', select: 'name price images' },
    ]);
  }

  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }
}

export default new OrdersService();
