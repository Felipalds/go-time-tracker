package services

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"sync"
	"time"
)

const (
	DataDragonBaseURL = "https://ddragon.leagueoflegends.com"
)

// DataDragonService handles fetching and caching LoL data
type DataDragonService struct {
	version    string
	champions  []ChampionData
	items      []ItemData
	icons      []IconData
	skins      []SkinData
	mu         sync.RWMutex
	lastUpdate time.Time
}

// ChampionData represents a LoL champion
type ChampionData struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Title string `json:"title"`
}

// ItemData represents a LoL item
type ItemData struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// IconData represents a profile icon
type IconData struct {
	ID string `json:"id"`
}

// SkinData represents a champion skin
type SkinData struct {
	ChampionID   string `json:"champion_id"`
	ChampionName string `json:"champion_name"`
	SkinNum      int    `json:"skin_num"`
	Name         string `json:"name"`
}

var ddService *DataDragonService
var ddOnce sync.Once

// GetDataDragonService returns the singleton Data Dragon service
func GetDataDragonService() *DataDragonService {
	ddOnce.Do(func() {
		ddService = &DataDragonService{}
		rand.Seed(time.Now().UnixNano())
	})
	return ddService
}

// Initialize fetches all data from Data Dragon
func (s *DataDragonService) Initialize() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Fetch latest version
	if err := s.fetchVersion(); err != nil {
		return fmt.Errorf("failed to fetch version: %w", err)
	}

	// Fetch champions
	if err := s.fetchChampions(); err != nil {
		return fmt.Errorf("failed to fetch champions: %w", err)
	}

	// Fetch items
	if err := s.fetchItems(); err != nil {
		return fmt.Errorf("failed to fetch items: %w", err)
	}

	// Fetch icons
	if err := s.fetchIcons(); err != nil {
		return fmt.Errorf("failed to fetch icons: %w", err)
	}

	// Fetch skins (requires champion data)
	if err := s.fetchSkins(); err != nil {
		return fmt.Errorf("failed to fetch skins: %w", err)
	}

	s.lastUpdate = time.Now()
	return nil
}

// fetchVersion gets the latest Data Dragon version
func (s *DataDragonService) fetchVersion() error {
	resp, err := http.Get(DataDragonBaseURL + "/api/versions.json")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var versions []string
	if err := json.NewDecoder(resp.Body).Decode(&versions); err != nil {
		return err
	}

	if len(versions) == 0 {
		return fmt.Errorf("no versions found")
	}

	s.version = versions[0]
	return nil
}

// fetchChampions gets all champions
func (s *DataDragonService) fetchChampions() error {
	url := fmt.Sprintf("%s/cdn/%s/data/en_US/champion.json", DataDragonBaseURL, s.version)
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result struct {
		Data map[string]struct {
			ID    string `json:"id"`
			Name  string `json:"name"`
			Title string `json:"title"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}

	s.champions = make([]ChampionData, 0, len(result.Data))
	for _, champ := range result.Data {
		s.champions = append(s.champions, ChampionData{
			ID:    champ.ID,
			Name:  champ.Name,
			Title: champ.Title,
		})
	}

	return nil
}

// fetchItems gets all items
func (s *DataDragonService) fetchItems() error {
	url := fmt.Sprintf("%s/cdn/%s/data/en_US/item.json", DataDragonBaseURL, s.version)
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result struct {
		Data map[string]struct {
			Name string `json:"name"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}

	s.items = make([]ItemData, 0, len(result.Data))
	for id, item := range result.Data {
		s.items = append(s.items, ItemData{
			ID:   id,
			Name: item.Name,
		})
	}

	return nil
}

// fetchIcons gets profile icons
func (s *DataDragonService) fetchIcons() error {
	url := fmt.Sprintf("%s/cdn/%s/data/en_US/profileicon.json", DataDragonBaseURL, s.version)
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result struct {
		Data map[string]interface{} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}

	s.icons = make([]IconData, 0, len(result.Data))
	for id := range result.Data {
		s.icons = append(s.icons, IconData{ID: id})
	}

	return nil
}

// fetchSkins gets all skins for all champions
func (s *DataDragonService) fetchSkins() error {
	s.skins = make([]SkinData, 0)

	// Fetch detailed data for each champion to get skins
	for _, champ := range s.champions {
		url := fmt.Sprintf("%s/cdn/%s/data/en_US/champion/%s.json", DataDragonBaseURL, s.version, champ.ID)
		resp, err := http.Get(url)
		if err != nil {
			continue // Skip on error
		}

		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			continue
		}

		var result struct {
			Data map[string]struct {
				Skins []struct {
					Num  int    `json:"num"`
					Name string `json:"name"`
				} `json:"skins"`
			} `json:"data"`
		}

		if err := json.Unmarshal(body, &result); err != nil {
			continue
		}

		for _, champData := range result.Data {
			for _, skin := range champData.Skins {
				// Skip default skin (num = 0)
				if skin.Num == 0 {
					continue
				}
				s.skins = append(s.skins, SkinData{
					ChampionID:   champ.ID,
					ChampionName: champ.Name,
					SkinNum:      skin.Num,
					Name:         skin.Name,
				})
			}
		}
	}

	return nil
}

// GetVersion returns the current Data Dragon version
func (s *DataDragonService) GetVersion() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.version
}

// GetRandomChampion returns a random champion
func (s *DataDragonService) GetRandomChampion() *ChampionData {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if len(s.champions) == 0 {
		return nil
	}

	return &s.champions[rand.Intn(len(s.champions))]
}

// GetRandomItem returns a random item
func (s *DataDragonService) GetRandomItem() *ItemData {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if len(s.items) == 0 {
		return nil
	}

	return &s.items[rand.Intn(len(s.items))]
}

// GetRandomIcon returns a random profile icon
func (s *DataDragonService) GetRandomIcon() *IconData {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if len(s.icons) == 0 {
		return nil
	}

	return &s.icons[rand.Intn(len(s.icons))]
}

// GetRandomSkin returns a random skin
func (s *DataDragonService) GetRandomSkin() *SkinData {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if len(s.skins) == 0 {
		return nil
	}

	return &s.skins[rand.Intn(len(s.skins))]
}

// GetChampionImageURL returns the image URL for a champion
func (s *DataDragonService) GetChampionImageURL(championID string) string {
	return fmt.Sprintf("%s/cdn/%s/img/champion/%s.png", DataDragonBaseURL, s.version, championID)
}

// GetItemImageURL returns the image URL for an item
func (s *DataDragonService) GetItemImageURL(itemID string) string {
	return fmt.Sprintf("%s/cdn/%s/img/item/%s.png", DataDragonBaseURL, s.version, itemID)
}

// GetIconImageURL returns the image URL for a profile icon
func (s *DataDragonService) GetIconImageURL(iconID string) string {
	return fmt.Sprintf("%s/cdn/%s/img/profileicon/%s.png", DataDragonBaseURL, s.version, iconID)
}

// GetSkinImageURL returns the splash art URL for a skin
func (s *DataDragonService) GetSkinImageURL(championID string, skinNum int) string {
	return fmt.Sprintf("%s/cdn/img/champion/splash/%s_%d.jpg", DataDragonBaseURL, championID, skinNum)
}

// GetStats returns statistics about cached data
func (s *DataDragonService) GetStats() map[string]int {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return map[string]int{
		"champions": len(s.champions),
		"items":     len(s.items),
		"icons":     len(s.icons),
		"skins":     len(s.skins),
	}
}
