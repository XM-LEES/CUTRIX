import { apiService } from './api';
import { 
  Style, CreateStyleRequest,
  ProductionTask, 
  Worker, CreateWorkerRequest, UpdateWorkerRequest,
  ProductionOrder, CreateProductionOrderRequest,
  ProductionPlan, CreateProductionPlanRequest
} from '../types';

// 款号服务
export const styleService = {
  getStyles: () => apiService.get<Style[]>('/styles'),
  getStyle: (id: number) => apiService.get<Style>(`/styles/${id}`),
  createStyle: (data: CreateStyleRequest) => apiService.post<Style>('/styles', data),
};

// (新) 生产订单服务
export const productionOrderService = {
  getOrders: () => apiService.get<ProductionOrder[]>('/production-orders'),
  getOrder: (id: number) => apiService.get<ProductionOrder>(`/production-orders/${id}`),
  createOrder: (data: CreateProductionOrderRequest) => apiService.post<ProductionOrder>('/production-orders', data),
};

// (新) 生产计划服务
export const productionPlanService = {
  getPlans: () => apiService.get<ProductionPlan[]>('/production-plans'),
  getPlan: (id: number) => apiService.get<ProductionPlan>(`/production-plans/${id}`),
  createPlan: (data: CreateProductionPlanRequest) => apiService.post<ProductionPlan>('/production-plans', data),
};

// 员工服务
export const workerService = {
  getWorkers: () => apiService.get<Worker[]>('/workers'),
  getWorker: (id: number) => apiService.get<Worker>(`/workers/${id}`),
  createWorker: (data: CreateWorkerRequest) => apiService.post<Worker>('/workers', data),
  updateWorker: (id: number, data: UpdateWorkerRequest) => apiService.put<Worker>(`/workers/${id}`, data),
  deleteWorker: (id: number) => apiService.delete(`/workers/${id}`),
  getWorkerTasks: (workerId: number) => apiService.get<ProductionTask[]>(`/workers/${workerId}/tasks`),
};

// 登录服务
export { authService } from './authService';