import { create } from 'zustand';
import { TaskState, ProductionTask } from '../types';
import { taskService } from '../services';

export const useTaskStore = create<TaskState & {
  fetchTasks: () => Promise<void>;
  fetchTask: (id: number) => Promise<void>;
  fetchTaskProgress: () => Promise<void>;
  createTask: (data: {
    style_id: number;
    marker_id: string;
    color: string;
    planned_layers: number;
  }) => Promise<void>;
  setCurrentTask: (task: ProductionTask | null) => void;
}>((set) => ({
  tasks: [],
  currentTask: null,
  taskProgress: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await taskService.getTasks();
      set({ tasks, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchTask: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const task = await taskService.getTask(id);
      set({ currentTask: task, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchTaskProgress: async () => {
    set({ loading: true, error: null });
    try {
      const taskProgress = await taskService.getTaskProgress();
      set({ taskProgress, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createTask: async (data) => {
    set({ loading: true, error: null });
    try {
      const newTask = await taskService.createTask(data);
      set((state) => ({
        tasks: [...state.tasks, newTask],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  setCurrentTask: (task) => set({ currentTask: task }),
}));