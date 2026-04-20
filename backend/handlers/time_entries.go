package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/Felipalds/go-pomodoro/database"
	"github.com/Felipalds/go-pomodoro/middleware"
	"github.com/Felipalds/go-pomodoro/models"
	"github.com/Felipalds/go-pomodoro/utils"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

type TimeEntryHandler struct {
	Logger *zap.Logger
}

// StartTimer starts a new timer for an activity (auto-stops any running timer)
func (h *TimeEntryHandler) StartTimer(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)

	var input struct {
		ActivityID      uint `json:"activity_id"`
		PlannedDuration *int `json:"planned_duration,omitempty"` // Duration in seconds, nullable
	}

	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate activity exists and belongs to user
	var activity models.Activity
	if err := database.DB.Where("id = ? AND user_id = ? AND deleted_at IS NULL", input.ActivityID, userID).First(&activity).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Activity not found")
		return
	}

	// Check for active timer for this user
	var activeTimer models.TimeEntry
	err := database.DB.Where("user_id = ? AND end_time IS NULL", userID).First(&activeTimer).Error

	var stoppedPrevious *map[string]interface{}

	// If there's an active timer, stop it
	if err == nil {
		now := time.Now()
		activeTimer.EndTime = &now
		database.DB.Save(&activeTimer)

		// Load activity name for response
		var prevActivity models.Activity
		database.DB.First(&prevActivity, activeTimer.ActivityID)

		duration := utils.CalculateDuration(activeTimer.StartTime, *activeTimer.EndTime)
		stoppedPrevious = &map[string]interface{}{
			"id":               activeTimer.ID,
			"activity_id":      activeTimer.ActivityID,
			"activity_name":    prevActivity.Name,
			"start_time":       activeTimer.StartTime,
			"end_time":         activeTimer.EndTime,
			"duration_seconds": duration,
		}

		h.Logger.Info("Auto-stopped previous timer", zap.Uint("entry_id", activeTimer.ID))
	}

	// Create new time entry
	newEntry := models.TimeEntry{
		UserID:          userID,
		ActivityID:      input.ActivityID,
		StartTime:       time.Now(),
		EndTime:         nil,
		PlannedDuration: input.PlannedDuration, // NEW: store planned duration
	}

	if err := database.DB.Create(&newEntry).Error; err != nil {
		h.Logger.Error("Failed to start timer", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to start timer")
		return
	}

	response := map[string]interface{}{
		"started_new": map[string]interface{}{
			"id":            newEntry.ID,
			"activity_id":   newEntry.ActivityID,
			"activity_name": activity.Name,
			"start_time":    newEntry.StartTime,
			"end_time":      nil,
			"status":        "running",
		},
	}

	if stoppedPrevious != nil {
		response["stopped_previous"] = *stoppedPrevious
	}

	utils.CreatedResponse(w, response)
}

// PauseTimer pauses the currently running timer
func (h *TimeEntryHandler) PauseTimer(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)

	var activeTimer models.TimeEntry
	err := database.DB.Where("user_id = ? AND end_time IS NULL", userID).First(&activeTimer).Error

	if err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "No active timer found")
		return
	}

	// Check if already paused
	if activeTimer.PausedAt != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Timer is already paused")
		return
	}

	// Pause the timer
	now := time.Now()
	activeTimer.PausedAt = &now

	if err := database.DB.Save(&activeTimer).Error; err != nil {
		h.Logger.Error("Failed to pause timer", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to pause timer")
		return
	}

	utils.SuccessResponse(w, map[string]interface{}{
		"status":    "paused",
		"paused_at": activeTimer.PausedAt,
	})
}

