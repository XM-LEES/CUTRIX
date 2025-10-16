package services

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"
	"fmt"
	"time"
)

type LogService interface {
	CreateLog(log *models.CreateLogRequest) error
	GetLogsByTaskID(taskID int) ([]*models.ProductionLog, error)
}

type logService struct {
	logRepo repositories.LogRepository
}

func NewLogService(logRepo repositories.LogRepository) LogService {
	return &logService{
		logRepo: logRepo,
	}
}

func (s *logService) CreateLog(req *models.CreateLogRequest) error {
	log := &models.ProductionLog{
		TaskID:          req.TaskID,
		ParentLogID:     req.ParentLogID,
		WorkerID:        req.WorkerID,
		ProcessName:     req.ProcessName,
		LayersCompleted: req.LayersCompleted,
		LogTime:         time.Now(),
	}

	if err := s.logRepo.Create(log); err != nil {
		return fmt.Errorf("创建生产记录失败: %w", err)
	}

	return nil
}

func (s *logService) GetLogsByTaskID(taskID int) ([]*models.ProductionLog, error) {
	logs, err := s.logRepo.GetByTaskID(taskID)
	if err != nil {
		return nil, fmt.Errorf("获取任务日志失败: %w", err)
	}
	return logs, nil
}
