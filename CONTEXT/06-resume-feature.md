# Resume Feature - Activity Statistics Dashboard

## Date
2026-02-03

## Status
🚧 **DRAFT** - Under Review

---

## Feature Overview

Add a "Resume" section above "Recent Activities" that shows:
- Top 3 most-done activities within a time period
- Total time spent on each
- Number of sessions/entries for each
- Pie chart visualization

---

## Backend Changes

### New Endpoint

```
GET /api/activities/resume?period=day|week|month|year&tag=optional
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period | string | Yes | Filter period: `day`, `week`, `month`, `year` |
| tag | string | No | Optional tag filter (for future use) |

### Period Calculation Logic

```go
// Calculate date range based on period
switch period {
case "day":
    startDate = today at 00:00:00
case "week":
    startDate = monday of current week at 00:00:00
case "month":
    startDate = 1st of current month at 00:00:00
case "year":
    startDate = January 1st of current year at 00:00:00
}
endDate = now
```

### Response Format

```json
{
  "period": "week",
  "start_date": "2026-02-03T00:00:00Z",
  "end_date": "2026-02-03T23:59:59Z",
  "total_time_seconds": 18000,
  "total_time_formatted": "5h 0m",
  "activities": [
    {
      "activity_id": 1,
      "activity_name": "React Development",
      "main_category": "Work",
      "total_seconds": 7200,
      "total_formatted": "2h 0m",
      "entry_count": 5,
      "percentage": 40.0
    },
    {
      "activity_id": 3,
      "activity_name": "Reading",
      "main_category": "Personal",
      "total_seconds": 5400,
      "total_formatted": "1h 30m",
      "entry_count": 3,
      "percentage": 30.0
    },
    {
      "activity_id": 2,
      "activity_name": "Exercise",
      "main_category": "Health",
      "total_seconds": 5400,
      "total_formatted": "1h 30m",
      "entry_count": 6,
      "percentage": 30.0
    }
  ]
}
```

### Backend Implementation

#### 1. New Handler: `handlers/resume.go`

```go
type ResumeHandler struct {
    Logger *zap.Logger
}

type ResumeQuery struct {
    Period string  // day, week, month, year
    Tag    *string // optional tag filter
}

type ActivityResume struct {
    ActivityID     uint    `json:"activity_id"`
    ActivityName   string  `json:"activity_name"`
    MainCategory   string  `json:"main_category"`
    TotalSeconds   int64   `json:"total_seconds"`
    TotalFormatted string  `json:"total_formatted"`
    EntryCount     int64   `json:"entry_count"`
    Percentage     float64 `json:"percentage"`
}

type ResumeResponse struct {
    Period              string           `json:"period"`
    StartDate           time.Time        `json:"start_date"`
    EndDate             time.Time        `json:"end_date"`
    TotalTimeSeconds    int64            `json:"total_time_seconds"`
    TotalTimeFormatted  string           `json:"total_time_formatted"`
    Activities          []ActivityResume `json:"activities"`
}

func (h *ResumeHandler) GetResume(w http.ResponseWriter, r *http.Request) {
    // 1. Parse period from query params
    // 2. Calculate start/end dates
    // 3. Query time_entries within date range
    // 4. Group by activity, sum durations
    // 5. Sort by total_seconds DESC
    // 6. Take top 3
    // 7. Calculate percentages
    // 8. Return response
}
```

#### 2. SQL Query Logic

```sql
SELECT 
    a.id as activity_id,
    a.name as activity_name,
    c.name as main_category,
    COUNT(te.id) as entry_count,
    SUM(
        CAST((julianday(te.end_time) - julianday(te.start_time)) * 86400 AS INTEGER)
    ) as total_seconds
FROM time_entries te
JOIN activities a ON te.activity_id = a.id
JOIN categories c ON a.main_category_id = c.id
WHERE te.end_time IS NOT NULL
  AND te.start_time >= ?  -- start_date
  AND te.start_time < ?   -- end_date
  AND a.deleted_at IS NULL
