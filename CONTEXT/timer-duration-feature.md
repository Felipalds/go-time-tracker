# Timer Duration Feature - Implementation Plan

## Overview

Add ability for users to choose between:
1. **Free-running timer** (current behavior): Runs indefinitely until manually stopped
2. **Timed session**: Set a specific duration (e.g., 25 minutes for Pomodoro)

## Current Implementation

### Backend (Go)

**Model:** `backend/models/time_entry.go`
```go
type TimeEntry struct {
    ID         uint       `gorm:"primaryKey"`
    UserID     uint       `gorm:"not null;index"`
    ActivityID uint       `gorm:"not null;index"`
    StartTime  time.Time  `gorm:"not null;index"`
    EndTime    *time.Time `gorm:"index"` // NULL = running
    Notes      *string    `gorm:"type:text"`
    CreatedAt  time.Time
}
```

**API Endpoints:** `backend/handlers/time_entries.go`
- `POST /time-entries/start` - Input: `{ activity_id: uint }`
- `POST /time-entries/stop` - No input
- `GET /time-entries/active` - Returns currently running timer

**Current Start Logic:**
1. Accepts only `activity_id`
2. Auto-stops any existing timer
3. Creates new TimeEntry with `StartTime = now`, `EndTime = null`
4. Timer runs until manually stopped

### Frontend (React + TypeScript)

**Service:** `frontend/src/services/timeEntryService.ts`
```ts
start: (activityId: number) => api.post("/time-entries/start", { activity_id: activityId })
```

**UI Components:**
- `CircularTimer`: Displays elapsed time, infinite loop (25-min cycles visual only)
- `TimerSection`: Orchestrates timer start/stop
- `ActivityCreationForm`: Activity name, category, tags input

**Current Flow:**
1. User fills form (name, category, tags)
2. Clicks timer or presses Enter
3. Creates activity → starts timer
4. Timer runs indefinitely
5. User manually stops timer

---

## Proposed Changes

### 1. Database Migration

**Add `planned_duration` field to `time_entries` table:**

```sql
ALTER TABLE time_entries ADD COLUMN planned_duration INTEGER;
```

- Type: `INTEGER` (duration in seconds)
- Nullable: `YES` (NULL = free-running timer)
- Example values:
  - `NULL` = free-running (current behavior)
  - `1500` = 25 minutes (Pomodoro)
  - `3600` = 60 minutes

**Updated Model:**
```go
type TimeEntry struct {
    ID              uint       `gorm:"primaryKey"`
    UserID          uint       `gorm:"not null;index"`
    ActivityID      uint       `gorm:"not null;index"`
    StartTime       time.Time  `gorm:"not null;index"`
    EndTime         *time.Time `gorm:"index"`
    PlannedDuration *int       `gorm:"type:integer"` // NEW: duration in seconds
    Notes           *string    `gorm:"type:text"`
    CreatedAt       time.Time
}
```

### 2. Backend API Changes

**Update `POST /time-entries/start` input:**

```go
// OLD
type StartTimerInput struct {
    ActivityID uint `json:"activity_id"`
}

// NEW
type StartTimerInput struct {
    ActivityID      uint  `json:"activity_id"`
    PlannedDuration *int  `json:"planned_duration,omitempty"` // seconds, nullable
}
```

**Update handler logic:**

```go
func (h *TimeEntryHandler) StartTimer(w http.ResponseWriter, r *http.Request) {
    // ... existing validation ...

    // Create new time entry
    newEntry := models.TimeEntry{
        UserID:          userID,
        ActivityID:      input.ActivityID,
        StartTime:       time.Now(),
        EndTime:         nil,
        PlannedDuration: input.PlannedDuration, // NEW
    }

    // ... rest of existing logic ...
}
```

**Update `GET /time-entries/active` response:**

```json
{
  "active_timer": {
    "id": 123,
    "activity_id": 45,
    "activity_name": "Work",
    "start_time": "2026-02-07T10:00:00Z",
    "elapsed_seconds": 300,
    "planned_duration": 1500,  // NEW: null or number
    "status": "running"
  }
}
```

**Backend does NOT auto-stop timers** - This is a frontend concern. Backend just stores the planned duration.
-> it must be checked on the load/fetch of the data or on the initial load of the app (see if the activity planned active reached the result and give user the rewards)

### 3. Frontend Changes

#### A. Update Interface

**`frontend/src/interfaces/TimeEntry.ts`**

```ts
export interface ActiveTimer {
  id: number;
  activity_id: number;
  activity_name: string;
  start_time: string;
  elapsed_seconds?: number;
  planned_duration?: number | null; // NEW: duration in seconds
}
```

