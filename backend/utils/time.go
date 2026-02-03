package utils

import (
	"fmt"
	"time"
)

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
