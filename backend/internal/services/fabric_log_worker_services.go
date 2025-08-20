package services

import (
	"fmt"
	"time"

	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"

	"github.com/go-playground/validator/v10"
)

type FabricService struct {
	fabricRepo repositories.FabricRepository
	styleRepo  repositories.StyleRepository
	validator  *validator.Validate
}

func NewFabricService(fabricRepo repositories.FabricRepository, styleRepo repositories.StyleRepository) *FabricService {
	return &FabricService{
		fabricRepo: fabricRepo,
		styleRepo:  styleRepo,
		validator:  validator.New(),
	}
}

func (s *FabricService) CreateFabricRoll(req *models.CreateFabricRollRequest) (*models.FabricRoll, error) {
	if err := s.validator.Struct(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// 检查款号是否存在
	_, err := s.styleRepo.GetByID(req.StyleID)
	if err != nil {
		return nil, fmt.Errorf("style not found: %w", err)
	}

	// 生成roll_id
	rollID, err := s.fabricRepo.GetNextRollID(req.StyleID, req.Color)
	if err != nil {
		return nil, fmt.Errorf("failed to generate roll ID: %w", err)
	}

	// 创建布匹记录
	roll := &models.FabricRoll{
		RollID:           rollID,
		StyleID:          req.StyleID,
		Color:            req.Color,
		RegistrationTime: time.Now(),
		Status:           "可用",
	}

	if err := s.fabricRepo.Create(roll); err != nil {
		return nil, fmt.Errorf("failed to create fabric roll: %w", err)
	}

	return roll, nil
}

func (s *FabricService) GetFabricRoll(id string) (*models.FabricRoll, error) {
	return s.fabricRepo.GetByID(id)
}

func (s *FabricService) GetFabricRolls() ([]*models.FabricRoll, error) {
	return s.fabricRepo.GetAll()
}

type LogService struct {
	logRepo   repositories.LogRepository
	validator *validator.Validate
}

func NewLogService(logRepo repositories.LogRepository) *LogService {
	return &LogService{
		logRepo:   logRepo,
		validator: validator.New(),
	}
}

func (s *LogService) CreateProductionLog(req *models.CreateProductionLogRequest) (*models.ProductionLog, error) {
	if err := s.validator.Struct(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	log := &models.ProductionLog{
		TaskID:          req.TaskID,
		RollID:          req.RollID,
		ParentLogID:     req.ParentLogID,
		WorkerID:        req.WorkerID,
		ProcessName:     req.ProcessName,
		LayersCompleted: req.LayersCompleted,
		LogTime:         time.Now(),
	}

	if err := s.logRepo.Create(log); err != nil {
		return nil, fmt.Errorf("failed to create production log: %w", err)
	}

	return log, nil
}

func (s *LogService) GetProductionLogs() ([]*models.ProductionLog, error) {
	return s.logRepo.GetAll()
}

type WorkerService struct {
	workerRepo repositories.WorkerRepository
}

func NewWorkerService(workerRepo repositories.WorkerRepository) *WorkerService {
	return &WorkerService{
		workerRepo: workerRepo,
	}
}

func (s *WorkerService) GetWorkers() ([]*models.Worker, error) {
	return s.workerRepo.GetAll()
}

func (s *WorkerService) GetWorkerTasks(workerID int) ([]*models.ProductionTask, error) {
	return s.workerRepo.GetWorkerTasks(workerID)
}

func (s *WorkerService) GetWorkerLogs(workerID int) ([]*models.ProductionLog, error) {
	return s.workerRepo.GetWorkerLogs(workerID)
}