import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Orders.css';

interface Order {
  _id: string;
  orderNumber: string;
  items: Array<{
    product: {
      name: string;
      imageUrl?: string;
    };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/api/v1/orders');
      setOrders(data.data.orders);
      setLoading(false);
    } catch (error: any) {
      console.error('Load orders error:', error);
      toast.error(error.response?.data?.message || 'Failed to load orders');
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      await api.post(`/api/v1/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully');
      loadOrders();
    } catch (error: any) {
      console.error('Cancel order error:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading orders...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className="empty-orders">
            <div className="empty-icon">📦</div>
            <h2>My Orders</h2>
            <p>You haven&apos;t placed any orders yet</p>
            <button onClick={() => navigate('/')} className="btn-start-shopping">
              🛍️ Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h1 className="orders-title">My Orders</h1>
          <p className="orders-subtitle">Track and manage your orders</p>
        </div>

        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              {/* Order Header */}
              <div className="order-header">
                <div className="order-info">
                  <h3 className="order-number">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="order-badges">
                  <span className={`status-badge status-${order.status}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <span className={`status-badge payment-${order.paymentStatus}`}>
                    {order.paymentStatus.toUpperCase()}
                  </span>
                  <span className="payment-method">
                    {order.paymentMethod.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <img
                      src={item.product.imageUrl || '/placeholder.png'}
                      alt={item.product.name}
                      className="order-item-image"
                    />
                    <div className="order-item-details">
                      <p className="order-item-name">{item.product.name}</p>
                      <p className="order-item-quantity">
                        Qty: {item.quantity} × {item.price.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                    <div className="order-item-price">
                      {(item.quantity * item.price).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="order-footer">
                <div className="order-total">
                  <span className="total-label">Total Amount</span>
                  <span className="total-amount">
                    {order.totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="order-actions">
                  {(order.status === 'pending' || order.status === 'processing') && (
                    <button
                      onClick={() => cancelOrder(order._id)}
                      className="btn-cancel"
                    >
                      Cancel Order
                    </button>
                  )}
                  {order.paymentStatus === 'pending' && order.paymentMethod !== 'cod' && (
                    <button
                      onClick={() => navigate(`/orders/${order._id}/payment`)}
                      className="btn-view"
                    >
                      Pay Now
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="btn-view"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Orders;
