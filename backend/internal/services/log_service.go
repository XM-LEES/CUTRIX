package services

import (
	"fmt"
	"time"

	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"

	"github.com/go-playground/validator/v10"
)

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
