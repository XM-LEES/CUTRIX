package services

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"
)

type WorkerManagementService interface {
	Create(worker *models.CreateWorkerRequest) (*models.Worker, error)
	Update(id int, worker *models.UpdateWorkerRequest) (*models.Worker, error)
	Delete(id int) error
}

type workerManagementService struct {
	workerRepo repositories.WorkerRepository
}

func NewWorkerManagementService(workerRepo repositories.WorkerRepository) WorkerManagementService {
	return &workerManagementService{workerRepo: workerRepo}
}

func (s *workerManagementService) Create(workerReq *models.CreateWorkerRequest) (*models.Worker, error) {
	// Check if worker with same name already exists
	existingWorker, err := s.workerRepo.GetByName(workerReq.Name)
	if err == nil && existingWorker != nil {
		return nil, &ValidationError{Message: "员工姓名已存在"}
	}

	return s.workerRepo.Create(workerReq)
}

func (s *workerManagementService) Update(id int, workerReq *models.UpdateWorkerRequest) (*models.Worker, error) {
	// Check if another worker with same name already exists
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

func (s *workerManagementService) Delete(id int) error {
	// Check if worker exists
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
