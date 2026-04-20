# Pause/Stop/Delete Timer Feature

## Current Behavior (Problem)

- Single button: Click timer → stops and finishes activity
- No way to pause temporarily
- No way to delete a timer entry
- Clicking timer always creates a completed time entry

## New Behavior (Solution)

### UI Changes

**When timer is running:**
```
┌─────────────────────────┐
│      Timer Display      │
│        12:45            │
│                         │
│   [PAUSE]  [STOP ▼]    │ ← Two separate buttons
└─────────────────────────┘
```

**PAUSE button:**
- Pauses the timer (keeps elapsed time)
- Backend sets timer to "paused" state
- Button changes to "RESUME" (the play button, which is above and in the middle of both new buttons as well must resume the counter)

**STOP button (with dropdown):**
- Click → opens dropdown with 2 options:
  - **STOP**: Finishes activity, saves time entry
  - **DELETE**: Deletes time entry completely

**When timer is paused:**
```
┌─────────────────────────┐
│      Timer Display      │
│        12:45 (PAUSED)   │
│                         │
│   [RESUME]  [STOP ▼]    │ ← Resume + Stop still available
└─────────────────────────┘
```

---

## Backend Changes

### 1. Database Migration

Add fields to `time_entries` table:

```sql
ALTER TABLE time_entries ADD COLUMN paused_at TIMESTAMP;
ALTER TABLE time_entries ADD COLUMN paused_duration INTEGER DEFAULT 0;
```

**Fields:**
- `paused_at`: Timestamp when timer was paused (NULL if not paused)
- `paused_duration`: Cumulative seconds the timer has been paused (for multiple pause/resume cycles)

**Paused time calculation:**
```
elapsed = (current_time - start_time) - paused_duration - (current_pause_time)
```

Where:
- `current_pause_time` = if paused_at is not NULL: `now - paused_at`, else 0

### 2. Update Model

**`backend/models/time_entry.go`**

```go
type TimeEntry struct {
    ID              uint       `gorm:"primaryKey"`
    UserID          uint       `gorm:"not null;index"`
    ActivityID      uint       `gorm:"not null;index"`
    Activity        Activity   `gorm:"foreignKey:ActivityID"`
    StartTime       time.Time  `gorm:"not null;index"`
    EndTime         *time.Time `gorm:"index"`
    PlannedDuration *int       `gorm:"type:integer"` // Duration in seconds
    PausedAt        *time.Time `gorm:"index"` // NEW: When timer was paused
    PausedDuration  int        `gorm:"default:0"` // NEW: Total seconds paused
    Notes           *string    `gorm:"type:text"`
    CreatedAt       time.Time
}
```

### 3. Add Endpoints

**New endpoint: `POST /time-entries/pause`**

```go
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
        "status": "paused",
        "paused_at": activeTimer.PausedAt,
    })
}
```

**New endpoint: `POST /time-entries/resume`**

```go
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
        "status": "running",
        "paused_duration": activeTimer.PausedDuration,
    })
}
```

**Update `GET /time-entries/active` to include pause info:**

```go
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

    utils.SuccessResponse(w, map[string]interface{}{
        "active_timer": map[string]interface{}{
            "id":               activeTimer.ID,
            "activity_id":      activeTimer.ActivityID,
            "activity_name":    activeTimer.Activity.Name,
            "start_time":       activeTimer.StartTime,
            "elapsed_seconds":  elapsed,
            "elapsed":          utils.FormatDuration(elapsed),
            "planned_duration": activeTimer.PlannedDuration,
            "paused_at":        activeTimer.PausedAt, // NEW
            "paused_duration":  activeTimer.PausedDuration, // NEW
            "status":           activeTimer.PausedAt != nil ? "paused" : "running",
        },
    })
}
```

**DELETE endpoint already exists:** `DELETE /time-entries/:id`

Just need to wire it up in routes:

```go
// In routes setup
r.Route("/time-entries", func(r chi.Router) {
    r.Use(middleware.AuthMiddleware)
    r.Get("/active", timeEntryHandler.GetActiveTimer)
    r.Post("/start", timeEntryHandler.StartTimer)
    r.Post("/stop", timeEntryHandler.StopTimer)
    r.Post("/pause", timeEntryHandler.PauseTimer)   // NEW
    r.Post("/resume", timeEntryHandler.ResumeTimer) // NEW
    r.Delete("/{id}", timeEntryHandler.DeleteTimeEntry) // Already exists
})
```

---

## Frontend Changes

### 1. Update Interface

**`frontend/src/interfaces/TimeEntry.ts`**

```ts
export interface ActiveTimer {
  id: number;
  activity_id: number;
  activity_name: string;
  start_time: string;
  planned_duration?: number | null;
  paused_at?: string | null; // NEW: ISO timestamp or null
  paused_duration?: number; // NEW: cumulative seconds paused
  status?: 'running' | 'paused'; // NEW: derived from paused_at
}
```

### 2. Update Service

**`frontend/src/services/timeEntryService.ts`**

```ts
export const timeEntryService = {
  getActive: () =>
    api.get<{ active_timer: ActiveTimer | null }>("/time-entries/active"),

  start: (activityId: number, plannedDuration?: number | null) =>
    api.post("/time-entries/start", {
      activity_id: activityId,
      ...(plannedDuration !== undefined && plannedDuration !== null && { planned_duration: plannedDuration }),
    }),

  pause: () => api.post("/time-entries/pause"), // NEW

  resume: () => api.post("/time-entries/resume"), // NEW

  stop: () => api.post("/time-entries/stop"),

  delete: (id: number) => api.delete(`/time-entries/${id}`), // NEW
};
```

