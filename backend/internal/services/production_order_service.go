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
	db        *sqlx.DB
	orderRepo repositories.ProductionOrderRepository
	styleRepo repositories.StyleRepository // <-- 新增
}

func NewProductionOrderService(db *sqlx.DB, orderRepo repositories.ProductionOrderRepository, styleRepo repositories.StyleRepository) ProductionOrderService {
	return &productionOrderService{
		db:        db,
		orderRepo: orderRepo,
		styleRepo: styleRepo,
	}
}

func (s *productionOrderService) CreateOrder(req *models.CreateProductionOrderRequest) (*models.ProductionOrder, error) {
	tx, err := s.db.Beginx()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	style, err := s.styleRepo.GetByNumber(req.StyleNumber)
	if err != nil {
		// 如果款号不存在，则创建它
		style = &models.Style{StyleNumber: req.StyleNumber}
		if err := s.styleRepo.CreateInTx(tx, style); err != nil {
			return nil, fmt.Errorf("failed to create new style: %w", err)
		}
	}

	order, err := s.orderRepo.CreateOrder(tx, req.OrderNumber, style.StyleID, req.Items)
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
