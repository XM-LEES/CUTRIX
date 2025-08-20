package services

import (
	"fmt"

	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"

	"github.com/go-playground/validator/v10"
)

type OrderService struct {
	orderRepo  repositories.OrderRepository
	styleRepo  repositories.StyleRepository
	validator  *validator.Validate
}

func NewOrderService(orderRepo repositories.OrderRepository, styleRepo repositories.StyleRepository) *OrderService {
	return &OrderService{
		orderRepo: orderRepo,
		styleRepo: styleRepo,
		validator: validator.New(),
	}
}

func (s *OrderService) CreateOrder(req *models.CreateOrderRequest) (*models.OrderDetail, error) {
	// 验证请求
	if err := s.validator.Struct(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// 检查款号是否存在
	_, err := s.styleRepo.GetByID(req.StyleID)
	if err != nil {
		return nil, fmt.Errorf("style not found: %w", err)
	}

	// 创建订单明细
	order := &models.OrderDetail{
		StyleID:  req.StyleID,
		Color:    req.Color,
		Quantity: req.Quantity,
	}

	if err := s.orderRepo.Create(order); err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	return order, nil
}

func (s *OrderService) GetOrder(id int) (*models.OrderDetail, error) {
	return s.orderRepo.GetByID(id)
}

func (s *OrderService) GetOrders() ([]*models.OrderDetail, error) {
	return s.orderRepo.GetAll()
}

func (s *OrderService) GetOrdersByStyle(styleID int) ([]*models.OrderDetail, error) {
	return s.orderRepo.GetByStyleID(styleID)
}