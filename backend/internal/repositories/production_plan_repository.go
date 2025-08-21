package repositories

import (
	"cutrix-backend/internal/models"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type ProductionPlanRepository interface {
	CreatePlan(tx *sqlx.Tx, plan *models.CreateProductionPlanRequest) (*models.ProductionPlan, error)
	CreateLayout(tx *sqlx.Tx, planID int, layout *models.CreateLayout) (*models.CuttingLayout, error)
	CreateRatios(tx *sqlx.Tx, layoutID int, ratios []models.CreateRatio) error
	CreateTasks(tx *sqlx.Tx, styleID int, layoutID int, layoutName string, tasks []models.CreateTaskForPlan) error
	GetPlanWithDetails(planID int) (*models.ProductionPlan, error)
	GetAllPlans() ([]models.ProductionPlan, error)
}

type productionPlanRepository struct {
	db *sqlx.DB
}

func NewProductionPlanRepository(db *sqlx.DB) ProductionPlanRepository {
	return &productionPlanRepository{db: db}
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
	// 1. 获取计划主体
	err := r.db.Get(&plan, `SELECT * FROM Production_Plans WHERE plan_id = $1`, planID)
	if err != nil {
		return nil, fmt.Errorf("failed to get plan: %w", err)
	}

	// 2. 获取该计划下的所有排版
	var layouts []models.CuttingLayout
	err = r.db.Select(&layouts, `SELECT * FROM Cutting_Layouts WHERE plan_id = $1 ORDER BY layout_id`, planID)
	if err != nil {
		return nil, fmt.Errorf("failed to get layouts for plan: %w", err)
	}

	// 3. 为每个排版获取其尺码比例和任务
	for i := range layouts {
		layoutID := layouts[i].LayoutID

		// 获取尺码比例
		var ratios []models.LayoutSizeRatio
		err = r.db.Select(&ratios, `SELECT * FROM Layout_Size_Ratios WHERE layout_id = $1`, layoutID)
		if err != nil {
			return nil, fmt.Errorf("failed to get ratios for layout %d: %w", layoutID, err)
		}
		layouts[i].Ratios = ratios

		// 获取任务
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

func (r *productionPlanRepository) GetAllPlans() ([]models.ProductionPlan, error) {
	var plans []models.ProductionPlan
	query := `SELECT plan_id, plan_name, style_id, linked_order_id, created_at FROM Production_Plans ORDER BY created_at DESC`
	err := r.db.Select(&plans, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get all plans: %w", err)
	}
	return plans, nil
}
