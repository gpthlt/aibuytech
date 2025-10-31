import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import cartService from './cart.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { AddToCartDto, UpdateCartItemDto } from './cart.dto';

export class CartController {
  /**
   * Get user's cart
   */
  async getCart(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const cart = await cartService.getCart(userId);

    ApiResponse.success(res, cart || { items: [], totalAmount: 0 });
  }

  /**
   * Add item to cart
   */
  async addToCart(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const data: AddToCartDto = req.body;

    const cart = await cartService.addToCart(userId, data);

    ApiResponse.created(res, cart);
  }

  /**
   * Update cart item
   */
  async updateCartItem(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const data: UpdateCartItemDto = req.body;

    const cart = await cartService.updateCartItem(userId, data);

    ApiResponse.success(res, cart);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { productId } = req.params;

    const cart = await cartService.removeFromCart(userId, productId);

    ApiResponse.success(res, cart);
  }

  /**
   * Clear cart
   */
  async clearCart(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;

    await cartService.clearCart(userId);

    ApiResponse.success(res, { message: 'Cart cleared successfully' });
  }
}

export default new CartController();
