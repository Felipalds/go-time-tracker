# League of Legends Rewards System

## Overview

For every **15 minutes of focused time** tracked in the app, the user earns a random League of Legends reward. Time is tracked **per activity** - when an activity reaches 15 minutes total, it earns a reward. At 30 minutes, another reward, and so on.

**Key Rule:** Only NEW intervals count. Previously tracked time before this feature doesn't generate rewards.

## Reward Types & Drop Rates

Drop rates vary based on **total time tracked in the session**. Longer sessions = better rewards!

### Drop Rate by Time Milestone

| Time Tracked | Item | Champion | Skin | Icon |
|--------------|------|----------|------|------|
| 15 min | 60% | 25% | 5% | 10% |
| 30 min | 30% | 50% | 10% | 10% |
| 45 min | 25% | 35% | 25% | 15% |
| 60 min | 15% | 30% | 40% | 15% |
| 120+ min | 10% | 25% | 55% | 10% |

This encourages longer focus sessions by rewarding better drops!

### Rarity by Type
- **Item**: Common (gray border)
- **Champion**: Common (gray border) - upgrades with mastery
- **Skin**: Rare (blue border)
- **Icon**: Epic (purple border)

> Note: Monsters were skipped for Phase 1 implementation.

## Champion Mastery System

When the user receives a **duplicate champion**, it increases mastery:

| Times Obtained | Mastery Level | Visual |
|----------------|---------------|--------|
| 1 | Mastery 1 | Bronze badge |
| 2 | Mastery 2 | Bronze badge |
| 3 | Mastery 3 | Bronze badge |
| 4 | Mastery 4 | Silver badge |
| 5 | Mastery 5 | Silver badge |
| 6 | Mastery 6 | Gold badge |
| 7 | Mastery 7 | Gold badge (max) |

Duplicate items/skins/icons: Show count (e.g., "x3")

## Data Dragon API

Base URL: `https://ddragon.leagueoflegends.com`

### Endpoints Used

```
# Version list (get latest)
https://ddragon.leagueoflegends.com/api/versions.json

# All champions
https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json

# Champion details (for skins)
https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion/{championId}.json

# All items
https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/item.json

# Profile icons
https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/profileicon.json
```

### Image URLs

```
# Champion square icon
https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{championId}.png

# Champion splash art (for skins)
https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{championId}_{skinNum}.jpg

# Item icon
https://ddragon.leagueoflegends.com/cdn/{version}/img/item/{itemId}.png

# Profile icon
https://ddragon.leagueoflegends.com/cdn/{version}/img/profileicon/{iconId}.png
```

## Database Models

### UserReward Model

```go
type RewardType string
const (
    RewardTypeChampion RewardType = "champion"
    RewardTypeItem     RewardType = "item"
    RewardTypeSkin     RewardType = "skin"
    RewardTypeIcon     RewardType = "icon"
)

type Rarity string
const (
    RarityCommon Rarity = "common"
    RarityRare   Rarity = "rare"
    RarityEpic   Rarity = "epic"
)

type UserReward struct {
    ID         uint       `gorm:"primarykey"`
    RewardType RewardType `gorm:"type:varchar(20);not null"`
    ExternalID string     `gorm:"type:varchar(100);not null"`
    Name       string     `gorm:"type:varchar(100);not null"`
    ImageURL   string     `gorm:"type:varchar(500);not null"`
    Rarity     Rarity     `gorm:"type:varchar(20);not null"`
    CreatedAt  time.Time
}
```

### ChampionMastery Model

```go
type ChampionMastery struct {
    ID            uint   `gorm:"primarykey"`
    ChampionID    string `gorm:"type:varchar(100);uniqueIndex;not null"`
    ChampionName  string `gorm:"type:varchar(100);not null"`
    ImageURL      string `gorm:"type:varchar(500);not null"`
    MasteryLevel  int    `gorm:"default:1"`
    TimesObtained int    `gorm:"default:1"`
    CreatedAt     time.Time
    UpdatedAt     time.Time
}
```

### Activity Model Update

Added field to track rewarded intervals:

```go
IntervalsRewarded int `gorm:"default:0" json:"intervals_rewarded"` // 15-min intervals already rewarded
```

## Backend API

### GET /api/rewards

