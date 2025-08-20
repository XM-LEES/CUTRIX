package repositories

import (
	"database/sql"
	"fmt"

	"cutrix-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type TaskRepository interface {
	Create(task *models.ProductionTask) error
	GetByID(id int) (*models.ProductionTask, error)
	GetByStyleID(styleID int) ([]*models.ProductionTask, error)
	GetAll() ([]*models.ProductionTask, error)
	GetProgress() ([]*models.TaskProgress, error)
}

type taskRepository struct {
	db *sqlx.DB
}

func NewTaskRepository(db *sqlx.DB) TaskRepository {
	return &taskRepository{db: db}
}

func (r *taskRepository) Create(task *models.ProductionTask) error {
	query := `INSERT INTO Production_Tasks (style_id, marker_id, color, planned_layers, completed_layers) 
	          VALUES ($1, $2, $3, $4, $5) RETURNING task_id`
	
	err := r.db.QueryRow(query, task.StyleID, task.MarkerID, task.Color, task.PlannedLayers, task.CompletedLayers).Scan(&task.TaskID)
	if err != nil {
		return fmt.Errorf("failed to create production task: %w", err)
	}
	
	return nil
}

func (r *taskRepository) GetByID(id int) (*models.ProductionTask, error) {
	var task models.ProductionTask
	query := `SELECT task_id, style_id, marker_id, color, planned_layers, completed_layers 
	          FROM Production_Tasks WHERE task_id = $1`
	
	err := r.db.Get(&task, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("production task not found")
		}
		return nil, fmt.Errorf("failed to get production task: %w", err)
	}
	
	return &task, nil
}

func (r *taskRepository) GetByStyleID(styleID int) ([]*models.ProductionTask, error) {
	var tasks []*models.ProductionTask
	query := `SELECT task_id, style_id, marker_id, color, planned_layers, completed_layers 
	          FROM Production_Tasks WHERE style_id = $1 ORDER BY task_id`
	
	err := r.db.Select(&tasks, query, styleID)
	if err != nil {
		return nil, fmt.Errorf("failed to get production tasks: %w", err)
	}
	
	return tasks, nil
}

func (r *taskRepository) GetAll() ([]*models.ProductionTask, error) {
	var tasks []*models.ProductionTask
	query := `SELECT task_id, style_id, marker_id, color, planned_layers, completed_layers 
	          FROM Production_Tasks ORDER BY task_id`
	
	err := r.db.Select(&tasks, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get production tasks: %w", err)
	}
	
	return tasks, nil
}

func (r *taskRepository) GetProgress() ([]*models.TaskProgress, error) {
	var progress []*models.TaskProgress
	query := `SELECT task_id, style_id, marker_id, color, planned_layers, completed_layers,
	                 CASE 
	                     WHEN planned_layers = 0 THEN 0
	                     ELSE ROUND((completed_layers::FLOAT / planned_layers::FLOAT) * 100, 2)
	                 END as progress
	          FROM Production_Tasks 
	          ORDER BY task_id`
	
	err := r.db.Select(&progress, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get task progress: %w", err)
	}
	
	return progress, nil
}