import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';

export interface Review {
  _id: string;
  user: {
    _id?: string;
    fullName: string;
    email?: string;
  };
  rating: number;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface ReviewsState {
  reviews: Review[];
  stats: ReviewStats;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  hasPurchased: boolean;

  // Actions
  fetchReviews: (productId: string, page?: number, limit?: number) => Promise<void>;
  createReview: (
    productId: string,
    data: { rating: number; content: string; isAnonymous?: boolean }
  ) => Promise<void>;
  updateReview: (
    productId: string,
    reviewId: string,
    data: { rating?: number; content?: string; isAnonymous?: boolean }
  ) => Promise<void>;
  deleteReview: (productId: string, reviewId: string) => Promise<void>;
  fetchReviewStats: (productId: string) => Promise<void>;
  checkPurchaseStatus: (productId: string) => Promise<void>;
  reset: () => void;
}

const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviews: [],
  stats: {
    averageRating: 0,
    totalReviews: 0,
  },
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  hasMore: false,
  hasPurchased: false,

  fetchReviews: async (productId: string, page = 1, limit = 10) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/api/v1/products/${productId}/reviews`, {
        params: { page, limit, sort: '-createdAt' },
      });

      if (response.data.success) {
        // Try different possible structures
        let items = response.data.data?.items || response.data.data?.data || [];
        let pagination = response.data.data?.pagination || response.data.data;

        set({
          reviews: items,
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          hasMore: pagination.hasNext,
          loading: false,
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to load reviews';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  createReview: async (
    productId: string,
    data: { rating: number; content: string; isAnonymous?: boolean }
  ) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post(`/api/v1/products/${productId}/reviews`, data);

      if (response.data.success) {
        toast.success('Review posted successfully!');
        // Refresh reviews list
        await get().fetchReviews(productId);
        await get().fetchReviewStats(productId);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to create review';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  updateReview: async (
    productId: string,
    reviewId: string,
    data: { rating?: number; content?: string; isAnonymous?: boolean }
  ) => {
    try {
      set({ loading: true, error: null });
      const response = await api.put(`/api/v1/products/${productId}/reviews/${reviewId}`, data);

      if (response.data.success) {
        toast.success('Review updated successfully!');
        // Refresh reviews list
        await get().fetchReviews(productId);
        await get().fetchReviewStats(productId);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to update review';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  deleteReview: async (productId: string, reviewId: string) => {
    try {
      set({ loading: true, error: null });
      const response = await api.delete(`/api/v1/products/${productId}/reviews/${reviewId}`);

      if (response.data.success) {
        toast.success('Review deleted successfully!');
        // Refresh reviews list
        await get().fetchReviews(productId);
        await get().fetchReviewStats(productId);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to delete review';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  fetchReviewStats: async (productId: string) => {
    try {
      const response = await api.get(`/api/v1/products/${productId}`);
      if (response.data.success) {
        const product = response.data.data;
        set({
          stats: {
            averageRating: product.averageRating || 0,
            totalReviews: product.totalReviews || 0,
          },
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch review stats:', error);
    }
  },

  checkPurchaseStatus: async (productId: string) => {
    try {
      const response = await api.get('/api/v1/orders');
      
      if (response.data.success) {
        let orders = response.data.data;
        
        // Handle different API response structures
        if (response.data.data?.items && Array.isArray(response.data.data.items)) {
          orders = response.data.data.items;
        } else if (Array.isArray(response.data.data)) {
          orders = response.data.data;
        } else if (response.data.data?.orders && Array.isArray(response.data.data.orders)) {
          orders = response.data.data.orders;
        }
        
        if (!Array.isArray(orders)) {
          set({ hasPurchased: false });
          return;
        }
        
        const hasPurchased = orders.some(
          (order: any) =>
            order.status === 'delivered' &&
            order.items?.some((item: any) => {
              const itemProductId = item.product?._id || item.product;
              return itemProductId === productId;
            })
        );
        
        set({ hasPurchased });
      }
    } catch (error: any) {
      set({ hasPurchased: false });
    }
  },

  reset: () => {
    set({
      reviews: [],
      stats: { averageRating: 0, totalReviews: 0 },
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
      hasPurchased: false,
    });
  },
}));

export default useReviewsStore;
