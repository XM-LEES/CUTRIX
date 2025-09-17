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
	UpdatePassword(id int, passwordHash string) error
	GetWorkerTaskGroups(workerID int) ([]models.WorkerTaskGroup, error)
}

type workerRepository struct {
	db *sqlx.DB
}

func NewWorkerRepository(db *sqlx.DB) WorkerRepository {
	return &workerRepository{db: db}
}

// 定义一个包含所有字段的基础查询语句，方便复用
const workerQueryFields = `
    worker_id, 
    name, 
    COALESCE(password_hash, '') as password_hash, 
    role, 
    is_active, 
    COALESCE(notes, '') as notes,
    worker_group
`

func (r *workerRepository) GetByID(id int) (*models.Worker, error) {
	var worker models.Worker
	query := fmt.Sprintf("SELECT %s FROM Workers WHERE worker_id = $1", workerQueryFields)

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
	query := fmt.Sprintf("SELECT %s FROM Workers WHERE name = $1", workerQueryFields)

	err := r.db.Get(&worker, query, name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("worker not found")
		}
		return nil, fmt.Errorf("failed to get worker by name: %w", err)
	}

	return &worker, nil
}

func (r *workerRepository) GetAll() ([]*models.Worker, error) {
	var workers []*models.Worker
	query := fmt.Sprintf("SELECT %s FROM Workers ORDER BY worker_id", workerQueryFields)

	err := r.db.Select(&workers, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get workers: %w", err)
	}

	return workers, nil
}

func (r *workerRepository) Create(workerReq *models.CreateWorkerRequest) (*models.Worker, error) {
	var worker models.Worker
	query := `
        INSERT INTO Workers (name, notes, role, is_active, worker_group) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING ` + workerQueryFields
	err := r.db.QueryRowx(query, workerReq.Name, workerReq.Notes, workerReq.Role, workerReq.IsActive, workerReq.WorkerGroup).StructScan(&worker)
	if err != nil {
		return nil, fmt.Errorf("failed to create worker: %w", err)
	}
	return &worker, nil
}

func (r *workerRepository) Update(id int, workerReq *models.UpdateWorkerRequest) (*models.Worker, error) {
	var worker models.Worker
	query := `
        UPDATE Workers 
        SET name = $1, notes = $2, role = $3, is_active = $4, worker_group = $5
        WHERE worker_id = $6 
        RETURNING ` + workerQueryFields

	err := r.db.Get(&worker, query, workerReq.Name, workerReq.Notes, workerReq.Role, workerReq.IsActive, workerReq.WorkerGroup, id)
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

func (r *workerRepository) UpdatePassword(id int, passwordHash string) error {
	query := `UPDATE Workers SET password_hash = $1 WHERE worker_id = $2`
	result, err := r.db.Exec(query, passwordHash, id)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
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

// GetWorkerTaskGroups 为工人工作台聚合任务数据
func (r *workerRepository) GetWorkerTaskGroups(workerID int) ([]models.WorkerTaskGroup, error) {
	// 这个复杂的SQL查询是实现所有功能的核心
	query := `
        WITH WorkerRelevantTasks AS (
            -- 筛选出与该工人相关的所有未完成的任务
            SELECT DISTINCT t.*
            FROM Production_Tasks t
            WHERE t.completed_layers < t.planned_layers
            -- 你可以在这里加入更复杂的逻辑，例如只显示被指派给该工人的任务
            -- 目前的逻辑是：只要任务没完成，所有工人都能看到
        ),
        AggregatedPlans AS (
            -- 按 plan_id 聚合任务数据
            SELECT
                p.plan_id,
                p.plan_name,
                s.style_number,
                SUM(wrt.planned_layers) as total_planned,
                SUM(wrt.completed_layers) as total_completed
            FROM WorkerRelevantTasks wrt
            JOIN Cutting_Layouts cl ON wrt.layout_id = cl.layout_id
            JOIN Production_Plans p ON cl.plan_id = p.plan_id
            JOIN Styles s ON p.style_id = s.style_id
            GROUP BY p.plan_id, s.style_number
        )
        -- 查询最终结果
        SELECT * FROM AggregatedPlans ORDER BY plan_id;
    `

	var taskGroups []models.WorkerTaskGroup
	if err := r.db.Select(&taskGroups, query); err != nil {
		return nil, fmt.Errorf("failed to get worker task groups: %w", err)
	}

	// 现在，为每个 task group 填充具体的 tasks
	if len(taskGroups) > 0 {
		planIDs := make([]int, len(taskGroups))
		for i, tg := range taskGroups {
			planIDs[i] = tg.PlanID
		}

		tasksQuery, args, err := sqlx.In(`
            SELECT t.*
            FROM Production_Tasks t
            JOIN Cutting_Layouts cl ON t.layout_id = cl.layout_id
            WHERE cl.plan_id IN (?);
        `, planIDs)
		if err != nil {
			return nil, fmt.Errorf("failed to construct tasks query: %w", err)
		}
		tasksQuery = r.db.Rebind(tasksQuery)

		var allTasks []models.ProductionTask
		if err := r.db.Select(&allTasks, tasksQuery, args...); err != nil {
			return nil, fmt.Errorf("failed to fetch tasks for groups: %w", err)
		}

		// 将任务分配到对应的 group
		tasksByPlanID := make(map[int][]models.ProductionTask)
		// 假设 task 结构体中需要 plan_id 来分组
		// 如果没有，需要修改查询以包含它
		// 临时的解决办法是再次查询
		for _, task := range allTasks {
			var planId int
			err := r.db.Get(&planId, "SELECT plan_id FROM Cutting_Layouts WHERE layout_id = $1", task.LayoutID)
			if err == nil {
				tasksByPlanID[planId] = append(tasksByPlanID[planId], task)
			}
		}

		for i := range taskGroups {
			taskGroups[i].Tasks = tasksByPlanID[taskGroups[i].PlanID]
		}
	}

	return taskGroups, nil
}
