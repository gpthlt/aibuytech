import React, { useState, useEffect } from 'react';
import useReviewsStore from '../store/useReviewsStore';
import { useAuthStore } from '../store/useAuthStore';
import './Reviews.css';

interface ReviewsProps {
  productId: string;
}

const Reviews: React.FC<ReviewsProps> = ({ productId }) => {
  const { user } = useAuthStore();
  const {
    reviews,
    stats,
    loading,
    error,
    hasMore,
    hasPurchased,
    fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    fetchReviewStats,
    checkPurchaseStatus,
  } = useReviewsStore();

  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    rating: 5,
    content: '',
    isAnonymous: false,
  });

  useEffect(() => {
    fetchReviews(productId);
    fetchReviewStats(productId);
    if (user) {
      checkPurchaseStatus(productId);
    }
  }, [productId, user, fetchReviews, fetchReviewStats, checkPurchaseStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim() || formData.content.length < 10) {
      alert('Review content must be at least 10 characters');
      return;
    }

    try {
      if (editingReview) {
        await updateReview(productId, editingReview, formData);
        setEditingReview(null);
      } else {
        await createReview(productId, formData);
      }
      setShowForm(false);
      setFormData({ rating: 5, content: '', isAnonymous: false });
    } catch (error) {
      // Error handled in store
    }
  };

  const handleEdit = (reviewId: string) => {
    const review = reviews.find((r) => r._id === reviewId);
    if (review) {
      setFormData({
        rating: review.rating,
        content: review.content,
        isAnonymous: review.isAnonymous,
      });
      setEditingReview(reviewId);
      setShowForm(true);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      await deleteReview(productId, reviewId);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReview(null);
    setFormData({ rating: 5, content: '', isAnonymous: false });
  };

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={interactive ? 'star-btn' : ''}
        style={{
          color: i < rating ? '#ffa500' : '#ddd',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={interactive ? () => setFormData({ ...formData, rating: i + 1 }) : undefined}
      >
        ★
      </span>
    ));
  };

  const getUserInitial = (name: string) => {
    return name?.charAt(0).toUpperCase() || 'U';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canWriteReview = user && !reviews?.some((r) => r.user?._id === user.id) && hasPurchased;

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h2 className="reviews-title">Customer Reviews</h2>
        <div className="rating-summary">
          <div className="rating-number">{stats.averageRating.toFixed(1)}</div>
          <div>
            <div className="rating-stars">{renderStars(Math.round(stats.averageRating))}</div>
            <div className="rating-count">Based on {stats.totalReviews} reviews</div>
          </div>
        </div>
      </div>

      {user && (
        <div className="reviews-actions">
          {!showForm && canWriteReview && (
            <button className="btn-write-review" onClick={() => setShowForm(true)}>
              Write a Review
            </button>
          )}
          
          {!showForm && !canWriteReview && user && !hasPurchased && (
            <div style={{ padding: '10px', background: '#fff3cd', borderRadius: '4px', marginTop: '10px', fontSize: '0.9rem' }}>
              {/* ⚠️ You need to purchase and receive this product to write a review */}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <h3>{editingReview ? 'Edit Your Review' : 'Write Your Review'}</h3>

          <div className="form-group">
            <label>Rating *</label>
            <div className="rating-input">{renderStars(formData.rating, true)}</div>
          </div>

          <div className="form-group">
            <label>Your Review *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Share your experience with this product (min 10 characters)"
              required
              minLength={10}
              maxLength={1000}
            />
            <small style={{ color: '#666' }}>
              {formData.content.length}/1000 characters
            </small>
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
              />
              <label htmlFor="isAnonymous">Post as anonymous</label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
            </button>
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <div className="error-message">{error}</div>}

      {loading && (!reviews || reviews.length === 0) ? (
        <div className="loading-spinner">Loading reviews...</div>
      ) : !reviews || reviews.length === 0 ? (
        <div className="empty-reviews">
          <p>No reviews yet</p>
          <p style={{ fontSize: '0.9rem', color: '#999' }}>
            Be the first to share your experience!
          </p>
        </div>
      ) : (
        <>
          <div className="reviews-list">
            {reviews.map((review) => {
              const isOwnReview = user?.id === review.user?._id;
              const isAdmin = user?.role === 'admin';

              return (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div className="review-user">
                      <div className="review-avatar">
                        {getUserInitial(review.user.fullName)}
                      </div>
                      <div className="review-user-info">
                        <h4>{review.user.fullName}</h4>
                        <div className="review-date">{formatDate(review.createdAt)}</div>
                      </div>
                    </div>
                    <div className="review-stars">{renderStars(review.rating)}</div>
                  </div>

                  <div className="review-content">{review.content}</div>

                  {(isOwnReview || isAdmin) && (
                    <div className="review-actions">
                      {isOwnReview && (
                        <button className="btn-edit" onClick={() => handleEdit(review._id)}>
                          Edit
                        </button>
                      )}
                      <button className="btn-delete" onClick={() => handleDelete(review._id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="pagination-controls">
              <button
                className="btn-load-more"
                onClick={() => fetchReviews(productId, 1, reviews.length + 10)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Reviews'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reviews;
