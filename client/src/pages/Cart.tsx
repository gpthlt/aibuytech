import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Cart.css';

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl?: string;
    images?: string[];
    stock: number;
  };
  quantity: number;
  price: number;
}

interface Cart {
  items: CartItem[];
}

function Cart() {
  const navigate = useNavigate();
  const { fetchCart } = useCartStore();
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [loading, setLoading] = useState(true);

  // Get product image URL
  const getProductImage = (product: CartItem['product']) => {
    if (product.images && product.images.length > 0) {
      return `http://api.aibuytech.store${product.images[0]}`;
    }
    if (product.imageUrl) {
      return `http://api.aibuytech.store${product.imageUrl}`;
    }
    return '/placeholder.png';
  };

  // Calculate total amount from items
  const calculateTotal = (items: CartItem[]) => {
    return items.reduce((total, item) => {
      if (!item.product) return total;
      return total + (item.price * item.quantity);
    }, 0);
  };

  const totalAmount = calculateTotal(cart.items);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const { data } = await api.get('/api/v1/cart');
      setCart(data.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Load cart error:', error);
      toast.error(error.response?.data?.message || 'Failed to load cart');
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      const { data } = await api.put('/api/v1/cart', { productId, quantity });
      setCart(data.data);
      fetchCart();
      toast.success('Cart updated');
    } catch (error: any) {
      console.error('Update cart error:', error);
      toast.error(error.response?.data?.message || 'Failed to update cart');
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const { data } = await api.delete(`/api/v1/cart/${productId}`);
      setCart(data.data);
      fetchCart();
      toast.success('Item removed from cart');
    } catch (error: any) {
      console.error('Remove item error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;

    try {
      await api.delete('/api/v1/cart/clear/all');
      setCart({ items: [] });
      fetchCart();
      toast.success('Cart cleared');
    } catch (error: any) {
      console.error('Clear cart error:', error);
      toast.error(error.response?.data?.message || 'Failed to clear cart');
    }
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading cart...</div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Shopping Cart</h2>
            <p>Your cart is empty</p>
            <button onClick={() => navigate('/')} className="btn-shop-now">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1 className="cart-title">Shopping Cart</h1>
          <button onClick={clearCart} className="clear-cart-btn">Clear Cart</button>
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {cart.items.map((item) => {
              // Skip items with null/undefined product (deleted products)
              if (!item.product) {
                return null;
              }
              
              return (
              <div key={item.product._id} className="cart-item">
                <img 
                  src={getProductImage(item.product)} 
                  alt={item.product.name} 
                  className="cart-item-image" 
                />
                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.product.name}</h3>
                  <p className="cart-item-price">{item.price.toLocaleString('vi-VN')} ₫</p>
                  <div className="cart-item-controls">
                    <div className="quantity-control">
                      <button 
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)} 
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)} 
                        disabled={item.quantity >= item.product.stock}
                      >
                        +
                      </button>
                    </div>
                    <span className="stock-info">Stock: {item.product.stock}</span>
                    <button 
                      onClick={() => removeItem(item.product._id)} 
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="cart-item-total">
                  <span className="cart-item-total-label">Total</span>
                  <p className="cart-item-total-price">
                    {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              </div>
              );
            })}
          </div>

          <div className="order-summary">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-row">
              <span className="label">Subtotal ({cart.items.length} items)</span>
              <span className="value">{totalAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="summary-row">
              <span className="label">Shipping</span>
              <span className="value">30,000 ₫</span>
            </div>
            <div className="summary-row">
              <span className="label">Tax (10%)</span>
              <span className="value">{(totalAmount * 0.1).toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="summary-row total">
              <span className="label">Total</span>
              <span className="value">
                {(totalAmount + 30000 + totalAmount * 0.1).toLocaleString('vi-VN')} ₫
              </span>
            </div>
            <div className="summary-actions">
              <button onClick={handleCheckout} className="btn-checkout">
                Proceed to Checkout
              </button>
              <button onClick={() => navigate('/')} className="btn-continue">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;

