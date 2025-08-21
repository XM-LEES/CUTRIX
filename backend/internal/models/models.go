package models

import "time"

// --- 基础实体模型 ---

type Style struct {
	StyleID     int    `json:"style_id" db:"style_id"`
	StyleNumber string `json:"style_number" db:"style_number" validate:"required"`
}

type Worker struct {
	WorkerID     int    `json:"worker_id" db:"worker_id"`
	Name         string `json:"name" db:"name" validate:"required"`
	Notes        string `json:"notes" db:"notes"`
	PasswordHash string `json:"-" db:"password_hash"`
	Role         string `json:"role" db:"role"`
	IsActive     bool   `json:"is_active" db:"is_active"`
}

type FabricRoll struct {
	RollID           string    `json:"roll_id" db:"roll_id" validate:"required"`
	StyleID          int       `json:"style_id" db:"style_id" validate:"required"`
	Color            string    `json:"color" db:"color" validate:"required"`
	RegistrationTime time.Time `json:"registration_time" db:"registration_time"`
	Status           string    `json:"status" db:"status" validate:"required,oneof=可用 使用中 已用完"`
}

type ProductionLog struct {
	LogID           int64     `json:"log_id" db:"log_id"`
	TaskID          *int      `json:"task_id" db:"task_id"`
	RollID          *string   `json:"roll_id" db:"roll_id"`
	ParentLogID     *int64    `json:"parent_log_id" db:"parent_log_id"`
	WorkerID        int       `json:"worker_id" db:"worker_id" validate:"required"`
	ProcessName     string    `json:"process_name" db:"process_name" validate:"required,oneof=放料 拉布 裁剪 打包"`
	LayersCompleted *int      `json:"layers_completed" db:"layers_completed"`
	LogTime         time.Time `json:"log_time" db:"log_time"`
}

// --- 订单、计划、任务模型 (新/重构) ---

type ProductionOrder struct {
	OrderID     int         `json:"order_id" db:"order_id"`
	OrderNumber string      `json:"order_number" db:"order_number"`
	StyleID     int         `json:"style_id" db:"style_id"`
	CreatedAt   time.Time   `json:"created_at" db:"created_at"`
	Items       []OrderItem `json:"items,omitempty"` // 用于API响应，数据库中无此字段
}

type OrderItem struct {
	ItemID   int    `json:"item_id" db:"item_id"`
	OrderID  int    `json:"order_id" db:"order_id"`
	Color    string `json:"color" db:"color"`
	Size     string `json:"size" db:"size"`
	Quantity int    `json:"quantity" db:"quantity"`
}

type ProductionPlan struct {
	PlanID        int             `json:"plan_id" db:"plan_id"`
	PlanName      string          `json:"plan_name" db:"plan_name"`
	StyleID       int             `json:"style_id" db:"style_id"`
	LinkedOrderID *int            `json:"linked_order_id" db:"linked_order_id"`
	CreatedAt     time.Time       `json:"created_at" db:"created_at"`
	Layouts       []CuttingLayout `json:"layouts,omitempty"` // 用于API响应，数据库中无此字段
}

type CuttingLayout struct {
	LayoutID    int               `json:"layout_id" db:"layout_id"`
	PlanID      int               `json:"plan_id" db:"plan_id"`
	LayoutName  string            `json:"layout_name" db:"layout_name"`
	Description string            `json:"description" db:"description"`
	Ratios      []LayoutSizeRatio `json:"ratios,omitempty"` // 用于API响应
	Tasks       []ProductionTask  `json:"tasks,omitempty"`  // 用于API响应
}

type LayoutSizeRatio struct {
	RatioID  int    `json:"ratio_id" db:"ratio_id"`
	LayoutID int    `json:"layout_id" db:"layout_id"`
	Size     string `json:"size" db:"size"`
	Ratio    int    `json:"ratio" db:"ratio"`
}

