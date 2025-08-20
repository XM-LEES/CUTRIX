package models

import "time"

// Style 款号模型
type Style struct {
	StyleID     int    `json:"style_id" db:"style_id"`
	StyleNumber string `json:"style_number" db:"style_number" validate:"required"`
}

// OrderDetail 订单明细模型
type OrderDetail struct {
	DetailID int    `json:"detail_id" db:"detail_id"`
	StyleID  int    `json:"style_id" db:"style_id" validate:"required"`
	Color    string `json:"color" db:"color" validate:"required"`
	Quantity int    `json:"quantity" db:"quantity" validate:"required,min=1"`
}

// ProductionTask 生产任务模型
type ProductionTask struct {
	TaskID          int    `json:"task_id" db:"task_id"`
	StyleID         int    `json:"style_id" db:"style_id" validate:"required"`
	MarkerID        string `json:"marker_id" db:"marker_id" validate:"required"`
	Color           string `json:"color" db:"color" validate:"required"`
	PlannedLayers   int    `json:"planned_layers" db:"planned_layers" validate:"required,min=1"`
	CompletedLayers int    `json:"completed_layers" db:"completed_layers"`
}

// FabricRoll 布匹模型
type FabricRoll struct {
	RollID           string    `json:"roll_id" db:"roll_id" validate:"required"`
	StyleID          int       `json:"style_id" db:"style_id" validate:"required"`
	Color            string    `json:"color" db:"color" validate:"required"`
	RegistrationTime time.Time `json:"registration_time" db:"registration_time"`
	Status           string    `json:"status" db:"status" validate:"required,oneof=可用 使用中 已用完"`
}

// ProductionLog 生产记录模型
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

// Worker 员工模型
type Worker struct {
	WorkerID     int    `json:"worker_id" db:"worker_id"`
	Name         string `json:"name" db:"name" validate:"required"`
	Notes        string `json:"notes" db:"notes"`
	PasswordHash string `json:"-" db:"password_hash"` // 密码哈希不应通过API返回
	Role         string `json:"role" db:"role"`
	IsActive     bool   `json:"is_active" db:"is_active"`
}

// 请求模型
type CreateStyleRequest struct {
	StyleNumber string `json:"style_number" validate:"required"`
}

type CreateOrderRequest struct {
	StyleID  int    `json:"style_id" validate:"required"`
	Color    string `json:"color" validate:"required"`
	Quantity int    `json:"quantity" validate:"required,min=1"`
}

type CreateTaskRequest struct {
	StyleID       int    `json:"style_id" validate:"required"`
	MarkerID      string `json:"marker_id" validate:"required"`
	Color         string `json:"color" validate:"required"`
	PlannedLayers int    `json:"planned_layers" validate:"required,min=1"`
}

type CreateFabricRollRequest struct {
	StyleID int    `json:"style_id" validate:"required"`
	Color   string `json:"color" validate:"required"`
}

type CreateProductionLogRequest struct {
	TaskID          *int    `json:"task_id"`
	RollID          *string `json:"roll_id"`
	ParentLogID     *int64  `json:"parent_log_id"`
	WorkerID        int     `json:"worker_id" validate:"required"`
	ProcessName     string  `json:"process_name" validate:"required,oneof=放料 拉布 裁剪 打包"`
	LayersCompleted *int    `json:"layers_completed"`
}

// 员工请求模型
type CreateWorkerRequest struct {
	Name  string `json:"name" validate:"required"`
	Notes string `json:"notes"`
}

type UpdateWorkerRequest struct {
	Name     string `json:"name" validate:"required"`
	Notes    string `json:"notes"`
	Role     string `json:"role" validate:"oneof=admin worker"`
	IsActive bool   `json:"is_active"`
}

type LoginRequest struct {
	Name     string `json:"name" validate:"required"`
	Password string `json:"password"` // 密码是可选的
}

// 响应模型
type TaskProgress struct {
	TaskID          int     `json:"task_id"`
	StyleID         int     `json:"style_id"`
	MarkerID        string  `json:"marker_id"`
	Color           string  `json:"color"`
	PlannedLayers   int     `json:"planned_layers"`
	CompletedLayers int     `json:"completed_layers"`
	Progress        float64 `json:"progress"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
