package repositories

import (
	"database/sql"
	"fmt"

	"cutrix-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type LogRepository interface {
	Create(log *models.ProductionLog) error
	GetByID(id int64) (*models.ProductionLog, error)
	GetByTaskID(taskID int) ([]*models.ProductionLog, error)
	GetByRollID(rollID string) ([]*models.ProductionLog, error)
	GetByWorkerID(workerID int) ([]*models.ProductionLog, error)
	GetByProcessName(processName string) ([]*models.ProductionLog, error)
	GetByParentLogID(parentLogID int64) ([]*models.ProductionLog, error)
	GetAll() ([]*models.ProductionLog, error)
	GetSpreadingLogs() ([]*models.ProductionLog, error)
	GetUnprocessedSpreadingLogs() ([]*models.ProductionLog, error)
}

type logRepository struct {
	db *sqlx.DB
}

func NewLogRepository(db *sqlx.DB) LogRepository {
	return &logRepository{db: db}
}

func (r *logRepository) Create(log *models.ProductionLog) error {
	query := `INSERT INTO Production_Logs (task_id, roll_id, parent_log_id, worker_id, process_name, layers_completed, log_time) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING log_id`
	
	err := r.db.QueryRow(query, log.TaskID, log.RollID, log.ParentLogID, log.WorkerID, log.ProcessName, log.LayersCompleted, log.LogTime).Scan(&log.LogID)
	if err != nil {
		return fmt.Errorf("failed to create production log: %w", err)
	}
	
	return nil
}

func (r *logRepository) GetByID(id int64) (*models.ProductionLog, error) {
	var log models.ProductionLog
	query := `SELECT log_id, task_id, roll_id, parent_log_id, worker_id, process_name, layers_completed, log_time 
	          FROM Production_Logs WHERE log_id = $1`
	
	err := r.db.Get(&log, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("production log not found")
		}
		return nil, fmt.Errorf("failed to get production log: %w", err)
	}
	
	return &log, nil
}

func (r *logRepository) GetByTaskID(taskID int) ([]*models.ProductionLog, error) {
	var logs []*models.ProductionLog
	query := `SELECT log_id, task_id, roll_id, parent_log_id, worker_id, process_name, layers_completed, log_time 
	          FROM Production_Logs WHERE task_id = $1 ORDER BY log_time`
	
	err := r.db.Select(&logs, query, taskID)
	if err != nil {
		return nil, fmt.Errorf("failed to get production logs: %w", err)
	}
	
	return logs, nil
}

func (r *logRepository) GetByRollID(rollID string) ([]*models.ProductionLog, error) {
	var logs []*models.ProductionLog
	query := `SELECT log_id, task_id, roll_id, parent_log_id, worker_id, process_name, layers_completed, log_time 
	          FROM Production_Logs WHERE roll_id = $1 ORDER BY log_time`
	
	err := r.db.Select(&logs, query, rollID)
	if err != nil {
		return nil, fmt.Errorf("failed to get production logs: %w", err)
	}
	
	return logs, nil
}

func (r *logRepository) GetByWorkerID(workerID int) ([]*models.ProductionLog, error) {
	var logs []*models.ProductionLog
	query := `SELECT log_id, task_id, roll_id, parent_log_id, worker_id, process_name, layers_completed, log_time 
	          FROM Production_Logs WHERE worker_id = $1 ORDER BY log_time`
	
	err := r.db.Select(&logs, query, workerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get production logs: %w", err)
	}
	
	return logs, nil
}

func (r *logRepository) GetByProcessName(processName string) ([]*models.ProductionLog, error) {
	var logs []*models.ProductionLog
	query := `SELECT log_id, task_id, roll_id, parent_log_id, worker_id, process_name, layers_completed, log_time 
	          FROM Production_Logs WHERE process_name = $1 ORDER BY log_time`
	
	err := r.db.Select(&logs, query, processName)
	if err != nil {
		return nil, fmt.Errorf("failed to get production logs: %w", err)
	}
	
	return logs, nil
}

func (r *logRepository) GetByParentLogID(parentLogID int64) ([]*models.ProductionLog, error) {
	var logs []*models.ProductionLog
	query := `SELECT log_id, task_id, roll_id, parent_log_id, worker_id, process_name, layers_completed, log_time 
	          FROM Production_Logs WHERE parent_log_id = $1 ORDER BY log_time`
	
	err := r.db.Select(&logs, query, parentLogID)
	if err != nil {
		return nil, fmt.Errorf("failed to get production logs: %w", err)
	}
	
	return logs, nil
}

func (r *logRepository) GetAll() ([]*models.ProductionLog, error) {
	var logs []*models.ProductionLog
	query := `SELECT log_id, task_id, roll_id, parent_log_id, worker_id, process_name, layers_completed, log_time 
	          FROM Production_Logs ORDER BY log_time`
	
	err := r.db.Select(&logs, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get production logs: %w", err)
	}
	
	return logs, nil
}

func (r *logRepository) GetSpreadingLogs() ([]*models.ProductionLog, error) {
	var logs []*models.ProductionLog
	query := `SELECT log_id, task_id, roll_id, parent_log_id, worker_id, process_name, layers_completed, log_time 
	          FROM Production_Logs WHERE process_name = '拉布' ORDER BY log_time`
	
	err := r.db.Select(&logs, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get spreading logs: %w", err)
	}
	
	return logs, nil
}

func (r *logRepository) GetUnprocessedSpreadingLogs() ([]*models.ProductionLog, error) {
	var logs []*models.ProductionLog
	query := `SELECT l.log_id, l.task_id, l.roll_id, l.parent_log_id, l.worker_id, l.process_name, l.layers_completed, l.log_time
	          FROM Production_Logs l
	          WHERE l.process_name = '拉布' 
	          AND NOT EXISTS (
	              SELECT 1 FROM Production_Logs 
	              WHERE parent_log_id = l.log_id AND process_name = '裁剪'
	          )
	          ORDER BY l.log_time`
	
	err := r.db.Select(&logs, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get unprocessed spreading logs: %w", err)
	}
	
	return logs, nil
}