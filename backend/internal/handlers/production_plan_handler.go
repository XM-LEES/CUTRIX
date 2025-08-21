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
	plans, err := h.planService.GetAllPlans()
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
