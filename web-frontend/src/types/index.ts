// 基础类型
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 款号相关类型
export interface Style {
  style_id: number;
  style_number: string;
}

export interface CreateStyleRequest {
  style_number: string;
}

// 订单相关类型
export interface OrderDetail {
  detail_id: number;
  style_id: number;
  color: string;
  quantity: number;
}

export interface CreateOrderRequest {
  style_id: number;
  color: string;
  quantity: number;
}

// 生产任务相关类型
export interface ProductionTask {
  task_id: number;
  style_id: number;
  marker_id: string;
  color: string;
  planned_layers: number;
  completed_layers: number;
}

export interface CreateTaskRequest {
  style_id: number;
  marker_id: string;
  color: string;
  planned_layers: number;
}

export interface TaskProgress {
  task_id: number;
  style_id: number;
  marker_id: string;
  color: string;
  planned_layers: number;
  completed_layers: number;
  progress: number;
}

// 布匹相关类型
export interface FabricRoll {
  roll_id: string;
  style_id: number;
  color: string;
  registration_time: string;
  status: '可用' | '使用中' | '已用完';
}

export interface CreateFabricRollRequest {
  style_id: number;
  color: string;
}

// 生产记录相关类型
export interface ProductionLog {
  log_id: number;
  task_id?: number;
  roll_id?: string;
  parent_log_id?: number;
  worker_id: number;
  process_name: '放料' | '拉布' | '裁剪' | '打包';
  layers_completed?: number;
  log_time: string;
}

export interface CreateProductionLogRequest {
  task_id?: number;
  roll_id?: string;
  parent_log_id?: number;
  worker_id: number;
  process_name: '放料' | '拉布' | '裁剪' | '打包';
  layers_completed?: number;
}

// 员工相关类型
export interface Worker {
  worker_id: number;
  name: string;
  notes: string;
}

export interface CreateWorkerRequest {
  name: string;
  notes: string;
}

export interface UpdateWorkerRequest {
  name: string;
  notes: string;
}

// 表单相关类型
export interface FormErrors {
  [key: string]: string;
}

// 状态相关类型
export interface AppState {
  loading: boolean;
  error: string | null;
}

export interface StyleState extends AppState {
  styles: Style[];
  currentStyle: Style | null;
}

export interface OrderState extends AppState {
  orders: OrderDetail[];
  currentOrder: OrderDetail | null;
}

export interface TaskState extends AppState {
  tasks: ProductionTask[];
  currentTask: ProductionTask | null;
  taskProgress: TaskProgress[];
}

export interface FabricState extends AppState {
  fabricRolls: FabricRoll[];
  currentFabricRoll: FabricRoll | null;
}

export interface LogState extends AppState {
  productionLogs: ProductionLog[];
  currentLog: ProductionLog | null;
}

export interface WorkerState extends AppState {
  workers: Worker[];
  currentWorker: Worker | null;
  workerTasks: ProductionTask[];
}

// API相关类型
export interface ApiConfig {
  baseURL: string;
  timeout: number;
}

// 认证和用户相关类型
export interface User {
  worker_id: number;
  name: string;
  username: string;
  role: 'admin' | 'worker';
  notes: string;
}

export interface LoginRequest {
  username: string;
  password?: string; // 密码可选
}

export interface AuthState extends AppState {
  isAuthenticated: boolean;
  user: User | null;
}