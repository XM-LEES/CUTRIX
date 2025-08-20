package repositories

import (
	"database/sql"
	"fmt"

	"cutrix-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type FabricRepository interface {
	Create(roll *models.FabricRoll) error
	GetByID(id string) (*models.FabricRoll, error)
	GetByStyleID(styleID int) ([]*models.FabricRoll, error)
	GetByColor(color string) ([]*models.FabricRoll, error)
	GetByStatus(status string) ([]*models.FabricRoll, error)
	GetAll() ([]*models.FabricRoll, error)
	GetNextRollID(styleID int, color string) (string, error)
	UpdateStatus(rollID string, status string) error
}

type fabricRepository struct {
	db *sqlx.DB
}

func NewFabricRepository(db *sqlx.DB) FabricRepository {
	return &fabricRepository{db: db}
}

func (r *fabricRepository) Create(roll *models.FabricRoll) error {
	query := `INSERT INTO Fabric_Rolls (roll_id, style_id, color, registration_time, status) 
	          VALUES ($1, $2, $3, $4, $5)`
	
	_, err := r.db.Exec(query, roll.RollID, roll.StyleID, roll.Color, roll.RegistrationTime, roll.Status)
	if err != nil {
		return fmt.Errorf("failed to create fabric roll: %w", err)
	}
	
	return nil
}

func (r *fabricRepository) GetByID(id string) (*models.FabricRoll, error) {
	var roll models.FabricRoll
	query := `SELECT roll_id, style_id, color, registration_time, status FROM Fabric_Rolls WHERE roll_id = $1`
	
	err := r.db.Get(&roll, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("fabric roll not found")
		}
		return nil, fmt.Errorf("failed to get fabric roll: %w", err)
	}
	
	return &roll, nil
}

func (r *fabricRepository) GetByStyleID(styleID int) ([]*models.FabricRoll, error) {
	var rolls []*models.FabricRoll
	query := `SELECT roll_id, style_id, color, registration_time, status FROM Fabric_Rolls WHERE style_id = $1 ORDER BY registration_time`
	
	err := r.db.Select(&rolls, query, styleID)
	if err != nil {
		return nil, fmt.Errorf("failed to get fabric rolls: %w", err)
	}
	
	return rolls, nil
}

func (r *fabricRepository) GetByColor(color string) ([]*models.FabricRoll, error) {
	var rolls []*models.FabricRoll
	query := `SELECT roll_id, style_id, color, registration_time, status FROM Fabric_Rolls WHERE color = $1 ORDER BY registration_time`
	
	err := r.db.Select(&rolls, query, color)
	if err != nil {
		return nil, fmt.Errorf("failed to get fabric rolls: %w", err)
	}
	
	return rolls, nil
}

func (r *fabricRepository) GetByStatus(status string) ([]*models.FabricRoll, error) {
	var rolls []*models.FabricRoll
	query := `SELECT roll_id, style_id, color, registration_time, status FROM Fabric_Rolls WHERE status = $1 ORDER BY registration_time`
	
	err := r.db.Select(&rolls, query, status)
	if err != nil {
		return nil, fmt.Errorf("failed to get fabric rolls: %w", err)
	}
	
	return rolls, nil
}

func (r *fabricRepository) GetAll() ([]*models.FabricRoll, error) {
	var rolls []*models.FabricRoll
	query := `SELECT roll_id, style_id, color, registration_time, status FROM Fabric_Rolls ORDER BY registration_time`
	
	err := r.db.Select(&rolls, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get fabric rolls: %w", err)
	}
	
	return rolls, nil
}

func (r *fabricRepository) GetNextRollID(styleID int, color string) (string, error) {
	// 获取款号
	var styleNumber string
	err := r.db.Get(&styleNumber, "SELECT style_number FROM Styles WHERE style_id = $1", styleID)
	if err != nil {
		return "", fmt.Errorf("failed to get style number: %w", err)
	}
	
	// 获取该款号-颜色的最大序号
	var maxSeq int
	err = r.db.Get(&maxSeq, 
		`SELECT COALESCE(MAX(CAST(SPLIT_PART(roll_id, '-', 3) AS INTEGER)), 0) 
		 FROM Fabric_Rolls 
		 WHERE roll_id LIKE $1`, 
		fmt.Sprintf("%s-%s-%%", styleNumber, color))
	if err != nil {
		return "", fmt.Errorf("failed to get max sequence: %w", err)
	}
	
	// 生成新的roll_id
	nextSeq := maxSeq + 1
	rollID := fmt.Sprintf("%s-%s-%03d", styleNumber, color, nextSeq)
	
	return rollID, nil
}

func (r *fabricRepository) UpdateStatus(rollID string, status string) error {
	query := `UPDATE Fabric_Rolls SET status = $1 WHERE roll_id = $2`
	
	_, err := r.db.Exec(query, status, rollID)
	if err != nil {
		return fmt.Errorf("failed to update fabric roll status: %w", err)
	}
	
	return nil
}