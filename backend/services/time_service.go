package services

import (
	"github.com/Felipalds/go-pomodoro/models"
	"github.com/Felipalds/go-pomodoro/utils"
	"gorm.io/gorm"
)

// ActivityStats holds statistics for an activity
type ActivityStats struct {
	TotalSeconds int64 `json:"total_seconds"`
	EntryCount   int64 `json:"entry_count"`
}

// GetActivityStats calculates total time and entry count for an activity
func GetActivityStats(db *gorm.DB, activityID uint) (*ActivityStats, error) {
	var entries []models.TimeEntry

	// Get all completed time entries for this activity
	err := db.Where("activity_id = ? AND end_time IS NOT NULL", activityID).Find(&entries).Error
	if err != nil {
		return nil, err
	}

	stats := &ActivityStats{
		TotalSeconds: 0,
		EntryCount:   int64(len(entries)),
	}

	// Calculate total duration
	for _, entry := range entries {
		if entry.EndTime != nil {
			duration := utils.CalculateDuration(entry.StartTime, *entry.EndTime)
			stats.TotalSeconds += duration
		}
	}

	return stats, nil
}
