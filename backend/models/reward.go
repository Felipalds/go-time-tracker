package models

import "time"

// RewardType represents the type of LoL reward
type RewardType string

const (
	RewardTypeChampion RewardType = "champion"
	RewardTypeItem     RewardType = "item"
	RewardTypeSkin     RewardType = "skin"
	RewardTypeIcon     RewardType = "icon"
)

// Rarity represents the rarity tier of a reward
type Rarity string

const (
	RarityCommon Rarity = "common"
	RarityRare   Rarity = "rare"
	RarityEpic   Rarity = "epic"
)

// UserReward stores all rewards earned by the user
type UserReward struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	RewardType RewardType `gorm:"not null" json:"reward_type"`
	ExternalID string     `gorm:"not null" json:"external_id"` // e.g., 'Ahri', '3031', 'Ahri_1'
	Name       string     `gorm:"not null" json:"name"`
	ImageURL   string     `gorm:"not null" json:"image_url"`
	Rarity     Rarity     `gorm:"not null" json:"rarity"`
	CreatedAt  time.Time  `json:"created_at"`
}

// ChampionMastery tracks mastery level for each champion
type ChampionMastery struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	ChampionID    string    `gorm:"not null;uniqueIndex" json:"champion_id"` // e.g., 'Ahri'
	ChampionName  string    `gorm:"not null" json:"champion_name"`
	ImageURL      string    `gorm:"not null" json:"image_url"`
	MasteryLevel  int       `gorm:"default:1" json:"mastery_level"` // 1-7
	TimesObtained int       `gorm:"default:1" json:"times_obtained"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// GetMasteryLevel calculates mastery level based on times obtained
func (cm *ChampionMastery) GetMasteryLevel() int {
	if cm.TimesObtained >= 7 {
		return 7
	}
	return cm.TimesObtained
}
