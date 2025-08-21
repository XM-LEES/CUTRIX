package services

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// ValidationError 自定义验证错误类型
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

// WorkerService 定义统一的员工服务接口 (包含查询和管理)
type WorkerService interface {
	// Query methods
	GetByID(id int) (*models.Worker, error)
	GetByName(name string) (*models.Worker, error)
	GetAll() ([]*models.Worker, error)
	GetWorkerTasks(workerID int) ([]*models.ProductionTask, error)
	GetWorkerLogs(workerID int) ([]*models.ProductionLog, error)
	// Management methods
	Create(worker *models.CreateWorkerRequest) (*models.Worker, error)
	Update(id int, worker *models.UpdateWorkerRequest) (*models.Worker, error)
	Delete(id int) error

	UpdatePassword(updatingUserID int, updatingUserRole string, targetWorkerID int, newPassword string) error
}

type workerService struct {
	workerRepo repositories.WorkerRepository
}

// NewWorkerService 创建新的统一员工服务实例
func NewWorkerService(workerRepo repositories.WorkerRepository) WorkerService {
	return &workerService{workerRepo: workerRepo}
}

// --- 查询方法 ---

func (s *workerService) GetByID(id int) (*models.Worker, error) {
	return s.workerRepo.GetByID(id)
}

func (s *workerService) GetByName(name string) (*models.Worker, error) {
	return s.workerRepo.GetByName(name)
}

func (s *workerService) GetAll() ([]*models.Worker, error) {
	return s.workerRepo.GetAll()
}

func (s *workerService) GetWorkerTasks(workerID int) ([]*models.ProductionTask, error) {
	return s.workerRepo.GetWorkerTasks(workerID)
}

func (s *workerService) GetWorkerLogs(workerID int) ([]*models.ProductionLog, error) {
	return s.workerRepo.GetWorkerLogs(workerID)
}

// --- 管理方法 ---

func (s *workerService) Create(workerReq *models.CreateWorkerRequest) (*models.Worker, error) {
	// 检查同名员工是否已存在
	existingWorker, err := s.workerRepo.GetByName(workerReq.Name)
	if err == nil && existingWorker != nil {
		return nil, &ValidationError{Message: "员工姓名已存在"}
	}
	return s.workerRepo.Create(workerReq)
}

func (s *workerService) Update(id int, workerReq *models.UpdateWorkerRequest) (*models.Worker, error) {
	// 检查其他员工是否已使用该名称
	existingWorker, err := s.workerRepo.GetByName(workerReq.Name)
	if err == nil && existingWorker != nil && existingWorker.WorkerID != id {
		return nil, &ValidationError{Message: "员工姓名已存在"}
	}

	// 验证角色值
	validRoles := map[string]bool{"admin": true, "manager": true, "worker": true, "pattern_maker": true}
	if !validRoles[workerReq.Role] {
		return nil, &ValidationError{Message: "无效的角色"}
	}

	return s.workerRepo.Update(id, workerReq)
}

func (s *workerService) Delete(id int) error {
	// 检查员工是否存在
	worker, err := s.workerRepo.GetByID(id)
	if err != nil {
		return err // worker not found
	}

	// 禁止删除 admin
	if worker.Role == "admin" {
		return &ValidationError{Message: "不能删除管理员账户"}
	}

	return s.workerRepo.Delete(id)
}

func (s *workerService) UpdatePassword(updatingUserID int, updatingUserRole string, targetWorkerID int, newPassword string) error {
	// 1. 获取目标用户信息
	targetWorker, err := s.workerRepo.GetByID(targetWorkerID)
	if err != nil {
		return &ValidationError{Message: "目标用户不存在"}
	}

	// 2. 权限检查
	if updatingUserRole == "manager" {
		if targetWorker.Role == "admin" || targetWorker.Role == "manager" {
			return &ValidationError{Message: "权限不足，无法修改该用户的密码"}
		}
	} else if updatingUserRole != "admin" {
		return &ValidationError{Message: "权限不足"}
	}

	// 3. 哈希新密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// 4. 更新数据库
	return s.workerRepo.UpdatePassword(targetWorkerID, string(hashedPassword))
}
