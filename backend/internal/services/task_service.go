package services

import (
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
