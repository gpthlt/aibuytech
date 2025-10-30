import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';
import './Dashboard.css';

interface DashboardStats {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  orders: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  lowStockProducts: Array<{
    _id: string;
    name: string;
    stock: number;
  }>;
  recentOrders: Array<any>;
  period: string;
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/v1/admin/dashboard/stats?period=${period}`);
      setStats(data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!stats) return <div>No data available</div>;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value as any)}>
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-value">{stats.overview.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Products</h3>
            <p className="stat-value">{stats.overview.totalProducts}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🛍️</div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-value">{stats.overview.totalOrders}</p>
          </div>
        </div>

        <div className="stat-card highlight">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">{formatCurrency(stats.overview.totalRevenue)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Avg Order Value</h3>
            <p className="stat-value">{formatCurrency(stats.overview.averageOrderValue)}</p>
          </div>
        </div>
      </div>

      {/* Order Status */}
      <div className="dashboard-section">
        <h2>Order Status</h2>
        <div className="order-status-grid">
          <div className="status-card pending">
            <h4>Pending</h4>
            <p className="status-value">{stats.orders.pending}</p>
          </div>
          <div className="status-card processing">
            <h4>Processing</h4>
            <p className="status-value">{stats.orders.processing}</p>
          </div>
          <div className="status-card shipped">
            <h4>Shipped</h4>
            <p className="status-value">{stats.orders.shipped}</p>
          </div>
          <div className="status-card delivered">
            <h4>Delivered</h4>
            <p className="status-value">{stats.orders.delivered}</p>
          </div>
          <div className="status-card cancelled">
            <h4>Cancelled</h4>
            <p className="status-value">{stats.orders.cancelled}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        {/* Low Stock Products */}
        <div className="dashboard-section">
          <h2>Low Stock Alert</h2>
          {stats.lowStockProducts.length === 0 ? (
            <p className="no-data">All products have sufficient stock</p>
          ) : (
            <div className="low-stock-list">
              {stats.lowStockProducts.map((product) => (
                <div key={product._id} className="low-stock-item">
                  <span className="product-name">{product.name}</span>
                  <span className={`stock-badge ${product.stock <= 5 ? 'critical' : 'warning'}`}>
                    {product.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="dashboard-section">
          <h2>Recent Orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="no-data">No recent orders</p>
          ) : (
            <div className="recent-orders-list">
              {stats.recentOrders.map((order) => (
                <div key={order._id} className="recent-order-item">
                  <div className="order-info">
                    <strong>{order.orderNumber}</strong>
                    <span className="order-customer">{order.user?.name || 'Guest'}</span>
                  </div>
                  <div className="order-meta">
                    <span className={`status-badge ${order.status}`}>{order.status}</span>
                    <span className="order-amount">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/admin/orders" className="action-btn">
            <span className="action-icon">📋</span>
            Manage Orders
          </Link>
          <Link to="/admin/products" className="action-btn">
            <span className="action-icon">🏷️</span>
            Manage Products
          </Link>
          <Link to="/admin/users" className="action-btn">
            <span className="action-icon">👤</span>
            Manage Users
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
