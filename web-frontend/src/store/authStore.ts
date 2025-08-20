import { create } from 'zustand';
import { apiService } from '../services/api'; // 假设 apiService 已导出

interface User {
  id: number;
  name: string;
  role: 'admin' | 'worker';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (username, password) => {
    const { token } = await apiService.post<{ token: string }>('/auth/login', { username, password });
    // 在真实应用中，需要解码JWT来获取用户信息
    // 这里我们先简化处理
    const user: User = { id: 1, name: username, role: username === 'admin' ? 'admin' : 'worker' };
    
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      // 同样，这里应该解码token
      // 简化处理：
      const user: User = { id: 1, name: 'Logged In User', role: 'admin' }; // 假设
      set({ token, user, isAuthenticated: true });
    }
  },
}));
