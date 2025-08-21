import { create } from 'zustand';
import { PlanState, ProductionPlan, CreateProductionPlanRequest } from '../types';
import { productionPlanService } from '../services';

type PlanActions = {
  fetchPlans: () => Promise<void>;
  fetchPlan: (id: number) => Promise<void>;
  createPlan: (data: CreateProductionPlanRequest) => Promise<void>;
};

export const usePlanStore = create<PlanState & PlanActions>((set) => ({
  plans: [],
  currentPlan: null,
  loading: false,
  error: null,

  fetchPlans: async () => {
    set({ loading: true, error: null });
    try {
      const plans = await productionPlanService.getPlans();
      set({ plans, loading: false });
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