#### B. Update Service

**`frontend/src/services/timeEntryService.ts`**

```ts
export const timeEntryService = {
  getActive: () =>
    api.get<{ active_timer: ActiveTimer | null }>("/time-entries/active"),

  start: (activityId: number, plannedDuration?: number | null) =>
    api.post("/time-entries/start", {
      activity_id: activityId,
      ...(plannedDuration !== undefined && { planned_duration: plannedDuration }),
    }),

  stop: () => api.post("/time-entries/stop"),
};
```

#### C. Update Hook

**`frontend/src/hooks/useTimeEntries.ts`**

```ts
export const useStartTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, plannedDuration }: { activityId: number; plannedDuration?: number | null }) =>
      timeEntryService.start(activityId, plannedDuration),
    // ... rest of mutation config
  });
};
```

#### D. Update UI Components

**1. Add Duration Selector to `TimerSection`**

Add above/near the CircularTimer:

```tsx
// TimerSection state
const [timerMode, setTimerMode] = useState<'free' | 'timed'>('free');
const [plannedMinutes, setPlannedMinutes] = useState(25); // default Pomodoro

// UI
<div className="flex items-center gap-4 mb-4">
  <button
    onClick={() => setTimerMode('free')}
    className={timerMode === 'free' ? 'active' : ''}
  >
    Free Running
  </button>
  <button
    onClick={() => setTimerMode('timed')}
    className={timerMode === 'timed' ? 'active' : ''}
  >
    Timed
  </button>

  {timerMode === 'timed' && (
    <input
      type="number"
      min="1"
      max="240"
      value={plannedMinutes}
      onChange={(e) => setPlannedMinutes(Number(e.target.value))}
      placeholder="Minutes"
    />
  )}
</div>
```

**2. Update `handlePlay` in `TimerSection`**

```tsx
const handlePlay = async () => {
  if (isStarting) return;
  setIsStarting(true);

  try {
    const data = formDataRef.current;
    const newActivity = await createActivity.mutateAsync({
      name: data.name || "Work",
      main_category_name: data.mainCategory || "Work",
      sub_category_name: null,
      tag_names: data.tags,
    });

    // Calculate duration in seconds (null for free-running)
    const plannedDuration = timerMode === 'timed'
      ? plannedMinutes * 60
      : null;

    await startTimer.mutateAsync({
      activityId: newActivity.id,
      plannedDuration
    });

    // Reset form data
    formDataRef.current = { name: "", mainCategory: "", tags: [] };
  } catch (err) {
    console.error("Failed to start activity:", err);
    alert("Failed to start activity");
  } finally {
    setIsStarting(false);
  }
};
```

**3. Update `CircularTimer` Component**

Current behavior: Shows infinite 25-min cycles

New behavior:
- **Free-running**: Keep current infinite cycle display
- **Timed**: Show progress toward planned duration

```tsx
interface CircularTimerProps {
  isRunning: boolean;
  isStarting: boolean;
  activityName: string | null;
  startTime: Date | null;
  plannedDuration?: number | null; // NEW: seconds
  onStart: () => void;
  onStop: () => void;
}

// In component
const cycleTime = plannedDuration || (25 * 60); // Use planned or default 25 min
const progress = plannedDuration
  ? Math.min(elapsed / plannedDuration, 1) // 0-100% for timed
  : (elapsed % cycleTime) / cycleTime;      // Loop for free-running

// Visual indicator
{plannedDuration && elapsed >= plannedDuration && (
  <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-full">
    <span className="text-green-400 font-bold">Complete!</span>
  </div>
)}
```

**4. Auto-stop behavior (Optional)**

When a timed session completes, you can:

**Option A: Auto-stop**
```tsx
useEffect(() => {
  if (isRunning && plannedDuration && elapsed >= plannedDuration) {
    handleStopTimer(); // Auto-stop when time is up
  }
}, [isRunning, plannedDuration, elapsed]);
```

**Option B: Notify only**
```tsx
useEffect(() => {
  if (isRunning && plannedDuration && elapsed >= plannedDuration && !hasNotified) {
    // Play sound or show notification
    new Audio('/notification.mp3').play();
    setHasNotified(true);
  }
}, [isRunning, plannedDuration, elapsed]);
```

-> user can choose if he wants to notify or not

---

## Implementation Checklist

