import { apiService } from './api';
import { User, LoginRequest } from '../types';

export const authService = {
  login: (data: LoginRequest) => apiService.post<User>('/auth/login', data),
};