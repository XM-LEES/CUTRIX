package repositories

import (
	"cutrix-backend/internal/models"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type ProductionOrderRepository interface {
	CreateOrder(tx *sqlx.Tx, order *models.CreateProductionOrderRequest) (*models.ProductionOrder, error)
	GetOrderWithItems(orderID int) (*models.ProductionOrder, error)
	GetAllOrders() ([]models.ProductionOrder, error)
}

type productionOrderRepository struct {
	db *sqlx.DB
}

func NewProductionOrderRepository(db *sqlx.DB) ProductionOrderRepository {
	return &productionOrderRepository{db: db}
}

// CreateOrder 在一个事务中创建订单及其所有项目
func (r *productionOrderRepository) CreateOrder(tx *sqlx.Tx, req *models.CreateProductionOrderRequest) (*models.ProductionOrder, error) {
	// 1. 插入主订单表
	orderQuery := `INSERT INTO Production_Orders (order_number, style_id) VALUES ($1, $2) RETURNING order_id, order_number, style_id, created_at`
	var order models.ProductionOrder
	err := tx.QueryRowx(orderQuery, req.OrderNumber, req.StyleID).StructScan(&order)
	if err != nil {
		return nil, fmt.Errorf("failed to insert production order: %w", err)
	}

	// 2. 批量插入订单项目
	itemQuery := `INSERT INTO Order_Items (order_id, color, size, quantity) VALUES ($1, $2, $3, $4)`
	stmt, err := tx.Preparex(itemQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare order item statement: %w", err)
	}
	defer stmt.Close()

	for _, item := range req.Items {
		_, err := stmt.Exec(order.OrderID, item.Color, item.Size, item.Quantity)
		if err != nil {
			return nil, fmt.Errorf("failed to insert order item: %w", err)
		}
	}

	return &order, nil
}

// GetOrderWithItems 获取一个订单及其所有项目
func (r *productionOrderRepository) GetOrderWithItems(orderID int) (*models.ProductionOrder, error) {
	var order models.ProductionOrder
	orderQuery := `SELECT order_id, order_number, style_id, created_at FROM Production_Orders WHERE order_id = $1`
	err := r.db.Get(&order, orderQuery, orderID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("order not found")
		}
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	var items []models.OrderItem
	itemsQuery := `SELECT item_id, order_id, color, size, quantity FROM Order_Items WHERE order_id = $1`
	err = r.db.Select(&items, itemsQuery, orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get order items: %w", err)
	}

	order.Items = items
	return &order, nil
}

// GetAllOrders 获取所有订单 (不包含项目详情，用于列表页)
func (r *productionOrderRepository) GetAllOrders() ([]models.ProductionOrder, error) {
	var orders []models.ProductionOrder
	query := `SELECT po.order_id, po.order_number, po.style_id, po.created_at
	          FROM Production_Orders po ORDER BY po.created_at DESC`
	err := r.db.Select(&orders, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get all orders: %w", err)
	}
	return orders, nil
}