### Backend
- [ ] Create migration: `migrations/XXXXXX_add_planned_duration_to_time_entries.sql`
- [ ] Run migration: `make migrate-up` or equivalent
- [ ] Update `models/time_entry.go`: Add `PlannedDuration *int`
- [ ] Update `handlers/time_entries.go`: Accept `planned_duration` in StartTimer
- [ ] Update `handlers/time_entries.go`: Return `planned_duration` in GetActiveTimer
- [ ] Test API with curl/Postman

### Frontend
- [ ] Update `interfaces/TimeEntry.ts`: Add `planned_duration?: number | null`
- [ ] Update `services/timeEntryService.ts`: Accept `plannedDuration` param
- [ ] Update `hooks/useTimeEntries.ts`: Update mutation signature
- [ ] Update `TimerSection.tsx`: Add mode selector UI
- [ ] Update `CircularTimer.tsx`: Handle timed vs free-running display
- [ ] Add duration input component (number input or preset buttons)
- [ ] Test timer start with both modes
- [ ] Test timer display for both modes
- [ ] Decide on auto-stop behavior

---

## UI/UX Design Considerations

### Mode Selector Placement

**Option 1: Above Timer (Recommended)**
```
┌─────────────────────────┐
│ [Free] [Timed: 25 min▼] │  ← Mode selector
│                         │
│      ┌─────────┐        │
│      │  Timer  │        │
│      │  12:34  │        │
│      └─────────┘        │
│                         │
│    [Activity Form]      │
└─────────────────────────┘
```

**Option 2: Integrated with Form**
- Add duration field to ActivityCreationForm
- Show only when "Timed" mode is selected

-> option 1

### Duration Input Options

**A. Number Input**
```tsx
<input type="number" min="1" max="240" placeholder="Minutes" />
```

**B. Preset Buttons**
```tsx
<div className="flex gap-2">
  <button onClick={() => setMinutes(15)}>15m</button>
  <button onClick={() => setMinutes(25)}>25m</button>
  <button onClick={() => setMinutes(45)}>45m</button>
  <button onClick={() => setMinutes(60)}>60m</button>
  <input type="number" placeholder="Custom" />
</div>
```

**C. Time Picker (More Complex)**
```tsx
<input type="time" /> // Returns HH:MM
```

I want all of them

### Visual Feedback

**Timer Ring Colors:**
- Free-running: Blue gradient (current)
- Timed (in progress): Blue gradient
- Timed (>75% complete): Yellow gradient
- Timed (100% complete): Green pulse

**Completion Notification:**
- Browser notification (requires permission) -> user can choose
- Sound alert (optional)
- Visual indicator on timer
- Option to auto-stop or continue tracking overtime

---

## Migration File Template

**`backend/migrations/XXXXXX_add_planned_duration_to_time_entries.sql`**

```sql
-- +goose Up
ALTER TABLE time_entries ADD COLUMN planned_duration INTEGER;
COMMENT ON COLUMN time_entries.planned_duration IS 'Planned duration in seconds. NULL = free-running timer.';

-- +goose Down
ALTER TABLE time_entries DROP COLUMN planned_duration;
```

---

## Testing Plan

### Backend Tests
1. Start timer without `planned_duration` → stores NULL
2. Start timer with `planned_duration: 1500` → stores 1500
3. Get active timer → returns `planned_duration` field
4. Timer with planned duration can still be manually stopped early

### Frontend Tests
1. Select "Free Running" → starts timer with NULL duration
2. Select "Timed: 25 min" → starts timer with 1500 seconds
3. Timer display shows correct progress for timed sessions
4. Timer display loops correctly for free-running sessions
5. Form resets after starting timer
6. Can switch modes before starting timer

---

## Future Enhancements (Out of Scope)

- [ ] Save default duration preference per user
- [ ] Different default durations per activity/category
- [ ] Break timer after Pomodoro sessions
- [ ] Daily goal tracking (e.g., "Complete 8 Pomodoros today")
- [ ] Timer templates (Pomodoro: 25m work + 5m break)
- [ ] Pause/resume functionality
- [ ] Adjust duration mid-session

---

## Questions for Clarification

1. **Auto-stop behavior:** Should timed sessions auto-stop when complete, or just notify? notify
2. **Default mode:** Should "Free Running" or "Timed" be the default? default should be free running
3. **Duration presets:** Which durations to offer as quick buttons? (15, 25, 45, 60 min?) these are good
4. **UI placement:** Mode selector above timer or integrated with form? above
5. **Overtime tracking:** If auto-stop is disabled, should we track "overtime" separately? not for now
6. **Sound notifications:** Include audio alert when timer completes? yes if user wants to
