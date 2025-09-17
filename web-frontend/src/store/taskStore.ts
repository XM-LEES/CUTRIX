import { create } from 'zustand';
import { productionPlanService } from '../services';
import type { ProductionPlan, AppState, CreateProductionLogRequest, WorkerTaskGroup } from '../types';
import { workerService } from '../services';

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
    set({ loading: true, error: null });
    try {
      // 假设 logService 在 services/index.ts 中定义并导出
      // await logService.createLog(log);
      console.log("Submitting log:", log); // 临时替代
      
      const currentPlanId = get().currentPlan?.plan_id;
      if (currentPlanId) {
        // 成功后，刷新看板和当前计划的数据
        const workerId = log.worker_id; // 从 log 中获取 workerId
        await get().fetchWorkerTaskGroups(workerId);
        await get().fetchPlanForTask(currentPlanId);
      }
    } catch (error) {
       const errorMessage = (error as Error).message;
       set({ error: errorMessage, loading: false });
       throw new Error(errorMessage);
    }
  }
}));