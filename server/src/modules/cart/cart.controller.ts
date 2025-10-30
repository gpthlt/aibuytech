import { Request, Response } from 'express';
import cartService from './cart.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { AddToCartDto, UpdateCartItemDto } from './cart.dto';

export class CartController {
  /**
   * Get user's cart
   */
  async getCart(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;

    const cart = await cartService.getCart(userId);

    ApiResponse.success(res, cart || { items: [], totalAmount: 0 });
  }

  /**
   * Add item to cart
   */
  async addToCart(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data: AddToCartDto = req.body;

    const cart = await cartService.addToCart(userId, data);

    ApiResponse.created(res, cart);
  }

  /**
   * Update cart item
   */
  async updateCartItem(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data: UpdateCartItemDto = req.body;

    const cart = await cartService.updateCartItem(userId, data);

    ApiResponse.success(res, cart);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { productId } = req.params;

    const cart = await cartService.removeFromCart(userId, productId);

    ApiResponse.success(res, cart);
  }

  /**
   * Clear cart
   */
  async clearCart(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;

    await cartService.clearCart(userId);

    ApiResponse.success(res, { message: 'Cart cleared successfully' });
  }
}

export default new CartController();
