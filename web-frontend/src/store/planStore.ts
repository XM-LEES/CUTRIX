import { create } from 'zustand';
import type { PlanState, ProductionPlan } from '../types';
import { CreateProductionPlanRequest } from '../types';
import { productionPlanService } from '../services';

type PlanActions = {
  fetchPlans: (query?: string) => Promise<void>;
  fetchPlan: (id: number) => Promise<void>;
  createPlan: (data: CreateProductionPlanRequest) => Promise<void>;
  updatePlan: (id: number, data: CreateProductionPlanRequest) => Promise<void>; // <-- 新增
  fetchPlanByOrderId: (orderId: number) => Promise<ProductionPlan | null>;
  deletePlan: (id: number) => Promise<void>;
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

  fetchPlans: async (query?: string) => { // <-- 修改
    set({ loading: true, error: null });
    try {
      const plans = await productionPlanService.getPlans(query); // <-- 传递查询
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

  updatePlan: async (id: number, data: CreateProductionPlanRequest) => {
    set({ loading: true, error: null });
    try {
      const updatedPlan = await productionPlanService.updatePlan(id, data);
      set((state) => ({
        plans: state.plans.map((p) => p.plan_id === id ? updatedPlan : p),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },
}));