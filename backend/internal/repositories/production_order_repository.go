package repositories

import (
	"cutrix-backend/internal/models"
	"database/sql"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

type ProductionOrderRepository interface {
	CreateOrder(tx *sqlx.Tx, orderNumber string, styleID int, items []models.CreateOrderItem) (*models.ProductionOrder, error)
	GetOrderWithItems(orderID int) (*models.ProductionOrder, error)
	GetAllOrders(styleNumberQuery string) ([]models.ProductionOrder, error) // Signature updated
	CountOrdersByStyleAndDate(styleID int, date string) (int, error)
	DeleteOrder(tx *sqlx.Tx, orderID int) error
}

type productionOrderRepository struct {
	db *sqlx.DB
}

func NewProductionOrderRepository(db *sqlx.DB) ProductionOrderRepository {
	return &productionOrderRepository{db: db}
}

// CreateOrder and GetOrderWithItems remain the same...

func (r *productionOrderRepository) CreateOrder(tx *sqlx.Tx, orderNumber string, styleID int, items []models.CreateOrderItem) (*models.ProductionOrder, error) {
	orderQuery := `INSERT INTO Production_Orders (order_number, style_id) VALUES ($1, $2) RETURNING order_id, order_number, style_id, created_at`
	var order models.ProductionOrder
	err := tx.QueryRowx(orderQuery, orderNumber, styleID).StructScan(&order)
	if err != nil {
		return nil, fmt.Errorf("failed to insert production order: %w", err)
	}

	itemQuery := `INSERT INTO Order_Items (order_id, color, size, quantity) VALUES ($1, $2, $3, $4)`
	stmt, err := tx.Preparex(itemQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare order item statement: %w", err)
	}
	defer stmt.Close()

	for _, item := range items {
		_, err := stmt.Exec(order.OrderID, item.Color, item.Size, item.Quantity)
		if err != nil {
			return nil, fmt.Errorf("failed to insert order item: %w", err)
		}
	}

	return &order, nil
}

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

// GetAllOrders now accepts a search query
func (r *productionOrderRepository) GetAllOrders(styleNumberQuery string) ([]models.ProductionOrder, error) {
	var orders []models.ProductionOrder

	baseQuery := `
        SELECT po.order_id, po.order_number, po.style_id, po.created_at
        FROM Production_Orders po
        LEFT JOIN Styles s ON po.style_id = s.style_id
    `
	args := []interface{}{}

	if styleNumberQuery != "" {
		baseQuery += " WHERE s.style_number ILIKE $1" // ILIKE for case-insensitive search
		args = append(args, "%"+styleNumberQuery+"%")
	}

	baseQuery += " ORDER BY po.created_at DESC"

	err := r.db.Select(&orders, baseQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get all orders: %w", err)
	}
	return orders, nil
}

// CountOrdersByStyleAndDate and DeleteOrder remain the same...
func (r *productionOrderRepository) CountOrdersByStyleAndDate(styleID int, date string) (int, error) {
	var count int
	startTime, err := time.Parse("20060102", date)
	if err != nil {
		return 0, err
	}
	endTime := startTime.Add(24 * time.Hour)

	query := `SELECT COUNT(*) FROM Production_Orders WHERE style_id = $1 AND created_at >= $2 AND created_at < $3`
	err = r.db.Get(&count, query, styleID, startTime, endTime)
	if err != nil {
		return 0, fmt.Errorf("failed to count orders: %w", err)
	}
	return count, nil
}

func (r *productionOrderRepository) DeleteOrder(tx *sqlx.Tx, orderID int) error {
	query := `DELETE FROM Production_Orders WHERE order_id = $1`
	result, err := tx.Exec(query, orderID)
	if err != nil {
		return fmt.Errorf("failed to delete order: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("order not found or already deleted")
	}
	return nil
}
