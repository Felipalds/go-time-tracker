package services

import (
	"math/rand"

	"github.com/Felipalds/go-pomodoro/models"
	"gorm.io/gorm"
)

// RewardResult represents the result of spinning the roulette
type RewardResult struct {
	RewardType   models.RewardType
	ExternalID   string
	Name         string
	ImageURL     string
	Rarity       models.Rarity
	IsDuplicate  bool
	MasteryLevel int
}

// TimeMilestone represents minutes tracked for drop rate calculation
type TimeMilestone int

const (
	Milestone15Min  TimeMilestone = 15
	Milestone30Min  TimeMilestone = 30
	Milestone45Min  TimeMilestone = 45
	Milestone60Min  TimeMilestone = 60
	Milestone120Min TimeMilestone = 120
)

// DropRates defines the percentage chance for each reward type
type DropRates struct {
	Item     int // Common items
	Champion int // Champions
	Skin     int // Skins (rarity varies by milestone)
	Icon     int // Profile icons
}

// GetDropRatesForMinutes returns drop rates based on total minutes tracked
// 15 min: mostly items, tiny skin chance
// 30 min: mostly champions, small skin chance
// 45 min: balanced, moderate skin chance
// 60 min: good skin chance
// 120+ min: high skin chance
func GetDropRatesForMinutes(totalMinutes int) DropRates {
	switch {
	case totalMinutes >= 120:
		// 120+ min: 10% item, 15% champion, 65% skin, 10% icon
		return DropRates{Item: 10, Champion: 25, Skin: 55, Icon: 10}
	case totalMinutes >= 60:
		// 60 min: 15% item, 25% champion, 45% skin, 15% icon
		return DropRates{Item: 15, Champion: 30, Skin: 40, Icon: 15}
	case totalMinutes >= 45:
		// 45 min: 25% item, 35% champion, 25% skin, 15% icon
		return DropRates{Item: 25, Champion: 35, Skin: 25, Icon: 15}
	case totalMinutes >= 30:
		// 30 min: 30% item, 50% champion, 10% skin, 10% icon
		return DropRates{Item: 30, Champion: 50, Skin: 10, Icon: 10}
	default:
		// 15 min: 60% item, 25% champion, 5% skin, 10% icon
		return DropRates{Item: 60, Champion: 25, Skin: 5, Icon: 10}
	}
}

// SpinRoulette determines what type of reward the user gets based on time milestone
func SpinRoulette(totalMinutes int) models.RewardType {
	rates := GetDropRatesForMinutes(totalMinutes)
	roll := rand.Intn(100)

	switch {
	case roll < rates.Item:
		return models.RewardTypeItem
	case roll < rates.Item+rates.Champion:
		return models.RewardTypeChampion
	case roll < rates.Item+rates.Champion+rates.Skin:
		return models.RewardTypeSkin
	default:
		return models.RewardTypeIcon
	}
}

// GetRarityForType returns the rarity for a given reward type
func GetRarityForType(rewardType models.RewardType) models.Rarity {
	switch rewardType {
	case models.RewardTypeChampion:
		return models.RarityCommon
	case models.RewardTypeItem:
		return models.RarityCommon
	case models.RewardTypeSkin:
		return models.RarityRare
	case models.RewardTypeIcon:
		return models.RarityEpic
	default:
		return models.RarityCommon
	}
}

