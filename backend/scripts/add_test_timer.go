package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/Felipalds/go-pomodoro/database"
	"github.com/Felipalds/go-pomodoro/models"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

// ============================================
// EDIT THESE VALUES FOR YOUR TEST
// ============================================

var (
	// User ID (check your database for your user ID)
	userID = uint(1)

	// Activity details
	activityName     = "Test Activity"
	mainCategoryName = "Work"
	subCategoryName  = "" // Leave empty if no subcategory

	// Time entry duration
	// Duration in HOURS (e.g., 1.5 = 1 hour 30 minutes)
	durationHours = 1.0

	// How long ago did the activity START?
	// hoursAgo = 2.0 means the activity started 2 hours ago
	hoursAgo = 2.0
)

// ============================================
// SCRIPT LOGIC (don't need to edit below)
// ============================================

func main() {
	// Load .env file
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize logger
	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	// Initialize database
	if err := database.Initialize(logger); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	fmt.Println("🚀 Adding test time entry...")
	fmt.Println("=====================================")
	fmt.Printf("User ID:        %d\n", userID)
	fmt.Printf("Activity:       %s\n", activityName)
	fmt.Printf("Category:       %s\n", mainCategoryName)
	fmt.Printf("Duration:       %.2f hours\n", durationHours)
	fmt.Printf("Started:        %.2f hours ago\n", hoursAgo)
	fmt.Println("=====================================")

	// Check if user exists
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		log.Fatalf("❌ User with ID %d not found. Please check your user ID in the database.", userID)
	}
	fmt.Printf("✓ User found: %s (%s)\n", user.Name, user.Email)

	// Find or create main category
	var mainCategory models.Category
	if err := database.DB.Where("LOWER(name) = LOWER(?)", mainCategoryName).First(&mainCategory).Error; err != nil {
		mainCategory = models.Category{Name: mainCategoryName}
		if err := database.DB.Create(&mainCategory).Error; err != nil {
			log.Fatal("Failed to create main category:", err)
		}
		fmt.Printf("✓ Created category: %s\n", mainCategoryName)
	} else {
		fmt.Printf("✓ Found existing category: %s\n", mainCategoryName)
	}

	// Find or create subcategory (if specified)
	var subCategoryID *uint
	if subCategoryName != "" {
		var subCategory models.Category
		if err := database.DB.Where("LOWER(name) = LOWER(?)", subCategoryName).First(&subCategory).Error; err != nil {
			subCategory = models.Category{Name: subCategoryName}
			if err := database.DB.Create(&subCategory).Error; err != nil {
				log.Fatal("Failed to create subcategory:", err)
			}
			fmt.Printf("✓ Created subcategory: %s\n", subCategoryName)
		} else {
			fmt.Printf("✓ Found existing subcategory: %s\n", subCategoryName)
		}
		subCategoryID = &subCategory.ID
	}

	// Find or create activity
	var activity models.Activity
	err := database.DB.Where("name = ? AND user_id = ? AND deleted_at IS NULL", activityName, userID).First(&activity).Error
	if err != nil {
		// Create new activity
		activity = models.Activity{
			UserID:         userID,
			Name:           activityName,
			MainCategoryID: mainCategory.ID,
			SubCategoryID:  subCategoryID,
		}
		if err := database.DB.Create(&activity).Error; err != nil {
			log.Fatal("Failed to create activity:", err)
		}
		fmt.Printf("✓ Created new activity: %s (ID: %d)\n", activityName, activity.ID)
	} else {
		fmt.Printf("✓ Using existing activity: %s (ID: %d)\n", activityName, activity.ID)
	}

	// Calculate times
	endTime := time.Now().Add(-time.Duration(hoursAgo-durationHours) * time.Hour)
	startTime := endTime.Add(-time.Duration(durationHours) * time.Hour)

	// Create time entry
	timeEntry := models.TimeEntry{
		UserID:     userID,
		ActivityID: activity.ID,
		StartTime:  startTime,
		EndTime:    &endTime,
	}

	if err := database.DB.Create(&timeEntry).Error; err != nil {
		log.Fatal("Failed to create time entry:", err)
	}

	duration := endTime.Sub(startTime)
	fmt.Println("\n✅ SUCCESS! Time entry created:")
	fmt.Printf("   ID:         %d\n", timeEntry.ID)
	fmt.Printf("   Start:      %s\n", startTime.Format("2006-01-02 15:04:05"))
	fmt.Printf("   End:        %s\n", endTime.Format("2006-01-02 15:04:05"))
	fmt.Printf("   Duration:   %s (%.2f hours)\n", formatDuration(duration), duration.Hours())
	fmt.Println("\n🎉 You can now see this entry in your app!")
}

func formatDuration(d time.Duration) string {
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60

	if hours > 0 {
		return fmt.Sprintf("%dh %dm %ds", hours, minutes, seconds)
	}
	if minutes > 0 {
		return fmt.Sprintf("%dm %ds", minutes, seconds)
	}
	return fmt.Sprintf("%ds", seconds)
}
