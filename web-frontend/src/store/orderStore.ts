import { create } from 'zustand';
import { productionOrderService } from '../services';
import type { OrderState, CreateProductionOrderRequest } from '../types';

type OrderActions = {
  fetchOrders: (query?: string) => Promise<void>;
  fetchUnplannedOrders: () => Promise<void>;
  fetchOrder: (id: number) => Promise<void>;
  createOrder: (data: CreateProductionOrderRequest) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  clearCurrentOrder: () => void;
};

export const useOrderStore = create<OrderState & OrderActions>((set) => ({
  orders: [],
  unplannedOrders: [],
  currentOrder: null,
  loading: false,
  error: null,

  clearCurrentOrder: () => set({ currentOrder: null }),

  fetchUnplannedOrders: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await productionOrderService.getUnplannedOrders();
      set({ unplannedOrders: orders || [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchOrders: async (query?: string) => {
    set({ loading: true, error: null });
    try {
      const orders = await productionOrderService.getOrders(query);
      set({ orders: orders || [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  fetchOrder: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const order = await productionOrderService.getOrder(id);
      set({ currentOrder: order, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  createOrder: async (data: CreateProductionOrderRequest) => {
    set({ loading: true, error: null });
    try {
      const newOrder = await productionOrderService.createOrder(data);
      set((state) => ({
        orders: [...state.orders, newOrder],
        loading: false,
      }));
    } catch (error) {
        const errorMessage = (error as Error).message;
        set({ error: errorMessage, loading: false });
        throw new Error(errorMessage);
    }
  },
  deleteOrder: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await productionOrderService.deleteOrder(id);
      set((state) => ({
        orders: state.orders.filter((order) => order.order_id !== id),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },
}));