package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/Felipalds/go-pomodoro/database"
	"github.com/Felipalds/go-pomodoro/middleware"
	"github.com/Felipalds/go-pomodoro/models"
	"github.com/Felipalds/go-pomodoro/services"
	"github.com/Felipalds/go-pomodoro/utils"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

type ActivityHandler struct {
	Logger *zap.Logger
}

// CreateActivityInput represents the input for creating an activity
type CreateActivityInput struct {
	Name             string   `json:"name"`
	MainCategoryName string   `json:"main_category_name"`
	SubCategoryName  *string  `json:"sub_category_name"`
	TagNames         []string `json:"tag_names"`
}

type ActivityWithStats struct {
	models.Activity
	TotalSeconds   int64      `json:"total_seconds"`
	TotalFormatted string     `json:"total_formatted"`
	EntryCount     int64      `json:"entry_count"`
	LastTracked    *time.Time `json:"last_tracked"`
}

// CreateActivity creates a new activity with auto-created categories/tags
func (h *ActivityHandler) CreateActivity(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)

	var input CreateActivityInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate activity name
	if len(input.Name) == 0 || len(input.Name) > 200 {
		utils.ErrorResponse(w, http.StatusBadRequest, "Activity name must be 1-200 characters")
		return
	}

	// Validate main category
	if input.MainCategoryName == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "Main category is required")
		return
	}

	// Find or create main category
	mainCategory, err := services.FindOrCreateCategory(database.DB, input.MainCategoryName)
	if err != nil {
		h.Logger.Error("Failed to find/create main category", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to process main category")
		return
	}

	// Find or create sub category (if provided)
	var subCategoryID *uint
	if input.SubCategoryName != nil && *input.SubCategoryName != "" {
		subCategory, err := services.FindOrCreateCategory(database.DB, *input.SubCategoryName)
		if err != nil {
			h.Logger.Error("Failed to find/create sub category", zap.Error(err))
			utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to process sub category")
			return
		}
		subCategoryID = &subCategory.ID
	}

	// Create the activity
	activity := models.Activity{
		UserID:         userID,
		Name:           input.Name,
		MainCategoryID: mainCategory.ID,
		SubCategoryID:  subCategoryID,
	}

	if err := database.DB.Create(&activity).Error; err != nil {
		h.Logger.Error("Failed to create activity", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create activity")
		return
	}

	// Find or create tags and associate them
	var tags []models.Tag
	for _, tagName := range input.TagNames {
		tag, err := services.FindOrCreateTag(database.DB, tagName)
		if err != nil {
			h.Logger.Error("Failed to find/create tag", zap.String("tag", tagName), zap.Error(err))
			continue // Skip this tag but continue with others
		}
		tags = append(tags, *tag)
	}

	// Associate tags with activity
	if len(tags) > 0 {
		if err := database.DB.Model(&activity).Association("Tags").Append(&tags); err != nil {
			h.Logger.Error("Failed to associate tags", zap.Error(err))
		}
	}

	// Load the complete activity with relationships
	database.DB.Preload("MainCategory").Preload("SubCategory").Preload("Tags").First(&activity, activity.ID)

	utils.CreatedResponse(w, activity)
}

// GetActivities returns all active activities
func (h *ActivityHandler) GetActivities(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)
	var activities []models.Activity

	// Get all activities that are not deleted, with relationships
	if err := database.DB.
		Preload("MainCategory").
		Preload("SubCategory").
		Preload("Tags").
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Find(&activities).Error; err != nil {
		h.Logger.Error("Failed to fetch activities", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch activities")
		return
	}

	utils.SuccessResponse(w, map[string]interface{}{
		"activities": activities,
	})
}

// GetActivity returns a single activity by ID with relationships
func (h *ActivityHandler) GetActivity(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid activity ID")
		return
	}

	var activity models.Activity
	if err := database.DB.
		Preload("MainCategory").
		Preload("SubCategory").
		Preload("Tags").
		Where("id = ? AND user_id = ? AND deleted_at IS NULL", id, userID).
		First(&activity).Error; err != nil {
		h.Logger.Error("Activity not found", zap.Uint64("id", id), zap.Error(err))
		utils.ErrorResponse(w, http.StatusNotFound, "Activity not found")
		return
	}

	utils.SuccessResponse(w, activity)
}

