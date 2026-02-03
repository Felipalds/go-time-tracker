package main

import (
	"github.com/Felipalds/go-pomodoro/database"
	"go.uber.org/zap"
)

func main() {
	// Initialize logger
	logger, err := zap.NewDevelopment()
	if err != nil {
		panic("Failed to initialize logger: " + err.Error())
	}
	defer logger.Sync()

	logger.Info("Starting Time Tracker application...")

	// Initialize database
	if err := database.Initialize(logger); err != nil {
		logger.Fatal("Failed to initialize database", zap.Error(err))
	}
	defer database.Close(logger)

	logger.Info("Application started successfully")
	logger.Info("Database is ready. Press Ctrl+C to exit.")

	// Keep the application running
	select {}
}
