package services

import (
	"fmt"

	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"

	"github.com/go-playground/validator/v10"
)

type TaskService struct {
	taskRepo  repositories.TaskRepository
	styleRepo repositories.StyleRepository
	validator *validator.Validate
}

func NewTaskService(taskRepo repositories.TaskRepository, styleRepo repositories.StyleRepository) *TaskService {
	return &TaskService{
		taskRepo:  taskRepo,
		styleRepo: styleRepo,
		validator: validator.New(),
	}
}

func (s *TaskService) CreateTask(req *models.CreateTaskRequest) (*models.ProductionTask, error) {
	// 验证请求
	if err := s.validator.Struct(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// 检查款号是否存在
	_, err := s.styleRepo.GetByID(req.StyleID)
	if err != nil {
		return nil, fmt.Errorf("style not found: %w", err)
	}

	// 创建生产任务
	task := &models.ProductionTask{
		StyleID:         req.StyleID,
		MarkerID:        req.MarkerID,
		Color:           req.Color,
		PlannedLayers:   req.PlannedLayers,
		CompletedLayers: 0,
	}

	if err := s.taskRepo.Create(task); err != nil {
		return nil, fmt.Errorf("failed to create task: %w", err)
	}

	return task, nil
}

func (s *TaskService) GetTask(id int) (*models.ProductionTask, error) {
	return s.taskRepo.GetByID(id)
}

func (s *TaskService) GetTasks() ([]*models.ProductionTask, error) {
	return s.taskRepo.GetAll()
}

func (s *TaskService) GetTasksByStyle(styleID int) ([]*models.ProductionTask, error) {
	return s.taskRepo.GetByStyleID(styleID)
}

func (s *TaskService) GetTaskProgress() ([]*models.TaskProgress, error) {
	return s.taskRepo.GetProgress()
}