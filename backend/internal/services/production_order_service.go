package services

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type ProductionOrderService interface {
	CreateOrder(order *models.CreateProductionOrderRequest) (*models.ProductionOrder, error)
	GetOrderByID(id int) (*models.ProductionOrder, error)
	GetAllOrders() ([]models.ProductionOrder, error)
}

type productionOrderService struct {
	orderRepo repositories.ProductionOrderRepository
	db        *sqlx.DB // DB instance for transactions
}

func NewProductionOrderService(db *sqlx.DB, orderRepo repositories.ProductionOrderRepository) ProductionOrderService {
	return &productionOrderService{db: db, orderRepo: orderRepo}
}

func (s *productionOrderService) CreateOrder(req *models.CreateProductionOrderRequest) (*models.ProductionOrder, error) {
	tx, err := s.db.Beginx()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback() // Rollback on error

	order, err := s.orderRepo.CreateOrder(tx, req)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return s.GetOrderByID(order.OrderID)
}

func (s *productionOrderService) GetOrderByID(id int) (*models.ProductionOrder, error) {
	return s.orderRepo.GetOrderWithItems(id)
}

func (s *productionOrderService) GetAllOrders() ([]models.ProductionOrder, error) {
	return s.orderRepo.GetAllOrders()
}
