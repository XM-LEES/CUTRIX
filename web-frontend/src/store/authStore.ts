import { create } from 'zustand';
import { authService } from '../services/authService';
import type { AuthState, User, LoginRequest } from '../types';

type AuthActions = {
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,

  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.login(data);
      set({ isAuthenticated: true, user, loading: false });
      // 将用户信息存储到 localStorage
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false, isAuthenticated: false, user: null });
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    set({ isAuthenticated: false, user: null });
    localStorage.removeItem('user');
  },

  checkAuth: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ isAuthenticated: true, user });
      } catch (e) {
        set({ isAuthenticated: false, user: null });
        localStorage.removeItem('user');
      }
    }
  },
}));