// UpdateActivity updates an activity
func (h *ActivityHandler) UpdateActivity(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid activity ID")
		return
	}

	var input CreateActivityInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate activity name
	if len(input.Name) == 0 || len(input.Name) > 200 {
		utils.ErrorResponse(w, http.StatusBadRequest, "Activity name must be 1-200 characters")
		return
	}

	var activity models.Activity
	if err := database.DB.Where("id = ? AND user_id = ? AND deleted_at IS NULL", id, userID).First(&activity).Error; err != nil {
		h.Logger.Error("Activity not found", zap.Uint64("id", id), zap.Error(err))
		utils.ErrorResponse(w, http.StatusNotFound, "Activity not found")
		return
	}

	// Update name
	activity.Name = input.Name

	// Find or create main category
	if input.MainCategoryName != "" {
		mainCategory, err := services.FindOrCreateCategory(database.DB, input.MainCategoryName)
		if err != nil {
			h.Logger.Error("Failed to find/create main category", zap.Error(err))
			utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to process main category")
			return
		}
		activity.MainCategoryID = mainCategory.ID
	}

	// Find or create sub category (if provided)
	if input.SubCategoryName != nil && *input.SubCategoryName != "" {
		subCategory, err := services.FindOrCreateCategory(database.DB, *input.SubCategoryName)
		if err != nil {
			h.Logger.Error("Failed to find/create sub category", zap.Error(err))
			utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to process sub category")
			return
		}
		activity.SubCategoryID = &subCategory.ID
	} else {
		activity.SubCategoryID = nil
	}

	// Save the activity
	if err := database.DB.Save(&activity).Error; err != nil {
		h.Logger.Error("Failed to update activity", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to update activity")
		return
	}

	// Update tags - replace all existing tags
	if input.TagNames != nil {
		// Clear existing tags
		database.DB.Model(&activity).Association("Tags").Clear()

		// Add new tags
		var tags []models.Tag
		for _, tagName := range input.TagNames {
			tag, err := services.FindOrCreateTag(database.DB, tagName)
			if err != nil {
				h.Logger.Error("Failed to find/create tag", zap.String("tag", tagName), zap.Error(err))
				continue
			}
			tags = append(tags, *tag)
		}

		if len(tags) > 0 {
			database.DB.Model(&activity).Association("Tags").Append(&tags)
		}
	}

	// Reload with relationships
	database.DB.Preload("MainCategory").Preload("SubCategory").Preload("Tags").First(&activity, activity.ID)

	utils.SuccessResponse(w, activity)
}

// DeleteActivity soft deletes an activity
func (h *ActivityHandler) DeleteActivity(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid activity ID")
		return
	}

	var activity models.Activity
	if err := database.DB.Where("id = ? AND user_id = ? AND deleted_at IS NULL", id, userID).First(&activity).Error; err != nil {
		h.Logger.Error("Activity not found", zap.Uint64("id", id), zap.Error(err))
		utils.ErrorResponse(w, http.StatusNotFound, "Activity not found")
		return
	}

	// Soft delete
	if err := database.DB.Delete(&activity).Error; err != nil {
		h.Logger.Error("Failed to delete activity", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete activity")
		return
	}

	utils.SuccessResponse(w, map[string]string{
		"message": "Activity deleted successfully",
	})
}

// GetActivityTime returns time entries and statistics for an activity
func (h *ActivityHandler) GetActivityTime(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid activity ID")
		return
	}

	var activity models.Activity
	if err := database.DB.Where("id = ? AND user_id = ? AND deleted_at IS NULL", id, userID).First(&activity).Error; err != nil {
		h.Logger.Error("Activity not found", zap.Uint64("id", id), zap.Error(err))
		utils.ErrorResponse(w, http.StatusNotFound, "Activity not found")
		return
	}

	// Get all time entries for this activity
	var entries []models.TimeEntry
	database.DB.Where("activity_id = ?", id).Order("start_time DESC").Find(&entries)

	// Calculate statistics
	stats, err := services.GetActivityStats(database.DB, uint(id))
	if err != nil {
		h.Logger.Error("Failed to get activity stats", zap.Error(err))
		stats = &services.ActivityStats{TotalSeconds: 0, EntryCount: 0}
	}

	// Format entries with duration
	type EntryWithDuration struct {
		ID              uint       `json:"id"`
		StartTime       time.Time  `json:"start_time"`
		EndTime         *time.Time `json:"end_time"`
		DurationSeconds *int64     `json:"duration_seconds"`
		Notes           *string    `json:"notes"`
	}

	var formattedEntries []EntryWithDuration
	for _, entry := range entries {
		formatted := EntryWithDuration{
			ID:        entry.ID,
			StartTime: entry.StartTime,
			EndTime:   entry.EndTime,
			Notes:     entry.Notes,
		}

		if entry.EndTime != nil {
			duration := utils.CalculateDuration(entry.StartTime, *entry.EndTime)
			formatted.DurationSeconds = &duration
		}

		formattedEntries = append(formattedEntries, formatted)
	}

	utils.SuccessResponse(w, map[string]interface{}{
		"activity_id":     activity.ID,
		"activity_name":   activity.Name,
		"total_seconds":   stats.TotalSeconds,
		"total_formatted": utils.FormatDuration(stats.TotalSeconds),
		"entry_count":     stats.EntryCount,
		"entries":         formattedEntries,
	})
}

// GetActivitiesStats returns all activities with their time statistics
func (h *ActivityHandler) GetActivitiesStats(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)
	var activities []models.Activity

	// Get all active activities with relationships
	if err := database.DB.
		Preload("MainCategory").
		Preload("SubCategory").
		Preload("Tags").
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Find(&activities).Error; err != nil {
		h.Logger.Error("Failed to fetch activities", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch activities")
		return
	}

	var result []ActivityWithStats
	for _, activity := range activities {
		stats, _ := services.GetActivityStats(database.DB, activity.ID)
		if stats == nil {
			stats = &services.ActivityStats{TotalSeconds: 0, EntryCount: 0}
		}

		// Get last tracked time
		var lastEntry models.TimeEntry
		err := database.DB.Where("activity_id = ? AND end_time IS NOT NULL", activity.ID).
			Order("end_time DESC").
			First(&lastEntry).Error

		activityStats := ActivityWithStats{
			Activity:       activity,
			TotalSeconds:   stats.TotalSeconds,
			TotalFormatted: utils.FormatDuration(stats.TotalSeconds),
			EntryCount:     stats.EntryCount,
		}

		if err == nil && lastEntry.EndTime != nil {
			activityStats.LastTracked = lastEntry.EndTime
		}

		result = append(result, activityStats)
	}

	utils.SuccessResponse(w, map[string]interface{}{
		"activities": result,
	})
}
