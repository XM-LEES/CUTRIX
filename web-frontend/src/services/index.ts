import { apiService } from './api';
import { 
  Style, CreateStyleRequest,
  ProductionTask, 
  Worker, CreateWorkerRequest, UpdateWorkerRequest,
  ProductionOrder, CreateProductionOrderRequest,
  ProductionPlan, CreateProductionPlanRequest
} from '../types';

// ... (其他服务不变)

// 生产计划服务
export const productionPlanService = {
  getPlans: () => apiService.get<ProductionPlan[]>('/production-plans'),
  getPlan: (id: number) => apiService.get<ProductionPlan>(`/production-plans/${id}`),
  createPlan: (data: CreateProductionPlanRequest) => apiService.post<ProductionPlan>('/production-plans', data),
  getPlanByOrderId: (orderId: number) => apiService.get<ProductionPlan>(`/production-plans/by-order/${orderId}`),
  deletePlan: (id: number) => apiService.delete(`/production-plans/${id}`), // <-- 新增
};

// ... (其他服务不变)
export const styleService = {
  getStyles: () => apiService.get<Style[]>('/styles'),
  getStyle: (id: number) => apiService.get<Style>(`/styles/${id}`),
  createStyle: (data: CreateStyleRequest) => apiService.post<Style>('/styles', data),
};
export const productionOrderService = {
  getOrders: (query?: string) => {
    const endpoint = query ? `/production-orders?style_number=${query}` : '/production-orders';
    return apiService.get<ProductionOrder[]>(endpoint);
  },
  getUnplannedOrders: () => apiService.get<ProductionOrder[]>('/production-orders/unplanned'),
  getOrder: (id: number) => apiService.get<ProductionOrder>(`/production-orders/${id}`),
  createOrder: (data: CreateProductionOrderRequest) => apiService.post<ProductionOrder>('/production-orders', data),
  deleteOrder: (id: number) => apiService.delete(`/production-orders/${id}`),
};
export const workerService = {
    getWorkers: () => apiService.get<Worker[]>('/workers'),
    getWorker: (id: number) => apiService.get<Worker>(`/workers/${id}`),
    createWorker: (data: CreateWorkerRequest) => apiService.post<Worker>('/workers', data),
    updateWorker: (id: number, data: UpdateWorkerRequest) => apiService.put<Worker>(`/workers/${id}`, data),
    deleteWorker: (id: number) => apiService.delete(`/workers/${id}`),
    getWorkerTasks: (workerId: number) => apiService.get<ProductionTask[]>(`/workers/${workerId}/tasks`),
    updateWorkerPassword: (id: number, data: { password: string }) => apiService.put(`/workers/${id}/password`, data),
};
export { authService } from './authService';