// --- 基础 & 认证类型 ---
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ApiConfig 接口
export interface ApiConfig {
  baseURL: string;
  timeout: number;
}

export type UserRole = 'admin' | 'manager' | 'worker' | 'pattern_maker';

export interface User {
  worker_id: number;
  name: string;
  role: UserRole;
  notes: string;
}

export interface LoginRequest {
  name: string;
  password?: string;
}

export interface AuthState extends AppState {
  isAuthenticated: boolean;
  user: User | null;
}


// --- 核心实体模型 (部分更新) ---
export interface AppState {
  loading: boolean;
  error: string | null;
}

export interface Style {
  style_id: number;
  style_number: string;
}

export interface Worker {
  worker_id: number;
  name: string;
  notes: string;
  role: UserRole;
  worker_group?: string;
  is_active: boolean;
}

export interface FabricRoll {
  roll_id: string;
  style_id: number;
  color: string;
  registration_time: string;
  status: '可用' | '使用中' | '已用完';
}

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


// --- 订单、计划、任务模型 (新/重构) ---

export interface ProductionOrder {
  order_id: number;
  order_number: string;
  style_id: number;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  item_id: number;
  order_id: number;
  color: string;
  size: string;
  quantity: number;
}

export interface ProductionPlan {
  plan_id: number;
  plan_name: string;
  style_id: number;
  linked_order_id?: number;
  created_at: string;
  layouts?: CuttingLayout[];
}

export interface CuttingLayout {
  layout_id: number;
  plan_id: number;
  layout_name: string;
  description: string;
  ratios?: LayoutSizeRatio[];
  tasks?: ProductionTask[];
}

export interface LayoutSizeRatio {
  ratio_id: number;
  layout_id: number;
  size: string;
  ratio: number;
}

export interface ProductionTask {
  task_id: number;
  style_id: number;
  layout_id?: number;
  layout_name: string; // 原 marker_id
  color: string;
  planned_layers: number;
  completed_layers: number;
}

// --- API 请求模型 ---

export interface CreateStyleRequest {
  style_number: string;
}

export interface CreateWorkerRequest {
  name: string;
  notes: string;
  role: UserRole;
  worker_group?: string;
  is_active: boolean;
}

export interface UpdateWorkerRequest {
  name: string;
  notes: string;
  role: UserRole;
  worker_group?: string;
  is_active: boolean;
}

// (新) 订单请求
export interface CreateProductionOrderRequest {
    order_number: string;
    style_number: string;
    items: Array<{
        color: string;
        size: string;
        quantity: number;
    }>;
}

// (新) 计划请求
export interface CreateProductionPlanRequest {
    plan_name: string;
    style_id: number;
    linked_order_id?: number;
    layouts: Array<{
        layout_name: string;
        description: string;
        ratios: Array<{
            size: string;
            ratio: number;
        }>;
        tasks: Array<{
            color: string;
            planned_layers: number;
        }>;
    }>;
}


// --- Zustand State 类型 ---

export interface StyleState extends AppState {
  styles: Style[];
  currentStyle: Style | null;
}

export interface WorkerState extends AppState {
  workers: Worker[];
  currentWorker: Worker | null;
}

export interface TaskState extends AppState {
  tasks: ProductionTask[];
  // ...
}

// (新)
export interface OrderState extends AppState {
    orders: ProductionOrder[];
    currentOrder: ProductionOrder | null;
}

// (新)
export interface PlanState extends AppState {
    plans: ProductionPlan[];
    currentPlan: ProductionPlan | null;
}