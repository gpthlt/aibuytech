import { create } from 'zustand';
import api from '../lib/api';

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  fetchCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  itemCount: 0,
  addItem: (item) =>
    set((state) => {
      const existingItem = state.items.find((i) => i.product.id === item.product.id);
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.product.id === item.product.id ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
          itemCount: state.itemCount + item.quantity,
        };
      }
      return {
        items: [...state.items, item],
        itemCount: state.itemCount + item.quantity,
      };
    }),
  removeItem: (productId) =>
    set((state) => {
      const item = state.items.find((i) => i.product.id === productId);
      return {
        items: state.items.filter((i) => i.product.id !== productId),
        itemCount: state.itemCount - (item?.quantity || 0),
      };
    }),
  updateQuantity: (productId, quantity) =>
    set((state) => {
      const item = state.items.find((i) => i.product.id === productId);
      const diff = quantity - (item?.quantity || 0);
      return {
        items: state.items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
        itemCount: state.itemCount + diff,
      };
    }),
  clearCart: () => set({ items: [], itemCount: 0 }),
  getTotalAmount: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  },
  fetchCart: async () => {
    try {
      const { data } = await api.get('/api/v1/cart');
      const cart = data.data;
      if (cart && cart.items) {
        const itemCount = cart.items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        );
        set({ itemCount });
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  },
}));
