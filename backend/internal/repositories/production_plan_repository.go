package repositories

import (
	"cutrix-backend/internal/models"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type ProductionPlanRepository interface {
	CreatePlan(tx *sqlx.Tx, plan *models.CreateProductionPlanRequest) (*models.ProductionPlan, error)
	UpdatePlan(tx *sqlx.Tx, planID int, plan *models.CreateProductionPlanRequest) error // <-- 新增
	CreateLayout(tx *sqlx.Tx, planID int, layout *models.CreateLayout) (*models.CuttingLayout, error)
	CreateRatios(tx *sqlx.Tx, layoutID int, ratios []models.CreateRatio) error
	CreateTasks(tx *sqlx.Tx, styleID int, layoutID int, layoutName string, tasks []models.CreateTaskForPlan) error
	GetPlanWithDetails(planID int) (*models.ProductionPlan, error)
	GetAllPlans(searchQuery string) ([]models.ProductionPlan, error)
	GetPlanByOrderID(orderID int) (*models.ProductionPlan, error)
	DeletePlan(planID int) error
}

type productionPlanRepository struct {
	db *sqlx.DB
}

func NewProductionPlanRepository(db *sqlx.DB) ProductionPlanRepository {
	return &productionPlanRepository{db: db}
}

// UpdatePlan completely replaces the layouts, ratios, and tasks for a given plan.
func (r *productionPlanRepository) UpdatePlan(tx *sqlx.Tx, planID int, req *models.CreateProductionPlanRequest) error {
	// 1. Update the main plan table
	_, err := tx.Exec(`UPDATE Production_Plans SET plan_name = $1 WHERE plan_id = $2`, req.PlanName, planID)
	if err != nil {
		return fmt.Errorf("failed to update plan name: %w", err)
	}

	// 2. Find old layout IDs to delete tasks
	var oldLayoutIDs []int
	err = tx.Select(&oldLayoutIDs, `SELECT layout_id FROM Cutting_Layouts WHERE plan_id = $1`, planID)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to find old layouts: %w", err)
	}

	// 3. Delete old tasks associated with the plan's layouts
	if len(oldLayoutIDs) > 0 {
		query, args, err := sqlx.In(`DELETE FROM Production_Tasks WHERE layout_id IN (?)`, oldLayoutIDs)
		if err != nil {
			return fmt.Errorf("failed to construct delete tasks query: %w", err)
		}
		query = tx.Rebind(query)
		_, err = tx.Exec(query, args...)
		if err != nil {
			return fmt.Errorf("failed to delete old tasks: %w", err)
		}
	}

	// 4. Delete old layouts (which cascades to ratios)
	_, err = tx.Exec(`DELETE FROM Cutting_Layouts WHERE plan_id = $1`, planID)
	if err != nil {
		return fmt.Errorf("failed to delete old layouts: %w", err)
	}

	// 5. Re-create layouts, ratios, and tasks with the new data (reusing existing functions)
	for _, layoutReq := range req.Layouts {
		layout, err := r.CreateLayout(tx, planID, &layoutReq)
		if err != nil {
			return err
		}
		if err := r.CreateRatios(tx, layout.LayoutID, layoutReq.Ratios); err != nil {
			return err
		}
		if err := r.CreateTasks(tx, req.StyleID, layout.LayoutID, layout.LayoutName, layoutReq.Tasks); err != nil {
			return err
		}
	}

	return nil
}

