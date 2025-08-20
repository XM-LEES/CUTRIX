package database

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
	"github.com/jmoiron/sqlx"
)

func Initialize(databaseURL string) (*sqlx.DB, error) {
	// 连接数据库
	db, err := sqlx.Connect("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// 配置连接池
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	// 测试连接
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// 运行数据库迁移
	migrationsPath := "./migrations"
	if err := RunMigrations(db, migrationsPath); err != nil {
		fmt.Printf("Warning: Failed to run migrations: %v\n", err)
		// Don't return error here, as the database might still be usable
	}

	fmt.Println("Database connection established successfully")
	return db, nil
}

func GetDB(databaseURL string) (*sql.DB, error) {
	return sql.Open("postgres", databaseURL)
}