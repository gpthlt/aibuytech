import { Types } from 'mongoose';
import { Cart, ICart } from '../../models/Cart.js';
import { Product } from '../../models/Product.js';
import { AppError } from '../../middlewares/error.js';
import { AddToCartDto, UpdateCartItemDto } from './cart.dto.js';

export class CartService {
  /**
   * Get user's cart
   */
  async getCart(userId: string): Promise<ICart | null> {
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name price imageUrl images stock',
    });

    return cart;
  }

  /**
   * Add item to cart
   */
  async addToCart(userId: string, data: AddToCartDto): Promise<ICart> {
    const { productId, quantity } = data;

    // Validate product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.stock < quantity) {
      throw new AppError(
        `Only ${product.stock} items available in stock`,
        400
      );
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
      });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      if (product.stock < newQuantity) {
        throw new AppError(
          `Only ${product.stock} items available in stock`,
          400
        );
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price;
    } else {
      // Add new item
      cart.items.push({
        product: new Types.ObjectId(productId),
        quantity,
        price: product.price,
      });
    }

    await cart.save();

    return cart.populate({
      path: 'items.product',
      select: 'name price imageUrl images stock',
    });
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    userId: string,
    data: UpdateCartItemDto
  ): Promise<ICart> {
    const { productId, quantity } = data;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      throw new AppError('Product not in cart', 404);
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Validate stock
      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (product.stock < quantity) {
        throw new AppError(
          `Only ${product.stock} items available in stock`,
          400
        );
      }

      // Update quantity and price
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = product.price;
    }

    await cart.save();

    return cart.populate({
      path: 'items.product',
      select: 'name price imageUrl images stock',
    });
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, productId: string): Promise<ICart> {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();

    return cart.populate({
      path: 'items.product',
      select: 'name price imageUrl images stock',
    });
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string): Promise<void> {
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [] }
    );
  }
}

export default new CartService();
