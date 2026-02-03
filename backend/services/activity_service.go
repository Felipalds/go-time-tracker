package services

import (
	"strings"

	"github.com/Felipalds/go-pomodoro/models"
	"gorm.io/gorm"
)

// FindOrCreateCategory finds a category by name (case-insensitive) or creates it
func FindOrCreateCategory(db *gorm.DB, name string) (*models.Category, error) {
	// Trim whitespace
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, gorm.ErrRecordNotFound
	}

	var category models.Category

	// Try to find existing category (case-insensitive, not deleted)
	err := db.Where("LOWER(name) = LOWER(?) AND deleted_at IS NULL", name).First(&category).Error

	if err == nil {
		// Found existing category
		return &category, nil
	}

	if err == gorm.ErrRecordNotFound {
		// Category doesn't exist, create it
		category = models.Category{Name: name}
		if err := db.Create(&category).Error; err != nil {
			return nil, err
		}
		return &category, nil
	}

	// Other error occurred
	return nil, err
}

// FindOrCreateTag finds a tag by name (case-insensitive) or creates it
func FindOrCreateTag(db *gorm.DB, name string) (*models.Tag, error) {
	// Trim whitespace
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, gorm.ErrRecordNotFound
	}

	var tag models.Tag

	// Try to find existing tag (case-insensitive, not deleted)
	err := db.Where("LOWER(name) = LOWER(?) AND deleted_at IS NULL", name).First(&tag).Error

	if err == nil {
		// Found existing tag
		return &tag, nil
	}

	if err == gorm.ErrRecordNotFound {
		// Tag doesn't exist, create it
		tag = models.Tag{Name: name}
		if err := db.Create(&tag).Error; err != nil {
			return nil, err
		}
		return &tag, nil
	}

	// Other error occurred
	return nil, err
}
