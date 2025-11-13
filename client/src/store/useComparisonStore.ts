import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  description?: string;
  category?: {
    name: string;
  };
}

interface ComparisonState {
  products: Product[];
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  clearComparison: () => void;
  canAdd: () => boolean;
  isInComparison: (productId: string) => boolean;
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      products: [],
      addProduct: (product) => {
        const state = get();
        // Check if product already exists
        if (state.products.some((p) => p._id === product._id)) {
          return;
        }
        // Check if we can add more (max 4)
        if (state.products.length >= 4) {
          return;
        }
        set({ products: [...state.products, product] });
      },
      removeProduct: (productId) => {
        set((state) => ({
          products: state.products.filter((p) => p._id !== productId),
        }));
      },
      clearComparison: () => set({ products: [] }),
      canAdd: () => get().products.length < 4,
      isInComparison: (productId) => {
        return get().products.some((p) => p._id === productId);
      },
    }),
    {
      name: 'comparison-storage',
    }
  )
);

