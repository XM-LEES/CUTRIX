import { create } from 'zustand';
import { productionPlanService, workerService, logService } from '../services';
import type { ProductionPlan, AppState, CreateProductionLogRequest, WorkerTaskGroup } from '../types';
import { useAuthStore } from './authStore'; 

interface TaskState extends AppState {
  taskGroups: WorkerTaskGroup[];
  currentPlan: ProductionPlan | null;
  fetchWorkerTaskGroups: (workerId: number) => Promise<void>;
  fetchPlanForTask: (planId: number) => Promise<void>;
  submitLog: (log: CreateProductionLogRequest) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  taskGroups: [],
  currentPlan: null,
  loading: false,
  error: null,

  fetchWorkerTaskGroups: async (workerId) => {
    set({ loading: true, error: null });
    try {
      const groups = await workerService.getWorkerTaskGroups(workerId);
      set({ taskGroups: groups || [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchPlanForTask: async (planId) => {
    set({ loading: true, error: null, currentPlan: null });
    try {
      const plan = await productionPlanService.getPlan(planId);
      set({ currentPlan: plan, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  submitLog: async (log) => {
    try {
      await logService.createLog(log);
      
      const currentPlanId = get().currentPlan?.plan_id;
      if (currentPlanId) {
        // 1. 静默刷新当前计划详情页的数据
        const plan = await productionPlanService.getPlan(currentPlanId);
        set({ currentPlan: plan });
      }

      // 2. 新增：刷新工人仪表盘的任务组数据
      const workerId = useAuthStore.getState().user?.worker_id;
      if (workerId) {
        await get().fetchWorkerTaskGroups(workerId);
      }

    } catch (error) {
       const errorMessage = (error as Error).message;
       throw new Error(errorMessage);
    }
  }
}));