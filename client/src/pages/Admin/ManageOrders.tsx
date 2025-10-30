import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Loading from '../../components/Loading';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import './ManageOrders.css';

interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
    };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: string;
  createdAt: string;
}

function ManageOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const { data } = await api.get('/api/v1/admin/orders', { params });
      setOrders(data.data.data);
      setTotalPages(data.data.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/api/v1/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated successfully');
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) return <Loading />;

  return (
    <div className="manage-orders">
      <div className="page-header">
        <h1>Manage Orders</h1>
        <Link to="/admin" className="btn-back">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Status Filter */}
      <div className="status-filter">
        <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>
          All Orders
        </button>
        <button className={statusFilter === 'pending' ? 'active' : ''} onClick={() => setStatusFilter('pending')}>
          Pending
        </button>
        <button
          className={statusFilter === 'processing' ? 'active' : ''}
          onClick={() => setStatusFilter('processing')}
        >
          Processing
        </button>
        <button className={statusFilter === 'shipped' ? 'active' : ''} onClick={() => setStatusFilter('shipped')}>
          Shipped
        </button>
        <button
          className={statusFilter === 'delivered' ? 'active' : ''}
          onClick={() => setStatusFilter('delivered')}
        >
          Delivered
        </button>
        <button
          className={statusFilter === 'cancelled' ? 'active' : ''}
          onClick={() => setStatusFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <strong>{order.orderNumber}</strong>
                  </td>
                  <td>
                    <div className="customer-info">
                      <div>{order.user?.name || 'Guest'}</div>
                      <div className="email">{order.user?.email}</div>
                    </div>
                  </td>
                  <td>{order.items.length} items</td>
                  <td className="amount">{formatCurrency(order.totalAmount)}</td>
                  <td>
                    <span className={`payment-badge ${order.paymentStatus}`}>{order.paymentStatus}</span>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className={`status-select ${order.status}`}
                      disabled={order.status === 'cancelled'}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/orders`} className="btn-view">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}

export default ManageOrders;