// GenerateReward spins the roulette and generates a reward
// totalMinutes is used to determine drop rates
func GenerateReward(db *gorm.DB, ddService *DataDragonService, userID uint, totalMinutes int) (*RewardResult, error) {
	rewardType := SpinRoulette(totalMinutes)
	rarity := GetRarityForType(rewardType)

	var result RewardResult
	result.RewardType = rewardType
	result.Rarity = rarity

	switch rewardType {
	case models.RewardTypeChampion:
		champ := ddService.GetRandomChampion()
		if champ == nil {
			return nil, nil
		}
		result.ExternalID = champ.ID
		result.Name = champ.Name
		result.ImageURL = ddService.GetChampionImageURL(champ.ID)

		// Check for duplicate and update mastery
		var mastery models.ChampionMastery
		err := db.Where("user_id = ? AND champion_id = ?", userID, champ.ID).First(&mastery).Error
		if err == nil {
			// Duplicate - update mastery
			result.IsDuplicate = true
			mastery.TimesObtained++
			mastery.MasteryLevel = mastery.GetMasteryLevel()
			db.Save(&mastery)
			result.MasteryLevel = mastery.MasteryLevel
		} else {
			// New champion - create mastery record
			result.IsDuplicate = false
			result.MasteryLevel = 1
			mastery = models.ChampionMastery{
				UserID:        userID,
				ChampionID:    champ.ID,
				ChampionName:  champ.Name,
				ImageURL:      result.ImageURL,
				MasteryLevel:  1,
				TimesObtained: 1,
			}
			db.Create(&mastery)
		}

	case models.RewardTypeItem:
		item := ddService.GetRandomItem()
		if item == nil {
			return nil, nil
		}
		result.ExternalID = item.ID
		result.Name = item.Name
		result.ImageURL = ddService.GetItemImageURL(item.ID)

	case models.RewardTypeSkin:
		skin := ddService.GetRandomSkin()
		if skin == nil {
			return nil, nil
		}
		result.ExternalID = skin.ChampionID + "_" + string(rune(skin.SkinNum+'0'))
		result.Name = skin.Name
		result.ImageURL = ddService.GetSkinImageURL(skin.ChampionID, skin.SkinNum)

	case models.RewardTypeIcon:
		icon := ddService.GetRandomIcon()
		if icon == nil {
			return nil, nil
		}
		result.ExternalID = icon.ID
		result.Name = "Icon #" + icon.ID
		result.ImageURL = ddService.GetIconImageURL(icon.ID)
	}

	return &result, nil
}

const RewardIntervalSeconds = 15 * 60 // 15 minutes in seconds

// CalculateClaimableRewards calculates how many rewards an activity can claim
// Returns: claimable count, progress to next (0.0-1.0), total minutes, error
func CalculateClaimableRewards(db *gorm.DB, activityID uint) (int, float64, int, error) {
	// Get total seconds for this activity
	var totalSeconds int64
	err := db.Table("time_entries").
		Select("COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER), 0)").
		Where("activity_id = ? AND end_time IS NOT NULL", activityID).
		Scan(&totalSeconds).Error
	if err != nil {
		return 0, 0, 0, err
	}

	// Get activity's intervals_rewarded
	var activity models.Activity
	if err := db.First(&activity, activityID).Error; err != nil {
		return 0, 0, 0, err
	}

	totalIntervals := int(totalSeconds / RewardIntervalSeconds)
	claimable := totalIntervals - activity.IntervalsRewarded
	totalMinutes := int(totalSeconds / 60)

	// Progress to next interval (0.0 - 1.0)
	remainingSeconds := totalSeconds % RewardIntervalSeconds
	progress := float64(remainingSeconds) / float64(RewardIntervalSeconds)

	if claimable < 0 {
		claimable = 0
	}

	return claimable, progress, totalMinutes, nil
}

// GetAllClaimableRewards returns claimable rewards across all activities for a user
func GetAllClaimableRewards(db *gorm.DB, userID uint) ([]map[string]interface{}, int, error) {
	var activities []models.Activity
	if err := db.Where("user_id = ? AND deleted_at IS NULL", userID).Find(&activities).Error; err != nil {
		return nil, 0, err
	}

	var results []map[string]interface{}
	totalClaimable := 0

	for _, activity := range activities {
		claimable, progress, totalMinutes, err := CalculateClaimableRewards(db, activity.ID)
		if err != nil {
			continue
		}

		if claimable > 0 || progress > 0 {
			results = append(results, map[string]interface{}{
				"activity_id":        activity.ID,
				"activity_name":      activity.Name,
				"total_minutes":      totalMinutes,
				"intervals_rewarded": activity.IntervalsRewarded,
				"claimable":          claimable,
				"progress_to_next":   progress,
			})
		}

		totalClaimable += claimable
	}

	return results, totalClaimable, nil
}
