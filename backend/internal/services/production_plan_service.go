package services

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type ProductionPlanService interface {
	CreatePlan(plan *models.CreateProductionPlanRequest) (*models.ProductionPlan, error)
	UpdatePlan(planID int, plan *models.CreateProductionPlanRequest) (*models.ProductionPlan, error) // <-- 新增
	GetPlanByID(id int) (*models.ProductionPlan, error)
	GetAllPlans(searchQuery string) ([]models.ProductionPlan, error)
	GetPlanByOrderID(orderID int) (*models.ProductionPlan, error)
	DeletePlanByID(id int) error
}

type productionPlanService struct {
	planRepo repositories.ProductionPlanRepository
	db       *sqlx.DB
}

func NewProductionPlanService(db *sqlx.DB, planRepo repositories.ProductionPlanRepository) ProductionPlanService {
	return &productionPlanService{db: db, planRepo: planRepo}
}

func (s *productionPlanService) UpdatePlan(planID int, req *models.CreateProductionPlanRequest) (*models.ProductionPlan, error) {
	tx, err := s.db.Beginx()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction for plan update: %w", err)
	}
	defer tx.Rollback()

	if err := s.planRepo.UpdatePlan(tx, planID, req); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction for plan update: %w", err)
	}

	return s.GetPlanByID(planID)
}

// ... (其他函数不变)
func (s *productionPlanService) DeletePlanByID(id int) error {
	return s.planRepo.DeletePlan(id)
}
func (s *productionPlanService) GetPlanByOrderID(orderID int) (*models.ProductionPlan, error) {
	return s.planRepo.GetPlanByOrderID(orderID)
}
func (s *productionPlanService) CreatePlan(req *models.CreateProductionPlanRequest) (*models.ProductionPlan, error) {
	tx, err := s.db.Beginx()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	plan, err := s.planRepo.CreatePlan(tx, req)
	if err != nil {
		return nil, err
	}

	for _, layoutReq := range req.Layouts {
		layout, err := s.planRepo.CreateLayout(tx, plan.PlanID, &layoutReq)
		if err != nil {
			return nil, err
		}
		if err := s.planRepo.CreateRatios(tx, layout.LayoutID, layoutReq.Ratios); err != nil {
			return nil, err
		}
		if err := s.planRepo.CreateTasks(tx, req.StyleID, layout.LayoutID, layout.LayoutName, layoutReq.Tasks); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return s.GetPlanByID(plan.PlanID)
}
func (s *productionPlanService) GetPlanByID(id int) (*models.ProductionPlan, error) {
	return s.planRepo.GetPlanWithDetails(id)
}
func (s *productionPlanService) GetAllPlans(searchQuery string) ([]models.ProductionPlan, error) {
	return s.planRepo.GetAllPlans(searchQuery)
}
