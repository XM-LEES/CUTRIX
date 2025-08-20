package repositories

import (
	"database/sql"
	"fmt"

	"cutrix-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type OrderRepository interface {
	Create(order *models.OrderDetail) error
	GetByID(id int) (*models.OrderDetail, error)
	GetByStyleID(styleID int) ([]*models.OrderDetail, error)
	GetAll() ([]*models.OrderDetail, error)
}

type orderRepository struct {
	db *sqlx.DB
}

func NewOrderRepository(db *sqlx.DB) OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) Create(order *models.OrderDetail) error {
	query := `INSERT INTO Order_Details (style_id, color, quantity) VALUES ($1, $2, $3) RETURNING detail_id`
	
	err := r.db.QueryRow(query, order.StyleID, order.Color, order.Quantity).Scan(&order.DetailID)
	if err != nil {
		return fmt.Errorf("failed to create order detail: %w", err)
	}
	
	return nil
}

func (r *orderRepository) GetByID(id int) (*models.OrderDetail, error) {
	var order models.OrderDetail
	query := `SELECT detail_id, style_id, color, quantity FROM Order_Details WHERE detail_id = $1`
	
	err := r.db.Get(&order, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("order detail not found")
		}
		return nil, fmt.Errorf("failed to get order detail: %w", err)
	}
	
	return &order, nil
}

func (r *orderRepository) GetByStyleID(styleID int) ([]*models.OrderDetail, error) {
	var orders []*models.OrderDetail
	query := `SELECT detail_id, style_id, color, quantity FROM Order_Details WHERE style_id = $1 ORDER BY detail_id`
	
	err := r.db.Select(&orders, query, styleID)
	if err != nil {
		return nil, fmt.Errorf("failed to get order details: %w", err)
	}
	
	return orders, nil
}

func (r *orderRepository) GetAll() ([]*models.OrderDetail, error) {
	var orders []*models.OrderDetail
	query := `SELECT detail_id, style_id, color, quantity FROM Order_Details ORDER BY detail_id`
	
	err := r.db.Select(&orders, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get order details: %w", err)
	}
	
	return orders, nil
}