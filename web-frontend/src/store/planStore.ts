import { create } from 'zustand';
import type { PlanState, ProductionPlan } from '../types';
import { CreateProductionPlanRequest } from '../types';
import { productionPlanService } from '../services';

type PlanActions = {
  fetchPlans: () => Promise<void>;
  fetchPlan: (id: number) => Promise<void>;
  createPlan: (data: CreateProductionPlanRequest) => Promise<void>;
  fetchPlanByOrderId: (orderId: number) => Promise<ProductionPlan | null>;
  deletePlan: (id: number) => Promise<void>; // <-- 新增
};

export const usePlanStore = create<PlanState & PlanActions>((set) => ({
  plans: [],
  currentPlan: null,
  loading: false,
  error: null,

  deletePlan: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await productionPlanService.deletePlan(id);
      set((state) => ({
        plans: state.plans.filter((plan) => plan.plan_id !== id),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  // ... (其他 action 不变)
  fetchPlanByOrderId: async (orderId: number) => {
    set({ loading: true, error: null });
    try {
      const plan = await productionPlanService.getPlanByOrderId(orderId);
      set({ loading: false });
      return plan;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return null;
    }
  },

  fetchPlans: async () => {
    set({ loading: true, error: null });
    try {
      const plans = await productionPlanService.getPlans();
      set({ plans: plans || [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchPlan: async (id: number) => {
      set({ loading: true, error: null });
      try {
        const plan = await productionPlanService.getPlan(id);
        set({ currentPlan: plan, loading: false });
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
  },

  createPlan: async (data: CreateProductionPlanRequest) => {
    set({ loading: true, error: null });
    try {
      const newPlan = await productionPlanService.createPlan(data);
      set((state) => ({
        plans: [...state.plans, newPlan],
        loading: false,
      }));
    } catch (error) {
        const errorMessage = (error as Error).message;
        set({ error: errorMessage, loading: false });
        throw new Error(errorMessage);
    }
  },
}));