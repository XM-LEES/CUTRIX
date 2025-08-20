package handlers

import (
	"net/http"
	"strconv"

	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"
	"cutrix-backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

type StyleHandler struct {
	styleService *services.StyleService
}

func NewStyleHandler(db *sqlx.DB) *StyleHandler {
	return &StyleHandler{
		styleService: services.NewStyleService(repositories.NewStyleRepository(db)),
	}
}

func (h *StyleHandler) CreateStyle(c *gin.Context) {
	var req models.CreateStyleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}

	style, err := h.styleService.CreateStyle(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to create style",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Style created successfully",
		Data:    style,
	})
}

func (h *StyleHandler) GetStyle(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid style ID",
			Error:   "style ID must be a number",
		})
		return
	}

	style, err := h.styleService.GetStyle(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Style not found",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Style retrieved successfully",
		Data:    style,
	})
}

func (h *StyleHandler) GetStyles(c *gin.Context) {
	styles, err := h.styleService.GetStyles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to retrieve styles",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Styles retrieved successfully",
		Data:    styles,
	})
}