// ResumeTimer resumes a paused timer
func (h *TimeEntryHandler) ResumeTimer(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)

	var activeTimer models.TimeEntry
	err := database.DB.Where("user_id = ? AND end_time IS NULL", userID).First(&activeTimer).Error

	if err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "No active timer found")
		return
	}

	// Check if timer is paused
	if activeTimer.PausedAt == nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Timer is not paused")
		return
	}

	// Calculate pause duration and add to cumulative
	pauseDuration := int(time.Since(*activeTimer.PausedAt).Seconds())
	activeTimer.PausedDuration += pauseDuration
	activeTimer.PausedAt = nil

	if err := database.DB.Save(&activeTimer).Error; err != nil {
		h.Logger.Error("Failed to resume timer", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to resume timer")
		return
	}

	utils.SuccessResponse(w, map[string]interface{}{
		"status":          "running",
		"paused_duration": activeTimer.PausedDuration,
	})
}

// StopTimer stops the currently running timer
func (h *TimeEntryHandler) StopTimer(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)

	var activeTimer models.TimeEntry
	err := database.DB.Where("user_id = ? AND end_time IS NULL", userID).First(&activeTimer).Error

	if err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "No active timer found")
		return
	}

	// Stop the timer
	now := time.Now()
	activeTimer.EndTime = &now

	if err := database.DB.Save(&activeTimer).Error; err != nil {
		h.Logger.Error("Failed to stop timer", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to stop timer")
		return
	}

	// Load activity name
	var activity models.Activity
	database.DB.First(&activity, activeTimer.ActivityID)

	duration := utils.CalculateDuration(activeTimer.StartTime, *activeTimer.EndTime)

	utils.SuccessResponse(w, map[string]interface{}{
		"id":               activeTimer.ID,
		"activity_id":      activeTimer.ActivityID,
		"activity_name":    activity.Name,
		"start_time":       activeTimer.StartTime,
		"end_time":         activeTimer.EndTime,
		"duration_seconds": duration,
		"duration":         utils.FormatDuration(duration),
		"status":           "stopped",
	})
}

// GetActiveTimer returns the currently running timer if any
func (h *TimeEntryHandler) GetActiveTimer(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)

	var activeTimer models.TimeEntry
	err := database.DB.Preload("Activity").Where("user_id = ? AND end_time IS NULL", userID).First(&activeTimer).Error

	if err != nil {
		utils.SuccessResponse(w, map[string]interface{}{
			"active_timer": nil,
		})
		return
	}

	// Calculate elapsed time (excluding paused time)
	now := time.Now()
	elapsed := int(now.Sub(activeTimer.StartTime).Seconds())

	// Subtract cumulative pause duration
	elapsed -= activeTimer.PausedDuration

	// If currently paused, subtract current pause duration
	if activeTimer.PausedAt != nil {
		currentPauseDuration := int(now.Sub(*activeTimer.PausedAt).Seconds())
		elapsed -= currentPauseDuration
	}

	// Ensure elapsed is never negative
	if elapsed < 0 {
		elapsed = 0
	}

	utils.SuccessResponse(w, map[string]interface{}{
		"active_timer": map[string]interface{}{
			"id":               activeTimer.ID,
			"activity_id":      activeTimer.ActivityID,
			"activity_name":    activeTimer.Activity.Name,
			"start_time":       activeTimer.StartTime,
			"elapsed_seconds":  elapsed,
			"elapsed":          utils.FormatDuration(int64(elapsed)),
			"planned_duration": activeTimer.PlannedDuration,
			"paused_at":        activeTimer.PausedAt,
			"paused_duration":  activeTimer.PausedDuration,
			"status":           map[bool]string{true: "paused", false: "running"}[activeTimer.PausedAt != nil],
		},
	})
}

// DeleteTimeEntry deletes a time entry (for corrections)
func (h *TimeEntryHandler) DeleteTimeEntry(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid time entry ID")
		return
	}

	var entry models.TimeEntry
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&entry).Error; err != nil {
		h.Logger.Error("Time entry not found", zap.Uint64("id", id), zap.Error(err))
		utils.ErrorResponse(w, http.StatusNotFound, "Time entry not found")
		return
	}

	// Hard delete (not soft delete for time entries)
	if err := database.DB.Unscoped().Delete(&entry).Error; err != nil {
		h.Logger.Error("Failed to delete time entry", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete time entry")
		return
	}

	utils.SuccessResponse(w, map[string]string{
		"message": "Time entry deleted successfully",
	})
}
