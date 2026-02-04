package main

import (
	"fmt"
	"time"

	"github.com/Felipalds/go-pomodoro/database"
	"github.com/Felipalds/go-pomodoro/models"
	"go.uber.org/zap"
)

func main() {
	logger, _ := zap.NewDevelopment()

	// Initialize database (runs migrations)
	if err := database.Initialize(logger); err != nil {
		panic("failed to initialize database: " + err.Error())
	}

	db := database.DB

	// Create test activity
	activity := models.Activity{
		Name:              "Test LoL Rewards",
		MainCategoryID:    1,
		IntervalsRewarded: 0,
	}
	db.Create(&activity)
	fmt.Printf("Created activity ID: %d\n", activity.ID)

	// Create time entry starting 14:55 ago (still running)
	// Will reach 15 min (first reward milestone) in ~5 seconds
	startTime := time.Now().Add(-14*time.Minute - 55*time.Second)
	entry := models.TimeEntry{
		ActivityID: activity.ID,
		StartTime:  startTime,
		EndTime:    nil, // Still running
	}
	db.Create(&entry)
	fmt.Printf("Created time entry ID: %d, started at: %s\n", entry.ID, startTime.Format("15:04:05"))
	fmt.Println("Timer is running! It will reach 15 minutes in ~5 seconds.")
	fmt.Println("Open the frontend and you should see an active timer.")
}
