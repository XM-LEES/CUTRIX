package database

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jmoiron/sqlx"
)

// RunMigrations runs all migration files in the migrations directory
func RunMigrations(db *sqlx.DB, migrationsPath string) error {
	// Create schema_migrations table if it doesn't exist
	createTableQuery := `
	CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(255) PRIMARY KEY,
		executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`
	
	if _, err := db.Exec(createTableQuery); err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	// Get list of migration files
	files, err := getMigrationFiles(migrationsPath)
	if err != nil {
		return fmt.Errorf("failed to get migration files: %w", err)
	}

	// Get already executed migrations
	executed, err := getExecutedMigrations(db)
	if err != nil {
		return fmt.Errorf("failed to get executed migrations: %w", err)
	}

	// Run pending migrations
	for _, file := range files {
		if strings.HasSuffix(file, ".down.sql") {
			continue // Skip down migrations
		}

		version := extractVersion(file)
		if _, exists := executed[version]; exists {
			fmt.Printf("Migration %s already executed, skipping\n", version)
			continue
		}

		fmt.Printf("Running migration: %s\n", file)
		if err := runMigrationFile(db, filepath.Join(migrationsPath, file), version); err != nil {
			return fmt.Errorf("failed to run migration %s: %w", file, err)
		}
	}

	return nil
}

func getMigrationFiles(migrationsPath string) ([]string, error) {
	var files []string
	
	err := filepath.WalkDir(migrationsPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		
		if !d.IsDir() && strings.HasSuffix(d.Name(), ".up.sql") {
			files = append(files, d.Name())
		}
		return nil
	})
	
	if err != nil {
		return nil, err
	}
	
	sort.Strings(files)
	return files, nil
}

func getExecutedMigrations(db *sqlx.DB) (map[string]bool, error) {
	executed := make(map[string]bool)
	
	rows, err := db.Query("SELECT version FROM schema_migrations")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		executed[version] = true
	}
	
	return executed, nil
}

func extractVersion(filename string) string {
	// Extract version from filename like "000001_initial_schema.up.sql"
	parts := strings.Split(filename, "_")
	if len(parts) > 0 {
		return parts[0]
	}
	return filename
}

func runMigrationFile(db *sqlx.DB, filePath, version string) error {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}
	
	// Execute migration in a transaction
	tx, err := db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	
	// Execute the migration SQL
	if _, err := tx.Exec(string(content)); err != nil {
		return err
	}
	
	// Record the migration as executed
	if _, err := tx.Exec("INSERT INTO schema_migrations (version) VALUES ($1)", version); err != nil {
		return err
	}
	
	return tx.Commit()
}