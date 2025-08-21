package handlers

import (
	"net/http"

	"cutrix-backend/internal/models"
	"cutrix-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type FabricHandler struct {
	fabricService *services.FabricService
}

func NewFabricHandler(fabricService *services.FabricService) *FabricHandler {
	return &FabricHandler{
		fabricService: fabricService,
	}
}

func (h *FabricHandler) CreateFabricRoll(c *gin.Context) {
	var req models.CreateFabricRollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}

	roll, err := h.fabricService.CreateFabricRoll(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to create fabric roll",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Fabric roll created successfully",
		Data:    roll,
	})
}

func (h *FabricHandler) GetFabricRoll(c *gin.Context) {
	id := c.Param("id")
	roll, err := h.fabricService.GetFabricRoll(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Fabric roll not found",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Fabric roll retrieved successfully",
		Data:    roll,
	})
}

func (h *FabricHandler) GetFabricRolls(c *gin.Context) {
	rolls, err := h.fabricService.GetFabricRolls()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to retrieve fabric rolls",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Fabric rolls retrieved successfully",
		Data:    rolls,
	})
}
