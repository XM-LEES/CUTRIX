import { create } from 'zustand';
import type { TaskState } from '../types';
import { taskService } from '../services';


// Define only the state properties we actually need
type SimpleTaskState = Pick<TaskState, 'tasks' | 'loading' | 'error'>;

type TaskActions = {
  fetchTasks: () => Promise<void>;
};

export const useTaskStore = create<SimpleTaskState & TaskActions>((set) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await taskService.getTasks();
      set({ tasks: tasks || [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));