type ProductionTask struct {
	TaskID          int    `json:"task_id" db:"task_id"`
	StyleID         int    `json:"style_id" db:"style_id"`
	LayoutID        *int   `json:"layout_id,omitempty" db:"layout_id"`
	LayoutName      string `json:"layout_name" db:"layout_name"`
	Color           string `json:"color" db:"color"`
	PlannedLayers   int    `json:"planned_layers" db:"planned_layers"`
	CompletedLayers int    `json:"completed_layers" db:"completed_layers"`
}

// --- API 请求/响应模型 ---

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// 登录
type LoginRequest struct {
	Name     string `json:"name" validate:"required"`
	Password string `json:"password"`
}

// 款号
type CreateStyleRequest struct {
	StyleNumber string `json:"style_number" validate:"required"`
}

// 员工
type CreateWorkerRequest struct {
	Name     string `json:"name" validate:"required"`
	Notes    string `json:"notes"`
	Role     string `json:"role" validate:"oneof=admin worker"`
	IsActive bool   `json:"is_active"`
}

type UpdateWorkerRequest struct {
	Name     string `json:"name" validate:"required"`
	Notes    string `json:"notes"`
	Role     string `json:"role" validate:"oneof=admin worker"`
	IsActive bool   `json:"is_active"`
}

// 布匹
type CreateFabricRollRequest struct {
	StyleID int    `json:"style_id" validate:"required"`
	Color   string `json:"color" validate:"required"`
}

// 生产记录
type CreateProductionLogRequest struct {
	TaskID          *int    `json:"task_id"`
	RollID          *string `json:"roll_id"`
	ParentLogID     *int64  `json:"parent_log_id"`
	WorkerID        int     `json:"worker_id" validate:"required"`
	ProcessName     string  `json:"process_name" validate:"required,oneof=放料 拉布 裁剪 打包"`
	LayersCompleted *int    `json:"layers_completed"`
}

// 订单 (新)
type CreateProductionOrderRequest struct {
	OrderNumber string            `json:"order_number" validate:"required"`
	StyleID     int               `json:"style_id" validate:"required"`
	Items       []CreateOrderItem `json:"items" validate:"required,min=1"`
}
type CreateOrderItem struct {
	Color    string `json:"color" validate:"required"`
	Size     string `json:"size" validate:"required"`
	Quantity int    `json:"quantity" validate:"required,min=1"`
}

// 生产计划 (新)
type CreateProductionPlanRequest struct {
	PlanName      string         `json:"plan_name" validate:"required"`
	StyleID       int            `json:"style_id" validate:"required"`
	LinkedOrderID *int           `json:"linked_order_id"`
	Layouts       []CreateLayout `json:"layouts" validate:"required,min=1,dive"`
}
type CreateLayout struct {
	LayoutName  string              `json:"layout_name" validate:"required"`
	Description string              `json:"description"`
	Ratios      []CreateRatio       `json:"ratios" validate:"required,min=1,dive"`
	Tasks       []CreateTaskForPlan `json:"tasks" validate:"required,min=1,dive"`
}
type CreateRatio struct {
	Size  string `json:"size" validate:"required"`
	Ratio int    `json:"ratio" validate:"required,min=1"`
}
type CreateTaskForPlan struct {
	Color         string `json:"color" validate:"required"`
	PlannedLayers int    `json:"planned_layers" validate:"required,min=1"`
}

// 任务 (用于直接创建，可能后续会用到)
type CreateTaskRequest struct {
	StyleID       int    `json:"style_id" validate:"required"`
	LayoutID      int    `json:"layout_id" validate:"required"`
	LayoutName    string `json:"layout_name" validate:"required"`
	Color         string `json:"color" validate:"required"`
	PlannedLayers int    `json:"planned_layers" validate:"required,min=1"`
}

// 响应模型
type TaskProgress struct {
	TaskID          int     `json:"task_id"`
	StyleID         int     `json:"style_id"`
	LayoutName      string  `json:"layout_name"`
	Color           string  `json:"color"`
	PlannedLayers   int     `json:"planned_layers"`
	CompletedLayers int     `json:"completed_layers"`
	Progress        float64 `json:"progress"`
}
