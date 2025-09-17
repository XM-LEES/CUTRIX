import { create } from 'zustand';
import { productionPlanService, workerService, logService } from '../services'; // 引入 logService
import type { ProductionPlan, AppState, CreateProductionLogRequest, WorkerTaskGroup } from '../types';

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
    // 提交日志时不应全局 loading，而是局部 loading
    try {
      await logService.createLog(log);
      
      // 成功后，刷新当前计划的数据
      const currentPlanId = get().currentPlan?.plan_id;
      if (currentPlanId) {
        // 静默刷新，不设置全局 loading
        const plan = await productionPlanService.getPlan(currentPlanId);
        set({ currentPlan: plan });
      }
    } catch (error) {
       const errorMessage = (error as Error).message;
       // 这里不设置全局 error，让组件自己处理
       throw new Error(errorMessage);
    }
  }
}));