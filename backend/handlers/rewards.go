package handlers

import (
	"net/http"

	"github.com/Felipalds/go-pomodoro/database"
	"github.com/Felipalds/go-pomodoro/models"
	"github.com/Felipalds/go-pomodoro/services"
	"github.com/Felipalds/go-pomodoro/utils"
	"go.uber.org/zap"
)

type RewardHandler struct {
	Logger    *zap.Logger
	DDService *services.DataDragonService
}

// ClaimReward claims a reward for an activity
func (h *RewardHandler) ClaimReward(w http.ResponseWriter, r *http.Request) {
	var input struct {
		ActivityID uint `json:"activity_id"`
	}

	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check if activity exists
	var activity models.Activity
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", input.ActivityID).First(&activity).Error; err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Activity not found")
		return
	}

	// Calculate claimable rewards
	claimable, progress, totalMinutes, err := services.CalculateClaimableRewards(database.DB, input.ActivityID)
	if err != nil {
		h.Logger.Error("Failed to calculate claimable rewards", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to calculate rewards")
		return
	}

	if claimable <= 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		utils.EncodeJSON(w, map[string]interface{}{
			"error":                "No rewards available. Keep tracking time!",
			"next_reward_progress": progress,
		})
		return
	}

	// Generate reward based on total minutes (affects drop rates)
	result, err := services.GenerateReward(database.DB, h.DDService, totalMinutes)
	if err != nil || result == nil {
		h.Logger.Error("Failed to generate reward", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to generate reward")
		return
	}

	// Save reward to database
	reward := models.UserReward{
		RewardType: result.RewardType,
		ExternalID: result.ExternalID,
		Name:       result.Name,
		ImageURL:   result.ImageURL,
		Rarity:     result.Rarity,
	}

	if err := database.DB.Create(&reward).Error; err != nil {
		h.Logger.Error("Failed to save reward", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to save reward")
		return
	}

	// Increment intervals_rewarded for the activity
	activity.IntervalsRewarded++
	database.DB.Save(&activity)

	// Calculate remaining claimable
	intervalsRemaining := claimable - 1

	utils.SuccessResponse(w, map[string]interface{}{
		"reward": map[string]interface{}{
			"id":            reward.ID,
			"reward_type":   reward.RewardType,
			"external_id":   reward.ExternalID,
			"name":          reward.Name,
			"image_url":     reward.ImageURL,
			"rarity":        reward.Rarity,
			"is_duplicate":  result.IsDuplicate,
			"mastery_level": result.MasteryLevel,
		},
		"intervals_remaining": intervalsRemaining,
		"total_minutes":       totalMinutes,
	})
}

// GetRewards returns all user rewards and mastery info
func (h *RewardHandler) GetRewards(w http.ResponseWriter, r *http.Request) {
	// Get all rewards
	var rewards []models.UserReward
	if err := database.DB.Order("created_at DESC").Find(&rewards).Error; err != nil {
		h.Logger.Error("Failed to fetch rewards", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch rewards")
		return
	}

	// Get all mastery records
	var mastery []models.ChampionMastery
	if err := database.DB.Order("mastery_level DESC, times_obtained DESC").Find(&mastery).Error; err != nil {
		h.Logger.Error("Failed to fetch mastery", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch mastery")
		return
	}

	// Calculate stats
	championsCollected := len(mastery)
	maxMasteryChampions := 0
	for _, m := range mastery {
		if m.MasteryLevel >= 7 {
			maxMasteryChampions++
		}
	}

	utils.SuccessResponse(w, map[string]interface{}{
		"rewards": rewards,
		"mastery": mastery,
		"stats": map[string]interface{}{
			"total_rewards":         len(rewards),
			"champions_collected":   championsCollected,
			"max_mastery_champions": maxMasteryChampions,
		},
	})
}

// GetRewardStatus returns claimable rewards status
func (h *RewardHandler) GetRewardStatus(w http.ResponseWriter, r *http.Request) {
	activities, totalClaimable, err := services.GetAllClaimableRewards(database.DB)
	if err != nil {
		h.Logger.Error("Failed to get reward status", zap.Error(err))
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to get reward status")
		return
	}

	utils.SuccessResponse(w, map[string]interface{}{
		"total_claimable": totalClaimable,
		"activities":      activities,
	})
}