Returns all user rewards and mastery info.

**Response:**
```json
{
    "rewards": [
        {
            "id": 1,
            "reward_type": "champion",
            "external_id": "Ahri",
            "name": "Ahri",
            "image_url": "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Ahri.png",
            "rarity": "common",
            "created_at": "2024-01-15T10:30:00Z"
        }
    ],
    "mastery": [
        {
            "champion_id": "Ahri",
            "champion_name": "Ahri",
            "image_url": "...",
            "mastery_level": 3,
            "times_obtained": 3
        }
    ]
}
```

### POST /api/rewards/claim

Claims a reward for an available 15-minute interval.

**Request:**
```json
{
    "activity_id": 1
}
```

**Response:**
```json
{
    "reward": {
        "id": 26,
        "reward_type": "champion",
        "external_id": "Jinx",
        "name": "Jinx",
        "image_url": "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Jinx.png",
        "rarity": "common",
        "is_duplicate": false,
        "mastery_level": 1
    },
    "intervals_remaining": 2
}
```

### GET /api/rewards/status

Quick check for claimable rewards across all activities.

**Response:**
```json
{
    "total_claimable": 3,
    "activities": [
        {
            "activity_id": 1,
            "activity_name": "Coding",
            "claimable": 2
        }
    ]
}
```

## Backend Services

### Data Dragon Service (`backend/services/datadragon.go`)

- Fetches and caches latest game version
- Fetches all champions, items, and profile icons
- Fetches champion skins from detailed champion data
- Returns random items for reward selection

### Reward Service (`backend/services/rewards.go`)

Key function for drop rates:

```go
func GetDropRatesForMinutes(totalMinutes int) DropRates {
    switch {
    case totalMinutes >= 120:
        return DropRates{Item: 10, Champion: 25, Skin: 55, Icon: 10}
    case totalMinutes >= 60:
        return DropRates{Item: 15, Champion: 30, Skin: 40, Icon: 15}
    case totalMinutes >= 45:
        return DropRates{Item: 25, Champion: 35, Skin: 25, Icon: 15}
    case totalMinutes >= 30:
        return DropRates{Item: 30, Champion: 50, Skin: 10, Icon: 10}
    default: // 15 min
        return DropRates{Item: 60, Champion: 25, Skin: 5, Icon: 10}
    }
}
```

## Frontend Components

### RewardIcon (`frontend/src/components/atoms/RewardIcon.tsx`)
- Displays reward image with rarity-colored border
- Shows mastery badge for champions (M1-M7)
- Sizes: sm, md, lg

### RewardGrid (`frontend/src/components/molecules/RewardGrid.tsx`)
- 4x2 grid showing last 8 rewards
- Fixed width (188px) to not affect layout
- Click to open collection modal

### ClaimableBox (`frontend/src/components/molecules/ClaimableBox.tsx`)
- Golden box icon with count badge
- Sparkle animation when claimable
- Bounce animation on claim
- Disabled when timer is running

### RewardReveal (`frontend/src/components/molecules/RewardReveal.tsx`)
- Fullscreen overlay with reveal animation
- Shows reward with glow effect based on rarity
- "Mastery Up!" badge for duplicate champions
- Click anywhere to close

## File Structure

```
backend/
├── models/
│   └── reward.go           # UserReward, ChampionMastery models
├── services/
│   ├── datadragon.go       # Data Dragon API integration
│   └── rewards.go          # Reward spin logic
├── handlers/
│   └── rewards.go          # API handlers
└── cmd/
    └── seed_test/
        └── main.go         # Test script for 59:55 timer

frontend/src/
├── components/
│   ├── atoms/
│   │   └── RewardIcon.tsx
│   └── molecules/
│       ├── RewardGrid.tsx
│       ├── ClaimableBox.tsx
│       └── RewardReveal.tsx
└── interfaces/
    └── ChampionMastery.ts
```

## Technical Notes

- Data Dragon is free, no API key needed
- Champion/item data is cached in memory on first fetch
- Version is fetched from versions.json on startup
- Images served from Riot CDN
- 15-minute intervals chosen for faster gratification (vs 1 hour)
- Rewards can only be claimed when timer is stopped
- Each click claims ONE reward (more satisfying UX)
