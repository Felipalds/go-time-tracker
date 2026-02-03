package models

import "time"

// Tag represents a tag for flexible activity organization
// Tags have many-to-many relationship with activities
// Supports soft delete via DeletedAt field
type Tag struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	Name       string     `gorm:"not null;unique" json:"name"`
	DeletedAt  *time.Time `gorm:"index" json:"deleted_at,omitempty"` // Soft delete
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	Activities []Activity `gorm:"many2many:activity_tags;" json:"activities,omitempty"`
}
