import { create } from 'zustand';
import { WorkerState, Worker, UpdateWorkerRequest, CreateWorkerRequest } from '../types'; // 导入 CreateWorkerRequest
import { workerService } from '../services';

export const useWorkerStore = create<WorkerState & {
  fetchWorkers: () => Promise<void>;
  createWorker: (data: CreateWorkerRequest) => Promise<void>;
  updateWorker: (id: number, data: UpdateWorkerRequest) => Promise<void>;
  deleteWorker: (id: number) => Promise<void>;
  setCurrentWorker: (worker: Worker | null) => void;
}>((set) => ({
  workers: [],
  currentWorker: null,
  workerTasks: [],
  loading: false,
  error: null,

  fetchWorkers: async () => {
    set({ loading: true, error: null });
    try {
      const workers = await workerService.getWorkers();
      set({ workers: workers || [], loading: false }); // 处理 data 可能为 null 的情况
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createWorker: async (data) => {
    set({ loading: true, error: null });
    try {
      const newWorker = await workerService.createWorker(data);
      set((state) => ({
        workers: [...state.workers, newWorker],
        loading: false,
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      // **重新抛出错误，让组件可以捕获**
      throw new Error(errorMessage);
    }
  },

  updateWorker: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updatedWorker = await workerService.updateWorker(id, data);
      set((state) => ({
        workers: state.workers.map((worker) =>
          worker.worker_id === id ? updatedWorker : worker
        ),
        currentWorker: updatedWorker,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      // **重新抛出错误**
      throw new Error(errorMessage);
    }
  },

  deleteWorker: async (id) => {
    set({ loading: true, error: null });
    try {
      await workerService.deleteWorker(id);
      set((state) => ({
        workers: state.workers.filter((worker) => worker.worker_id !== id),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
       // **重新抛出错误**
      throw new Error(errorMessage);
    }
  },

  setCurrentWorker: (worker) => set({ currentWorker: worker }),
}));