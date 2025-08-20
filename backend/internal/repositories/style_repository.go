package repositories

import (
	"database/sql"
	"fmt"

	"cutrix-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type StyleRepository interface {
	Create(style *models.Style) error
	GetByID(id int) (*models.Style, error)
	GetByNumber(number string) (*models.Style, error)
	GetAll() ([]*models.Style, error)
}

type styleRepository struct {
	db *sqlx.DB
}

func NewStyleRepository(db *sqlx.DB) StyleRepository {
	return &styleRepository{db: db}
}

func (r *styleRepository) Create(style *models.Style) error {
	query := `INSERT INTO Styles (style_number) VALUES ($1) RETURNING style_id`
	
	err := r.db.QueryRow(query, style.StyleNumber).Scan(&style.StyleID)
	if err != nil {
		return fmt.Errorf("failed to create style: %w", err)
	}
	
	return nil
}

func (r *styleRepository) GetByID(id int) (*models.Style, error) {
	var style models.Style
	query := `SELECT style_id, style_number FROM Styles WHERE style_id = $1`
	
	err := r.db.Get(&style, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("style not found")
		}
		return nil, fmt.Errorf("failed to get style: %w", err)
	}
	
	return &style, nil
}

func (r *styleRepository) GetByNumber(number string) (*models.Style, error) {
	var style models.Style
	query := `SELECT style_id, style_number FROM Styles WHERE style_number = $1`
	
	err := r.db.Get(&style, query, number)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("style not found")
		}
		return nil, fmt.Errorf("failed to get style: %w", err)
	}
	
	return &style, nil
}

func (r *styleRepository) GetAll() ([]*models.Style, error) {
	var styles []*models.Style
	query := `SELECT style_id, style_number FROM Styles ORDER BY style_id`
	
	err := r.db.Select(&styles, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get styles: %w", err)
	}
	
	return styles, nil
}