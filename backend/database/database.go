package database

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/Felipalds/go-pomodoro/models"
	"go.uber.org/zap"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Initialize sets up the database connection and runs migrations
func Initialize(logger *zap.Logger) error {
	var err error

	// Open SQLite database connection
	// The database file will be created in the backend directory
	DB, err = gorm.Open(sqlite.Open("timetracker.db"), &gorm.Config{})
	if err != nil {
		logger.Error("Failed to connect to database", zap.Error(err))
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	logger.Info("Database connection established")

	// Run auto-migration
	if err := runMigrations(logger); err != nil {
		return err
	}

	// Seed initial data
	if err := seedData(logger); err != nil {
		return err
	}

	logger.Info("Database initialized successfully")
	return nil
}

// runMigrations runs GORM auto-migration for all models
func runMigrations(logger *zap.Logger) error {
	logger.Info("Running database migrations...")

	err := DB.AutoMigrate(
		&models.Category{},
		&models.Tag{},
		&models.Activity{},
		&models.TimeEntry{},
	)

	if err != nil {
		logger.Error("Migration failed", zap.Error(err))
		return fmt.Errorf("migration failed: %w", err)
	}

	logger.Info("Migrations completed successfully")
	return nil
}

// seedData seeds initial data from SQL files if the database is empty
func seedData(logger *zap.Logger) error {
	logger.Info("Checking if seed data is needed...")

	// Check if categories already exist
	var count int64
	DB.Model(&models.Category{}).Count(&count)

	if count > 0 {
		logger.Info("Seed data already exists, skipping")
		return nil
	}

	logger.Info("Seeding initial data from SQL files...")

	// Read and execute the categories seed file
	seedFile := filepath.Join("database", "seeds", "initial_categories.sql")
	sqlContent, err := os.ReadFile(seedFile)
	if err != nil {
		logger.Error("Failed to read seed file", zap.String("file", seedFile), zap.Error(err))
		return fmt.Errorf("failed to read seed file %s: %w", seedFile, err)
	}

	// Execute the SQL
	if err := DB.Exec(string(sqlContent)).Error; err != nil {
		logger.Error("Failed to execute seed SQL", zap.Error(err))
		return fmt.Errorf("failed to execute seed SQL: %w", err)
	}

	// Count how many categories were inserted
	DB.Model(&models.Category{}).Count(&count)
	logger.Info("Seed data created successfully", zap.Int64("categories", count))

	return nil
}

// Close closes the database connection
func Close(logger *zap.Logger) error {
	sqlDB, err := DB.DB()
	if err != nil {
		logger.Error("Failed to get database instance", zap.Error(err))
		return err
	}

	if err := sqlDB.Close(); err != nil {
		logger.Error("Failed to close database", zap.Error(err))
		return err
	}

	logger.Info("Database connection closed")
	return nil
}
