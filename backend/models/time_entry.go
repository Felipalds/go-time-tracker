package models

import "time"

// TimeEntry represents a time tracking session for an activity
// EndTime is NULL when timer is still running
type TimeEntry struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	ActivityID uint       `gorm:"not null;index" json:"activity_id"`
	Activity   Activity   `gorm:"foreignKey:ActivityID" json:"activity,omitempty"`
	StartTime  time.Time  `gorm:"not null;index" json:"start_time"`
	EndTime    *time.Time `gorm:"index" json:"end_time,omitempty"`
	Notes      *string    `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}