### 3. Update Hooks

**`frontend/src/hooks/useTimeEntries.ts`**

```ts
export const usePauseTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => timeEntryService.pause(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
    },
  });
};

export const useResumeTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => timeEntryService.resume(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
    },
  });
};

export const useDeleteTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => timeEntryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
};
```

### 4. Update CircularTimer Component

**New props:**

```tsx
interface CircularTimerProps {
  isRunning: boolean;
  isPaused: boolean; // NEW
  isStarting: boolean;
  activityName: string | null;
  startTime: Date | null;
  plannedDuration?: number | null;
  onStart: () => void;
  onPause: () => void; // NEW
  onResume: () => void; // NEW
  onStop: () => void;
  onDelete: () => void; // NEW
}
```

**New UI:**

```tsx
// When running or paused, show PAUSE/RESUME + STOP buttons
{(isRunning || isPaused) && (
  <div className="flex gap-3 mt-4">
    {/* Pause/Resume button */}
    <button
      onClick={isPaused ? onResume : onPause}
      className="px-6 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/20"
    >
      {isPaused ? "RESUME" : "PAUSE"}
    </button>

    {/* Stop dropdown button */}
    <div className="relative">
      <button
        onClick={() => setShowStopMenu(!showStopMenu)}
        className="px-6 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 flex items-center gap-2"
      >
        STOP
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showStopMenu && (
        <div className="absolute top-full mt-1 right-0 bg-slate-900 border border-white/10 rounded-lg overflow-hidden shadow-lg z-10 w-40">
          <button
            onClick={() => {
              setShowStopMenu(false);
              onStop();
            }}
            className="w-full px-4 py-2 text-left text-slate-400 hover:bg-slate-800 hover:text-slate-50"
          >
            Stop & Save
          </button>
          <button
            onClick={() => {
              setShowStopMenu(false);
              onDelete();
            }}
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            Delete Entry
          </button>
        </div>
      )}
    </div>
  </div>
)}
```

### 5. Update TimerSection

```tsx
const pauseTimer = usePauseTimer();
const resumeTimer = useResumeTimer();
const deleteTimer = useDeleteTimer();

const handlePause = async () => {
  try {
    await pauseTimer.mutateAsync();
  } catch (err) {
    console.error("Failed to pause timer:", err);
  }
};

const handleResume = async () => {
  try {
    await resumeTimer.mutateAsync();
  } catch (err) {
    console.error("Failed to resume timer:", err);
  }
};

const handleDelete = async () => {
  if (!activeTimer) return;

  if (!window.confirm("Are you sure you want to delete this timer entry?")) {
    return;
  }

  try {
    await deleteTimer.mutateAsync(activeTimer.id);
  } catch (err) {
    console.error("Failed to delete timer:", err);
  }
};

// Pass to CircularTimer
<CircularTimer
  isRunning={!!activeTimer && !activeTimer.paused_at}
  isPaused={!!activeTimer?.paused_at}
  isStarting={isStarting}
  activityName={activeTimer?.activity_name || null}
  startTime={activeTimer ? new Date(activeTimer.start_time) : null}
  plannedDuration={activeTimer?.planned_duration}
  onStart={handlePlay}
  onPause={handlePause}
  onResume={handleResume}
  onStop={handleStopTimer}
  onDelete={handleDelete}
/>
```

---

## Implementation Checklist

### Backend
- [ ] Create migration: Add `paused_at` and `paused_duration` to `time_entries`
- [ ] Run migration
- [ ] Update `models/time_entry.go`: Add new fields
- [ ] Add `PauseTimer` handler
- [ ] Add `ResumeTimer` handler
- [ ] Update `GetActiveTimer` to calculate elapsed correctly with pauses
- [ ] Add routes for `/pause` and `/resume`
- [ ] Test pause/resume/stop/delete flows

### Frontend
- [ ] Update `interfaces/TimeEntry.ts`: Add pause fields
- [ ] Update `services/timeEntryService.ts`: Add pause/resume/delete
- [ ] Update `hooks/useTimeEntries.ts`: Add pause/resume/delete hooks
- [ ] Update `CircularTimer.tsx`: Add PAUSE/RESUME + STOP dropdown UI
- [ ] Update `TimerSection.tsx`: Wire up pause/resume/delete handlers
- [ ] Test all flows: pause, resume, stop, delete
- [ ] Test multiple pause/resume cycles
- [ ] Test paused timer persists on page reload

---

## Edge Cases to Handle

1. **Pause while paused**: Backend returns error
2. **Resume while running**: Backend returns error
3. **Delete while running**: Should work (deletes active timer)
4. **Page reload while paused**: Timer should show paused state
5. **Multiple pause/resume cycles**: `paused_duration` accumulates correctly
6. **Stop a paused timer**: Should work (saves time entry with all pause time excluded)
7. **Planned duration with pauses**: Elapsed time calculation should exclude pauses

---

## UI/UX Notes

- **PAUSE button**: Yellow theme (warning color)
- **STOP dropdown**: Red theme (destructive action)
- **Visual feedback**: Show "(PAUSED)" label on timer when paused
- **Dropdown close**: Click outside or on option closes dropdown
- **Confirmation**: Ask "Are you sure?" before DELETE
- **No confirmation**: STOP doesn't need confirmation (data is saved)
