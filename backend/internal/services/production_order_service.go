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
	GetAllOrders(styleNumberQuery string) ([]models.ProductionOrder, error)
	GetAllUnplannedOrders() ([]models.ProductionOrder, error) // <-- 新增
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

func (s *productionOrderService) GetAllUnplannedOrders() ([]models.ProductionOrder, error) {
	return s.orderRepo.GetAllUnplannedOrders()
}

// ... (其他函数不变)

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

func (s *productionOrderService) GetAllOrders(styleNumberQuery string) ([]models.ProductionOrder, error) {
	return s.orderRepo.GetAllOrders(styleNumberQuery)
}

func (s *productionOrderService) DeleteOrderByID(id int) error {
	// 开始事务
	tx, err := s.db.Beginx()
	if err != nil {
		return fmt.Errorf("开始事务失败: %w", err)
	}
	defer tx.Rollback()

	// 在事务中检查是否有关联的生产计划
	var planExists bool
	err = tx.Get(&planExists, `SELECT EXISTS(SELECT 1 FROM Production_Plans WHERE linked_order_id = $1)`, id)
	if err != nil {
		return fmt.Errorf("检查关联生产计划失败: %w", err)
	}
	
	// 如果存在关联的生产计划，返回友好的错误提示
	if planExists {
		return fmt.Errorf("无法删除订单：请先删除与此订单关联的生产计划")
	}
	
	// 如果没有关联的生产计划，继续删除订单
	if err := s.orderRepo.DeleteOrder(tx, id); err != nil {
		return fmt.Errorf("删除订单失败: %w", err)
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("提交事务失败: %w", err)
	}
	
	return nil
}
