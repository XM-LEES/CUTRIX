import { create } from 'zustand';
import { WorkerState, Worker } from '../types';
import { workerService } from '../services';

export const useWorkerStore = create<WorkerState & {
  fetchWorkers: () => Promise<void>;
  fetchWorker: (id: number) => Promise<void>;
  createWorker: (data: { name: string; notes: string }) => Promise<void>;
  updateWorker: (id: number, data: { name: string; notes: string }) => Promise<void>;
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
      set({ workers, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchWorker: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const worker = await workerService.getWorker(id);
      set({ currentWorker: worker, loading: false });
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
      set({ error: (error as Error).message, loading: false });
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
      set({ error: (error as Error).message, loading: false });
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
      set({ error: (error as Error).message, loading: false });
    }
  },

  setCurrentWorker: (worker) => set({ currentWorker: worker }),
}));