// ... (其他函数保持不变)
func (r *productionPlanRepository) DeletePlan(planID int) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction for plan deletion: %w", err)
	}
	defer tx.Rollback()
	var layoutIDs []int
	err = tx.Select(&layoutIDs, `SELECT layout_id FROM Cutting_Layouts WHERE plan_id = $1`, planID)
	if err != nil {
		return fmt.Errorf("failed to find layouts for plan: %w", err)
	}
	if len(layoutIDs) > 0 {
		query, args, err := sqlx.In(`DELETE FROM Production_Tasks WHERE layout_id IN (?)`, layoutIDs)
		if err != nil {
			return fmt.Errorf("failed to construct delete tasks query: %w", err)
		}
		query = tx.Rebind(query)
		_, err = tx.Exec(query, args...)
		if err != nil {
			return fmt.Errorf("failed to delete tasks for layouts: %w", err)
		}
	}
	planQuery := `DELETE FROM Production_Plans WHERE plan_id = $1`
	result, err := tx.Exec(planQuery, planID)
	if err != nil {
		return fmt.Errorf("failed to delete plan: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected for plan deletion: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("plan not found or already deleted")
	}
	return tx.Commit()
}
func (r *productionPlanRepository) GetPlanByOrderID(orderID int) (*models.ProductionPlan, error) {
	var plan models.ProductionPlan
	query := `SELECT * FROM Production_Plans WHERE linked_order_id = $1 LIMIT 1`
	err := r.db.Get(&plan, query, orderID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("plan not found for this order")
		}
		return nil, fmt.Errorf("failed to get plan by order id: %w", err)
	}
	return &plan, nil
}
func (r *productionPlanRepository) CreatePlan(tx *sqlx.Tx, req *models.CreateProductionPlanRequest) (*models.ProductionPlan, error) {
	query := `INSERT INTO Production_Plans (plan_name, style_id, linked_order_id) VALUES ($1, $2, $3) 
	          RETURNING plan_id, plan_name, style_id, linked_order_id, created_at`
	var plan models.ProductionPlan
	err := tx.QueryRowx(query, req.PlanName, req.StyleID, req.LinkedOrderID).StructScan(&plan)
	if err != nil {
		return nil, fmt.Errorf("failed to insert plan: %w", err)
	}
	return &plan, nil
}
func (r *productionPlanRepository) CreateLayout(tx *sqlx.Tx, planID int, layoutReq *models.CreateLayout) (*models.CuttingLayout, error) {
	query := `INSERT INTO Cutting_Layouts (plan_id, layout_name, description) VALUES ($1, $2, $3)
	          RETURNING layout_id, plan_id, layout_name, description`
	var layout models.CuttingLayout
	err := tx.QueryRowx(query, planID, layoutReq.LayoutName, layoutReq.Description).StructScan(&layout)
	if err != nil {
		return nil, fmt.Errorf("failed to insert layout: %w", err)
	}
	return &layout, nil
}
func (r *productionPlanRepository) CreateRatios(tx *sqlx.Tx, layoutID int, ratios []models.CreateRatio) error {
	query := `INSERT INTO Layout_Size_Ratios (layout_id, size, ratio) VALUES ($1, $2, $3)`
	stmt, err := tx.Preparex(query)
	if err != nil {
		return fmt.Errorf("failed to prepare ratio statement: %w", err)
	}
	defer stmt.Close()
	for _, ratio := range ratios {
		if _, err := stmt.Exec(layoutID, ratio.Size, ratio.Ratio); err != nil {
			return fmt.Errorf("failed to insert ratio: %w", err)
		}
	}
	return nil
}
func (r *productionPlanRepository) CreateTasks(tx *sqlx.Tx, styleID int, layoutID int, layoutName string, tasks []models.CreateTaskForPlan) error {
	query := `INSERT INTO Production_Tasks (style_id, layout_id, layout_name, color, planned_layers) 
	          VALUES ($1, $2, $3, $4, $5)`
	stmt, err := tx.Preparex(query)
	if err != nil {
		return fmt.Errorf("failed to prepare task statement: %w", err)
	}
	defer stmt.Close()
	for _, task := range tasks {
		if _, err := stmt.Exec(styleID, layoutID, layoutName, task.Color, task.PlannedLayers); err != nil {
			return fmt.Errorf("failed to insert task: %w", err)
		}
	}
	return nil
}
func (r *productionPlanRepository) GetPlanWithDetails(planID int) (*models.ProductionPlan, error) {
	var plan models.ProductionPlan
	err := r.db.Get(&plan, `SELECT * FROM Production_Plans WHERE plan_id = $1`, planID)
	if err != nil {
		return nil, fmt.Errorf("failed to get plan: %w", err)
	}
	var layouts []models.CuttingLayout
	err = r.db.Select(&layouts, `SELECT * FROM Cutting_Layouts WHERE plan_id = $1 ORDER BY layout_id`, planID)
	if err != nil {
		return nil, fmt.Errorf("failed to get layouts for plan: %w", err)
	}
	for i := range layouts {
		layoutID := layouts[i].LayoutID
		var ratios []models.LayoutSizeRatio
		err = r.db.Select(&ratios, `SELECT * FROM Layout_Size_Ratios WHERE layout_id = $1`, layoutID)
		if err != nil {
			return nil, fmt.Errorf("failed to get ratios for layout %d: %w", layoutID, err)
		}
		layouts[i].Ratios = ratios
		var tasks []models.ProductionTask
		err = r.db.Select(&tasks, `SELECT * FROM Production_Tasks WHERE layout_id = $1`, layoutID)
		if err != nil {
			return nil, fmt.Errorf("failed to get tasks for layout %d: %w", layoutID, err)
		}
		layouts[i].Tasks = tasks
	}
	plan.Layouts = layouts
	return &plan, nil
}
func (r *productionPlanRepository) GetAllPlans(searchQuery string) ([]models.ProductionPlan, error) {
	var plans []models.ProductionPlan

	baseQuery := `
		SELECT pp.plan_id, pp.plan_name, pp.style_id, pp.linked_order_id, pp.created_at 
		FROM Production_Plans pp
		LEFT JOIN Production_Orders po ON pp.linked_order_id = po.order_id
	`
	args := []interface{}{}

	if searchQuery != "" {
		baseQuery += " WHERE pp.plan_name ILIKE $1 OR po.order_number ILIKE $1"
		args = append(args, "%"+searchQuery+"%")
	}

	baseQuery += " ORDER BY pp.created_at DESC"

	err := r.db.Select(&plans, baseQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get all plans: %w", err)
	}
	return plans, nil
}
