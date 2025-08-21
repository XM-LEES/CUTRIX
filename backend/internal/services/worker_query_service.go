package services

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"
)

type WorkerQueryService interface {
	GetByID(id int) (*models.Worker, error)
	GetByName(name string) (*models.Worker, error)
	GetAll() ([]*models.Worker, error)
	GetWorkerTasks(workerID int) ([]*models.ProductionTask, error)
	GetWorkerLogs(workerID int) ([]*models.ProductionLog, error)
}

type workerQueryService struct {
	workerRepo repositories.WorkerRepository
}

func NewWorkerQueryService(workerRepo repositories.WorkerRepository) WorkerQueryService {
	return &workerQueryService{workerRepo: workerRepo}
}

func (s *workerQueryService) GetByID(id int) (*models.Worker, error) {
	return s.workerRepo.GetByID(id)
}

func (s *workerQueryService) GetByName(name string) (*models.Worker, error) {
	return s.workerRepo.GetByName(name)
}

func (s *workerQueryService) GetAll() ([]*models.Worker, error) {
	return s.workerRepo.GetAll()
}

func (s *workerQueryService) GetWorkerTasks(workerID int) ([]*models.ProductionTask, error) {
	return s.workerRepo.GetWorkerTasks(workerID)
}

func (s *workerQueryService) GetWorkerLogs(workerID int) ([]*models.ProductionLog, error) {
	return s.workerRepo.GetWorkerLogs(workerID)
}
