import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import './ManageReviews.css';

interface Review {
  _id: string;
  productId: string;
  productName: string;
  rating: number;
  content: string;
  isAnonymous: boolean;
  user: {
    _id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const ManageReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [filters, setFilters] = useState({
    productId: '',
    rating: '',
    q: '',
  });

  useEffect(() => {
    fetchReviews();
  }, [pagination.page, filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.productId) params.productId = filters.productId;
      if (filters.rating) params.rating = filters.rating;
      if (filters.q) params.q = filters.q;

      const response = await api.get('/api/v1/admin/reviews', { params });

      if (response.data.success) {
        setReviews(response.data.data.items);
        setPagination(response.data.data.pagination);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string, reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/v1/admin/reviews/${productId}/${reviewId}`);
      if (response.data.success) {
        toast.success('Review deleted successfully');
        fetchReviews();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete review');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#ffa500' : '#ddd' }}>
        ★
      </span>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="manage-reviews">
      <div className="page-header">
        <h1>Manage Reviews</h1>
        <p>View and moderate customer reviews</p>
      </div>

      <div className="filters-section">
        <input
          type="text"
          placeholder="Search by content..."
          value={filters.q}
          onChange={(e) => handleFilterChange('q', e.target.value)}
          className="search-input"
        />

        <select
          value={filters.rating}
          onChange={(e) => handleFilterChange('rating', e.target.value)}
          className="filter-select"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {loading && reviews.length === 0 ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <>
          <div className="reviews-table-container">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Reviewer</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="no-data">
                      No reviews found
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review._id}>
                      <td>
                        <div className="product-name">{review.productName}</div>
                      </td>
                      <td>
                        <div className="rating-stars">{renderStars(review.rating)}</div>
                      </td>
                      <td>
                        <div className="review-content">{review.content}</div>
                      </td>
                      <td>
                        {review.isAnonymous ? (
                          <span className="anonymous-badge">Anonymous</span>
                        ) : (
                          <div className="user-info">
                            <div className="user-name">{review.user?.fullName || 'N/A'}</div>
                            <div className="user-email">{review.user?.email || 'N/A'}</div>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="date-info">{formatDate(review.createdAt)}</div>
                      </td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(review.productId, review._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={!pagination.hasPrev}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={!pagination.hasNext}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageReviews;
