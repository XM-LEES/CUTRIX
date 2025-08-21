package services

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type ProductionPlanService interface {
	CreatePlan(plan *models.CreateProductionPlanRequest) (*models.ProductionPlan, error)
	GetPlanByID(id int) (*models.ProductionPlan, error)
	GetAllPlans() ([]models.ProductionPlan, error)
}

type productionPlanService struct {
	planRepo repositories.ProductionPlanRepository
	db       *sqlx.DB
}

func NewProductionPlanService(db *sqlx.DB, planRepo repositories.ProductionPlanRepository) ProductionPlanService {
	return &productionPlanService{db: db, planRepo: planRepo}
}

func (s *productionPlanService) CreatePlan(req *models.CreateProductionPlanRequest) (*models.ProductionPlan, error) {
	tx, err := s.db.Beginx()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Create Plan
	plan, err := s.planRepo.CreatePlan(tx, req)
	if err != nil {
		return nil, err
	}

	// 2. Create Layouts, Ratios, and Tasks
	for _, layoutReq := range req.Layouts {
		// Create Layout
		layout, err := s.planRepo.CreateLayout(tx, plan.PlanID, &layoutReq)
		if err != nil {
			return nil, err
		}

		// Create Ratios for the Layout
		if err := s.planRepo.CreateRatios(tx, layout.LayoutID, layoutReq.Ratios); err != nil {
			return nil, err
		}

		// Create Tasks for the Layout
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

func (s *productionPlanService) GetAllPlans() ([]models.ProductionPlan, error) {
	return s.planRepo.GetAllPlans()
}
