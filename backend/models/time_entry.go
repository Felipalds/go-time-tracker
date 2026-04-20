package models

import "time"

// TimeEntry represents a time tracking session for an activity
// EndTime is NULL when timer is still running
// PlannedDuration is NULL for free-running timers
// PausedAt is NULL when timer is not paused
type TimeEntry struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	UserID          uint       `gorm:"not null;index" json:"user_id"`
	ActivityID      uint       `gorm:"not null;index" json:"activity_id"`
	Activity        Activity   `gorm:"foreignKey:ActivityID" json:"activity,omitempty"`
	StartTime       time.Time  `gorm:"not null;index" json:"start_time"`
	EndTime         *time.Time `gorm:"index" json:"end_time,omitempty"`
	PlannedDuration *int       `gorm:"type:integer" json:"planned_duration,omitempty"` // Duration in seconds, NULL = free-running
	PausedAt        *time.Time `gorm:"index" json:"paused_at,omitempty"`               // When timer was paused, NULL = not paused
	PausedDuration  int        `gorm:"default:0" json:"paused_duration"`               // Cumulative seconds paused
	Notes           *string    `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}
