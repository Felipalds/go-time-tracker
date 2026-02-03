package models

import "time"

// Category represents a category for organizing activities
// Categories can be used as both main categories and subcategories
// Supports soft delete via DeletedAt field
type Category struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	Name      string     `gorm:"not null;unique" json:"name"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"` // Soft delete
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}
