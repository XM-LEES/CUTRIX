package handlers

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ProductionPlanHandler struct {
	planService services.ProductionPlanService
}

func NewProductionPlanHandler(planService services.ProductionPlanService) *ProductionPlanHandler {
	return &ProductionPlanHandler{planService: planService}
}

func (h *ProductionPlanHandler) UpdatePlan(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid plan ID", Error: "plan ID must be a number",
		})
		return
	}

	var req models.CreateProductionPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid request body", Error: err.Error(),
		})
		return
	}

	plan, err := h.planService.UpdatePlan(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to update production plan", Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true, Message: "Production plan updated successfully", Data: plan,
	})
}

// ... (其他函数不变)
func (h *ProductionPlanHandler) DeletePlan(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid plan ID", Error: "plan ID must be a number",
		})
		return
	}

	err = h.planService.DeletePlanByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to delete plan", Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true, Message: "Plan deleted successfully",
	})
}
func (h *ProductionPlanHandler) GetPlanByOrderID(c *gin.Context) {
	idStr := c.Param("order_id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid order ID", Error: "order ID must be a number",
		})
		return
	}

	plan, err := h.planService.GetPlanByOrderID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false, Message: "Plan not found for this order", Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true, Message: "Plan retrieved successfully", Data: plan,
	})
}
func (h *ProductionPlanHandler) CreatePlan(c *gin.Context) {
	var req models.CreateProductionPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid request body", Error: err.Error(),
		})
		return
	}

	plan, err := h.planService.CreatePlan(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to create production plan", Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true, Message: "Production plan created successfully", Data: plan,
	})
}
func (h *ProductionPlanHandler) GetPlan(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false, Message: "Invalid plan ID", Error: "plan ID must be a number",
		})
		return
	}

	plan, err := h.planService.GetPlanByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false, Message: "Plan not found", Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true, Message: "Plan retrieved successfully", Data: plan,
	})
}
func (h *ProductionPlanHandler) GetPlans(c *gin.Context) {
	searchQuery := c.Query("q")
	plans, err := h.planService.GetAllPlans(searchQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false, Message: "Failed to retrieve plans", Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true, Message: "Plans retrieved successfully", Data: plans,
	})
}
