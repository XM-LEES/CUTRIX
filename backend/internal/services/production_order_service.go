package services

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

type ProductionOrderService interface {
	CreateOrder(order *models.CreateProductionOrderRequest) (*models.ProductionOrder, error)
	GetOrderByID(id int) (*models.ProductionOrder, error)
	GetAllOrders() ([]models.ProductionOrder, error)
	DeleteOrderByID(id int) error
}

type productionOrderService struct {
	db        *sqlx.DB
	orderRepo repositories.ProductionOrderRepository
	styleRepo repositories.StyleRepository
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

	// 1. 获取或创建款号
	style, err := s.styleRepo.GetByNumber(req.StyleNumber)
	if err != nil {
		// 如果款号不存在，则创建它
		style = &models.Style{StyleNumber: req.StyleNumber}
		if err := s.styleRepo.CreateInTx(tx, style); err != nil {
			return nil, fmt.Errorf("failed to create new style: %w", err)
		}
	}

	// 2. 自动生成订单号
	// 获取当天该款号的订单数量，以生成序号
	today := time.Now().Format("20060102")
	count, err := s.orderRepo.CountOrdersByStyleAndDate(style.StyleID, today)
	if err != nil {
		return nil, fmt.Errorf("failed to count existing orders for today: %w", err)
	}
	// 格式化订单号：PO-YYYYMMDD-款号-当日序号
	orderNumber := fmt.Sprintf("PO-%s-%s-%02d", today, style.StyleNumber, count+1)

	// 3. 创建订单
	order, err := s.orderRepo.CreateOrder(tx, orderNumber, style.StyleID, req.Items)
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

func (s *productionOrderService) DeleteOrderByID(id int) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if err := s.orderRepo.DeleteOrder(tx, id); err != nil {
		return err
	}

	return tx.Commit()
}