GROUP BY a.id, a.name, c.name
ORDER BY total_seconds DESC
LIMIT 3
```

#### 3. Route Registration

```go
// In routes/routes.go
r.Get("/activities/resume", resumeHandler.GetResume)
```

---

## Frontend Changes

### 1. New Component: `ResumeSection.tsx`

Location: `src/components/organisms/ResumeSection.tsx`

#### Props

```typescript
interface ResumeSectionProps {
  // Data will be fetched internally
}
```

#### State

```typescript
const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
const [resumeData, setResumeData] = useState<ResumeResponse | null>(null);
const [isLoading, setIsLoading] = useState(false);
```

### 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  RESUME                           [DAY] [WEEK] [MONTH] [YEAR]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────┐    ┌─────────────────────┐    │
│  │                             │    │                     │    │
│  │  1. React Development       │    │      PIE CHART      │    │
│  │     Work • 2h 0m • 5x       │    │                     │    │
│  │     ████████████░░ 40%      │    │    40% / 30% / 30%  │    │
│  │                             │    │                     │    │
│  │  2. Reading                 │    │                     │    │
│  │     Personal • 1h 30m • 3x  │    │                     │    │
│  │     █████████░░░░░ 30%      │    │                     │    │
│  │                             │    │                     │    │
│  │  3. Exercise                │    │                     │    │
│  │     Health • 1h 30m • 6x    │    │                     │    │
│  │     █████████░░░░░ 30%      │    └─────────────────────┘    │
│  │                             │                                │
│  └─────────────────────────────┘    Total: 5h 0m               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Period Filter Buttons

```tsx
<div className="flex gap-2">
  {['day', 'week', 'month', 'year'].map((p) => (
    <button
      key={p}
      className={period === p ? 'btn-active' : 'btn-inactive'}
      onClick={() => setPeriod(p)}
    >
      {p.toUpperCase()}
    </button>
  ))}
</div>
```

### 4. Pie Chart

Use SVG-based pie chart (no external library needed):

```tsx
const PieChart: React.FC<{ data: ActivityResume[] }> = ({ data }) => {
  // Calculate segments based on percentages
  // Use SVG path with arc calculations
  // Colors: Use accent colors from theme
};
```

Colors for pie segments:
- Segment 1: `#6366f1` (Indigo)
- Segment 2: `#a855f7` (Purple)  
- Segment 3: `#ec4899` (Pink)
- Remaining: `#374151` (Gray)

### 5. Activity List Item

```tsx
<div className="activity-resume-item">
  <div className="rank">1</div>
  <div className="details">
    <h4>{activity.activity_name}</h4>
    <p>{activity.main_category} • {activity.total_formatted} • {activity.entry_count}x</p>
    <div className="progress-bar">
      <div style={{ width: `${activity.percentage}%` }} />
    </div>
  </div>
  <div className="percentage">{activity.percentage}%</div>
</div>
```

---

## CSS Additions

```css
/* Resume Section */
.resume-section {
  width: 100%;
  background: var(--color-glass-bg);
  border: 1px solid var(--color-glass-border);
  border-radius: 24px;
  padding: 32px;
  backdrop-filter: blur(12px);
}

.resume-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.period-filters {
  display: flex;
  gap: 8px;
}

.period-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--color-glass-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.period-btn.active {
  background: var(--gradient-primary);
  color: white;
  border-color: transparent;
}

.resume-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.activity-resume-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  margin-bottom: 12px;
}

.rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.progress-bar > div {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}
```

---

## Filter Extensibility (Future)

The `tag` query parameter is included for future filtering:

```
GET /api/activities/resume?period=week&tag=urgent
```

This would filter activities that have the "urgent" tag before grouping.

Additional future filters could include:
- `category`: Filter by main category
- `from_date` / `to_date`: Custom date range
- `limit`: Change top N (default 3)

---

## Implementation Order

### Backend
1. Create `handlers/resume.go` with `GetResume` handler
2. Add date range calculation utility in `utils/time.go`
3. Register route in `routes/routes.go`
4. Test endpoint with curl

### Frontend
1. Create `PieChart.tsx` component (atoms or molecules)
2. Create `ResumeSection.tsx` component (organisms)
3. Add CSS styles to `index.css`
4. Integrate into `HomePage.tsx` above "Recent Activities"
5. Test with different periods

---

## Questions

1. **Empty State**: What to show if no activities in the period?
   - Suggestion: "No activities tracked this [period]" message

2. **Top N**: Should we always show 3, or make it configurable?
   - Suggestion: Fixed at 3 for now, add parameter later

3. **Tie Breaking**: If two activities have same time, how to sort?
   - Suggestion: Secondary sort by entry_count DESC, then by name ASC

4. **Current Activity**: Should running (non-stopped) entries be included?
   - Suggestion: No, only completed entries (end_time IS NOT NULL)

---

**Please review and provide feedback before implementation!**
