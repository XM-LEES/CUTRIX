import { apiService } from './api';
import { 
  Style, 
  CreateStyleRequest,
  OrderDetail,
  CreateOrderRequest,
  ProductionTask,
  CreateTaskRequest,
  TaskProgress,
  FabricRoll,
  CreateFabricRollRequest,
  ProductionLog,
  CreateProductionLogRequest,
  Worker,
  CreateWorkerRequest,
  UpdateWorkerRequest
} from '../types';

// 款号服务
export const styleService = {
  getStyles: () => apiService.get<Style[]>('/styles'),
  getStyle: (id: number) => apiService.get<Style>(`/styles/${id}`),
  createStyle: (data: CreateStyleRequest) => apiService.post<Style>('/styles', data),
};

// 订单服务
export const orderService = {
  getOrders: () => apiService.get<OrderDetail[]>('/orders'),
  getOrder: (id: number) => apiService.get<OrderDetail>(`/orders/${id}`),
  createOrder: (data: CreateOrderRequest) => apiService.post<OrderDetail>('/orders', data),
};

// 任务服务
export const taskService = {
  getTasks: () => apiService.get<ProductionTask[]>('/tasks'),
  getTask: (id: number) => apiService.get<ProductionTask>(`/tasks/${id}`),
  createTask: (data: CreateTaskRequest) => apiService.post<ProductionTask>('/tasks', data),
  getTaskProgress: () => apiService.get<TaskProgress[]>('/tasks/progress'),
};

// 布匹服务
export const fabricService = {
  getFabricRolls: () => apiService.get<FabricRoll[]>('/fabric-rolls'),
  getFabricRoll: (id: string) => apiService.get<FabricRoll>(`/fabric-rolls/${id}`),
  createFabricRoll: (data: CreateFabricRollRequest) => apiService.post<FabricRoll>('/fabric-rolls', data),
};

// 生产记录服务
export const logService = {
  getProductionLogs: () => apiService.get<ProductionLog[]>('/production-logs'),
  createProductionLog: (data: CreateProductionLogRequest) => apiService.post<ProductionLog>('/production-logs', data),
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