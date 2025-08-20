package repositories

import (
	"database/sql"
	"fmt"

	"cutrix-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type WorkerRepository interface {
	GetByID(id int) (*models.Worker, error)
	GetByName(name string) (*models.Worker, error)
	GetAll() ([]*models.Worker, error)
	Create(worker *models.CreateWorkerRequest) (*models.Worker, error)
	Update(id int, worker *models.UpdateWorkerRequest) (*models.Worker, error)
	Delete(id int) error
	GetWorkerTasks(workerID int) ([]*models.ProductionTask, error)
	GetWorkerLogs(workerID int) ([]*models.ProductionLog, error)
}

type workerRepository struct {
	db *sqlx.DB
}

func NewWorkerRepository(db *sqlx.DB) WorkerRepository {
	return &workerRepository{db: db}
}

func (r *workerRepository) GetByID(id int) (*models.Worker, error) {
	var worker models.Worker
	query := `SELECT worker_id, name, notes FROM Workers WHERE worker_id = $1`
	
	err := r.db.Get(&worker, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("worker not found")
		}
		return nil, fmt.Errorf("failed to get worker: %w", err)
	}
	
	return &worker, nil
}

func (r *workerRepository) GetByName(name string) (*models.Worker, error) {
	var worker models.Worker
	query := `SELECT worker_id, name, notes FROM Workers WHERE name = $1`
	
	err := r.db.Get(&worker, query, name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("worker not found")
		}
		return nil, fmt.Errorf("failed to get worker: %w", err)
	}
	
	return &worker, nil
}

func (r *workerRepository) GetAll() ([]*models.Worker, error) {
	var workers []*models.Worker
	query := `SELECT worker_id, name, notes FROM Workers ORDER BY worker_id`
	
	err := r.db.Select(&workers, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get workers: %w", err)
	}
	
	return workers, nil
}

func (r *workerRepository) Create(workerReq *models.CreateWorkerRequest) (*models.Worker, error) {
	var worker models.Worker
	query := `INSERT INTO Workers (name, notes) VALUES ($1, $2) RETURNING worker_id, name, notes`
	
	err := r.db.QueryRow(query, workerReq.Name, workerReq.Notes).Scan(&worker.WorkerID, &worker.Name, &worker.Notes)
	if err != nil {
		return nil, fmt.Errorf("failed to create worker: %w", err)
	}
	
	return &worker, nil
}

func (r *workerRepository) Update(id int, workerReq *models.UpdateWorkerRequest) (*models.Worker, error) {
	var worker models.Worker
	query := `UPDATE Workers SET name = $1, notes = $2 WHERE worker_id = $3 RETURNING worker_id, name, notes`
	
	err := r.db.QueryRow(query, workerReq.Name, workerReq.Notes, id).Scan(&worker.WorkerID, &worker.Name, &worker.Notes)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("worker not found")
		}
		return nil, fmt.Errorf("failed to update worker: %w", err)
	}
	
	return &worker, nil
}

func (r *workerRepository) Delete(id int) error {
	query := `DELETE FROM Workers WHERE worker_id = $1`
	
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete worker: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("worker not found")
	}
	
	return nil
}

func (r *workerRepository) GetWorkerTasks(workerID int) ([]*models.ProductionTask, error) {
	var tasks []*models.ProductionTask
	query := `SELECT DISTINCT pt.task_id, pt.style_id, pt.marker_id, pt.color, pt.planned_layers, pt.completed_layers
	          FROM Production_Tasks pt
	          LEFT JOIN Production_Logs pl ON pt.task_id = pl.task_id
	          WHERE pt.completed_layers < pt.planned_layers
	          OR (pl.process_name = '拉布' AND pl.worker_id = $1)
	          ORDER BY pt.task_id`
	
	err := r.db.Select(&tasks, query, workerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get worker tasks: %w", err)
	}
	
	return tasks, nil
}

func (r *workerRepository) GetWorkerLogs(workerID int) ([]*models.ProductionLog, error) {
	var logs []*models.ProductionLog
	query := `SELECT log_id, task_id, roll_id, parent_log_id, worker_id, process_name, layers_completed, log_time
	          FROM Production_Logs WHERE worker_id = $1 ORDER BY log_time DESC`
	
	err := r.db.Select(&logs, query, workerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get worker logs: %w", err)
	}
	
	return logs, nil
}