package handlers

import (
	"net/http"

	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"
	"cutrix-backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

type FabricHandler struct {
	fabricService *services.FabricService
}

func NewFabricHandler(db *sqlx.DB) *FabricHandler {
	return &FabricHandler{
		fabricService: services.NewFabricService(
			repositories.NewFabricRepository(db),
			repositories.NewStyleRepository(db),
		),
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

type LogHandler struct {
	logService *services.LogService
}

func NewLogHandler(db *sqlx.DB) *LogHandler {
	return &LogHandler{
		logService: services.NewLogService(repositories.NewLogRepository(db)),
	}
}

func (h *LogHandler) CreateProductionLog(c *gin.Context) {
	var req models.CreateProductionLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}

	log, err := h.logService.CreateProductionLog(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to create production log",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Production log created successfully",
		Data:    log,
	})
}

func (h *LogHandler) GetProductionLogs(c *gin.Context) {
	logs, err := h.logService.GetProductionLogs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to retrieve production logs",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Production logs retrieved successfully",
		Data:    logs,
	})
}

