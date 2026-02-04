package utils

import (
	"fmt"
	"time"
)

// GetPeriodDateRange returns start and end dates for a given period
func GetPeriodDateRange(period string) (start time.Time, end time.Time) {
	now := time.Now()
	end = now

	switch period {
	case "day":
		start = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "week":
		// Go back to Monday of current week
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7 // Sunday = 7
		}
		start = time.Date(now.Year(), now.Month(), now.Day()-(weekday-1), 0, 0, 0, 0, now.Location())
	case "month":
		start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	case "year":
		start = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
	default:
		// Default to week
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		start = time.Date(now.Year(), now.Month(), now.Day()-(weekday-1), 0, 0, 0, 0, now.Location())
	}

	return start, end
}

// CalculateDuration calculates the duration in seconds between start and end time
func CalculateDuration(start, end time.Time) int64 {
	return int64(end.Sub(start).Seconds())
}

// FormatDuration formats seconds to human readable format (e.g., "2h 30m", "45m", "1h 5m")
func FormatDuration(seconds int64) string {
	if seconds < 60 {
		return fmt.Sprintf("%ds", seconds)
	}

	minutes := seconds / 60
	hours := minutes / 60
	remainingMinutes := minutes % 60

	if hours > 0 {
		if remainingMinutes > 0 {
			return fmt.Sprintf("%dh %dm", hours, remainingMinutes)
		}
		return fmt.Sprintf("%dh", hours)
	}

	return fmt.Sprintf("%dm", minutes)
}
