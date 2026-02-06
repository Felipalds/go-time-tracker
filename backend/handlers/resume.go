package handlers

import (
	"net/http"

	"github.com/Felipalds/go-pomodoro/database"
	"github.com/Felipalds/go-pomodoro/middleware"
	"github.com/Felipalds/go-pomodoro/utils"
	"go.uber.org/zap"
)

type ResumeHandler struct {
	Logger *zap.Logger
}

type ActivityResume struct {
	ActivityID   uint    `json:"activity_id"`
	ActivityName string  `json:"activity_name"`
	TotalSeconds int64   `json:"total_seconds"`
	TotalTime    string  `json:"total_time"`
	EntryCount   int     `json:"entry_count"`
	Percentage   float64 `json:"percentage"`
}

type ResumeResponse struct {
	Period       string           `json:"period"`
	TotalSeconds int64            `json:"total_seconds"`
	TotalTime    string           `json:"total_time"`
	Activities   []ActivityResume `json:"activities"`
}

// GetResume returns the top 3 activities by time spent for a given period
func (h *ResumeHandler) GetResume(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r)

	period := r.URL.Query().Get("period")
	if period == "" {
		period = "week"
	}

	// Validate period
	validPeriods := map[string]bool{"day": true, "week": true, "month": true, "year": true}
	if !validPeriods[period] {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid period. Use: day, week, month, year")
		return
	}

	startDate, endDate := utils.GetPeriodDateRange(period)

	// Query to get activity totals within the period
	type ActivityTotal struct {
		ActivityID   uint
		ActivityName string
		TotalSeconds int64
		EntryCount   int
	}

	var activityTotals []ActivityTotal

	err := database.DB.Table("time_entries").
		Select(`
			time_entries.activity_id,
			activities.name as activity_name,
			SUM(CASE
				WHEN time_entries.end_time IS NOT NULL
				THEN EXTRACT(EPOCH FROM (time_entries.end_time - time_entries.start_time))::INTEGER
				ELSE 0
			END) as total_seconds,
			COUNT(time_entries.id) as entry_count
		`).
		Joins("JOIN activities ON activities.id = time_entries.activity_id").
		Where("time_entries.user_id = ?", userID).
		Where("time_entries.start_time >= ? AND time_entries.start_time <= ?", startDate, endDate).
		Where("time_entries.end_time IS NOT NULL").
		Where("activities.deleted_at IS NULL").
		Group("time_entries.activity_id").
		Order("total_seconds DESC").
		Limit(3).
		Scan(&activityTotals).Error

	if err != nil {
		h.Logger.Error("Failed to get resume data", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to get resume data")
		return
	}

	// Calculate total time across all activities in period (not just top 3)
	var overallTotal int64
	database.DB.Table("time_entries").
		Select(`
			SUM(CASE
				WHEN time_entries.end_time IS NOT NULL
				THEN EXTRACT(EPOCH FROM (time_entries.end_time - time_entries.start_time))::INTEGER
				ELSE 0
			END) as total
		`).
		Joins("JOIN activities ON activities.id = time_entries.activity_id").
		Where("time_entries.user_id = ?", userID).
		Where("time_entries.start_time >= ? AND time_entries.start_time <= ?", startDate, endDate).
		Where("time_entries.end_time IS NOT NULL").
		Where("activities.deleted_at IS NULL").
		Scan(&overallTotal)

	// Build response
	activities := make([]ActivityResume, 0, len(activityTotals))
	for _, at := range activityTotals {
		percentage := float64(0)
		if overallTotal > 0 {
			percentage = float64(at.TotalSeconds) / float64(overallTotal) * 100
		}

		activities = append(activities, ActivityResume{
			ActivityID:   at.ActivityID,
			ActivityName: at.ActivityName,
			TotalSeconds: at.TotalSeconds,
			TotalTime:    utils.FormatDuration(at.TotalSeconds),
			EntryCount:   at.EntryCount,
			Percentage:   percentage,
		})
	}

	response := ResumeResponse{
		Period:       period,
		TotalSeconds: overallTotal,
		TotalTime:    utils.FormatDuration(overallTotal),
		Activities:   activities,
	}

	utils.SuccessResponse(w, response)
}
