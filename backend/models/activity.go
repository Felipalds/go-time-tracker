package models

import "time"

// Activity represents a trackable activity with categories and tags
// Supports soft delete via DeletedAt field
type Activity struct {
	ID                uint        `gorm:"primaryKey" json:"id"`
	Name              string      `gorm:"not null" json:"name"`
	MainCategoryID    uint        `gorm:"not null;index" json:"main_category_id"`
	MainCategory      Category    `gorm:"foreignKey:MainCategoryID" json:"main_category,omitempty"`
	SubCategoryID     *uint       `gorm:"index" json:"sub_category_id,omitempty"`
	SubCategory       *Category   `gorm:"foreignKey:SubCategoryID" json:"sub_category,omitempty"`
	IntervalsRewarded int         `gorm:"default:0" json:"intervals_rewarded"` // 15-min intervals already rewarded for LoL rewards
	DeletedAt         *time.Time  `gorm:"index" json:"deleted_at,omitempty"`   // Soft delete
	CreatedAt         time.Time   `json:"created_at"`
	UpdatedAt         time.Time   `json:"updated_at"`
	TimeEntries       []TimeEntry `gorm:"constraint:OnDelete:CASCADE;" json:"time_entries,omitempty"`
	Tags              []Tag       `gorm:"many2many:activity_tags;" json:"tags,omitempty"`
}
