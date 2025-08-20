package services

import (
	"fmt"

	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"

	"github.com/go-playground/validator/v10"
)

type StyleService struct {
	styleRepo repositories.StyleRepository
	validator *validator.Validate
}

func NewStyleService(styleRepo repositories.StyleRepository) *StyleService {
	return &StyleService{
		styleRepo: styleRepo,
		validator: validator.New(),
	}
}

func (s *StyleService) CreateStyle(req *models.CreateStyleRequest) (*models.Style, error) {
	// 验证请求
	if err := s.validator.Struct(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// 检查款号是否已存在
	existing, err := s.styleRepo.GetByNumber(req.StyleNumber)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("style number already exists")
	}

	// 创建款号
	style := &models.Style{
		StyleNumber: req.StyleNumber,
	}

	if err := s.styleRepo.Create(style); err != nil {
		return nil, fmt.Errorf("failed to create style: %w", err)
	}

	return style, nil
}

func (s *StyleService) GetStyle(id int) (*models.Style, error) {
	return s.styleRepo.GetByID(id)
}

func (s *StyleService) GetStyles() ([]*models.Style, error) {
	return s.styleRepo.GetAll()
}

func (s *StyleService) GetStyleByNumber(number string) (*models.Style, error) {
	return s.styleRepo.GetByNumber(number)
}