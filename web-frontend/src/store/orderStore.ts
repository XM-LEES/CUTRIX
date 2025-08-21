import { create } from 'zustand';
import { OrderState, ProductionOrder, CreateProductionOrderRequest } from '../types';
import { productionOrderService } from '../services';

type OrderActions = {
  fetchOrders: () => Promise<void>;
  fetchOrder: (id: number) => Promise<void>;
  createOrder: (data: CreateProductionOrderRequest) => Promise<void>;
};

export const useOrderStore = create<OrderState & OrderActions>((set) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await productionOrderService.getOrders();
      set({ orders, loading: false });
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
}));