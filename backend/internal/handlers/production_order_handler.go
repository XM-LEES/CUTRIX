package handlers

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ProductionOrderHandler struct {
	orderService services.ProductionOrderService
}

func NewProductionOrderHandler(orderService services.ProductionOrderService) *ProductionOrderHandler {
	return &ProductionOrderHandler{orderService: orderService}
}

func (h *ProductionOrderHandler) CreateOrder(c *gin.Context) {
	var req models.CreateProductionOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid request body", Error: err.Error(),
		})
		return
	}

	order, err := h.orderService.CreateOrder(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to create production order", Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true, Message: "Production order created successfully", Data: order,
	})
}

func (h *ProductionOrderHandler) GetOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid order ID", Error: "order ID must be a number",
		})
		return
	}

	order, err := h.orderService.GetOrderByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false, Message: "Order not found", Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true, Message: "Order retrieved successfully", Data: order,
	})
}

func (h *ProductionOrderHandler) GetOrders(c *gin.Context) {
	styleNumberQuery := c.Query("style_number")

	orders, err := h.orderService.GetAllOrders(styleNumberQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to retrieve orders", Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true, Message: "Orders retrieved successfully", Data: orders,
	})
}

func (h *ProductionOrderHandler) DeleteOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid order ID", Error: "order ID must be a number",
		})
		return
	}

	err = h.orderService.DeleteOrderByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to delete order", Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true, Message: "Order deleted successfully",
	})
}
