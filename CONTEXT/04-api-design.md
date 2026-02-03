# API Design - Time Tracker CRUD Operations

## Date
2026-02-03

## Status
🚧 **DRAFT** - Under Review

## Challenge: Creating Activities with New Categories/Tags

### The Problem
Users want to create an activity and potentially create NEW categories/tags at the same time:

**Example:**
```json
{
  "name": "React Development",
  "main_category": "Work",      // might already exist
  "sub_category": "Frontend",   // might need to be created
  "tags": ["urgent", "learning"] // some might exist, some might not
}
```

### Solution Options

#### Option 1: Auto-Create on Activity Creation (RECOMMENDED)
**How it works:**
- When creating an activity, send category/tag NAMES (not IDs) -> OK
- Backend checks if category/tag exists by name -> OK
- If exists: use existing ID -> OK
- If not: create new category/tag automatically -> OK
- Return the complete activity with all relationships -> OK

**Pros:**
- Best UX - one API call
- Frontend doesn't need to check existence
- Atomic operation (all or nothing)

**Cons:**
- More complex backend logic
- Need to handle duplicate name checks carefully

**API Example:**
```
POST /api/activities
{
  "name": "React Development",
  "main_category_name": "Work",
  "sub_category_name": "Frontend",
  "tag_names": ["urgent", "learning"]
}

Response:
{
  "id": 1,
  "name": "React Development",
  "main_category": { "id": 1, "name": "Work" },
  "sub_category": { "id": 5, "name": "Frontend" },
  "tags": [
    { "id": 1, "name": "urgent" },
    { "id": 2, "name": "learning" }
  ],
  "created_at": "2026-02-03T10:00:00Z"
}
```

#### Option 2: Frontend Creates First (More Steps) -> NO, let's do the first one
**How it works:**
- Frontend checks if category/tag exists
- If not, calls POST /api/categories or POST /api/tags first
- Then creates activity with IDs

**Pros:**
- Simpler backend logic
- Explicit control

**Cons:**
- Multiple API calls needed
- Race conditions possible
- Worse UX

---

## Recommended Approach: Option 1 (Auto-Create)

We'll use **Option 1** with the following strategy:

### API Endpoints Structure

#### Categories
```
GET    /api/categories           - List all active categories -> OK
POST   /api/categories           - Create new category -> Why specific route?
GET    /api/categories/:id       - Get single category -> Why specific route?
PUT    /api/categories/:id       - Update category -> OK
DELETE /api/categories/:id       - Soft delete category -> it should delete all the relations from all activities, wonder if it is good
```

#### Tags
```
GET    /api/tags                 - List all active tags -> OK
POST   /api/tags                 - Create new tag -> Why specific route?
GET    /api/tags/:id             - Get single tag -> Why specific route?
PUT    /api/tags/:id             - Update tag -> OK
DELETE /api/tags/:id             - Soft delete tag -> it should delete all the relations from all activities, wonder if it is good
``


#### Activities
```
GET    /api/activities           - List all active activities -> Ok, for a page that shows it
POST   /api/activities           - Create activity (auto-creates categories/tags) -> Why specific route?
GET    /api/activities/:id       - Get single activity with relationships -> ok
PUT    /api/activities/:id       - Update activity -> ok
DELETE /api/activities/:id       - Soft delete activity -> ok
GET    /api/activities/:id/time  - Get total time spent on activity -> ok
GET    /api/activities/stats     - Get all activities with time statistics -> ok
```

#### Time Entries
```
GET    /api/time-entries         - List all time entries -> why if it already exists on the activities
POST   /api/time-entries/start   - Start a new timer
POST   /api/time-entries/stop    - Stop the current timer
-> only one activity can be "active or running" at the same time, because it will be what will be shonw on the main screen
GET    /api/time-entries/active  - Get currently running timer -> ok
GET    /api/time-entries/:id     - Get single time entry -> why
DELETE /api/time-entries/:id     - Delete time entry -> ok
```

---

## Request/Response Formats

### Create Activity (POST /api/activities)

**Request Body:**
```json
{
  "name": "React Development",
  "main_category_name": "Work",
  "sub_category_name": "Frontend",  // optional
  "tag_names": ["urgent", "learning"]  // optional
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "React Development",
  "main_category": {
    "id": 1,
    "name": "Work"
  },
  "sub_category": {
    "id": 5,
    "name": "Frontend"
  },
  "tags": [
    { "id": 1, "name": "urgent" },
    { "id": 2, "name": "learning" }
  ],
  "created_at": "2026-02-03T10:00:00Z",
  "updated_at": "2026-02-03T10:00:00Z"
}
```

**Backend Logic:**
```go
1. Check if main_category exists by name (case-insensitive)
   - If not: Create it
   - Get main_category_id

2. If sub_category_name provided:
   - Check if exists by name
   - If not: Create it
   - Get sub_category_id

3. For each tag_name:
   - Check if exists by name
   - If not: Create it
   - Collect tag_ids

4. Create Activity with category IDs
5. Link tags to activity via activity_tags
6. Return complete activity with relationships
```

### Get Activity with Time Stats (GET /api/activities/:id/time)

**Response:**
```json
{
  "activity_id": 1,
  "activity_name": "React Development",
  "total_seconds": 7200,
  "total_formatted": "2h 0m",
  "entry_count": 3,
  "entries": [
    {
      "id": 1,
      "start_time": "2026-02-03T09:00:00Z",
      "end_time": "2026-02-03T10:30:00Z",
      "duration_seconds": 5400,
      "notes": "Working on components"
    },
    {
      "id": 2,
      "start_time": "2026-02-03T14:00:00Z",
      "end_time": "2026-02-03T14:30:00Z",
      "duration_seconds": 1800,
      "notes": null
    }
  ]
}
```

### Get All Activities with Stats (GET /api/activities/stats)

**Response:**
```json
{
  "activities": [
    {
      "id": 1,
      "name": "React Development",
      "main_category": { "id": 1, "name": "Work" },
      "sub_category": { "id": 5, "name": "Frontend" },
      "tags": [
        { "id": 1, "name": "urgent" }
      ],
      "total_seconds": 7200,
      "total_formatted": "2h 0m",
      "entry_count": 3,
      "last_tracked": "2026-02-03T14:30:00Z"
    },
    {
      "id": 2,
      "name": "Morning Workout",
      "main_category": { "id": 2, "name": "Health" },
      "sub_category": null,
      "tags": [],
      "total_seconds": 1800,
      "total_formatted": "30m",
      "entry_count": 1,
      "last_tracked": "2026-02-03T07:30:00Z"
    }
  ]
}
```

---

## Delete Behavior

### Delete Activity (Soft Delete)
```
DELETE /api/activities/:id
```
- Sets `deleted_at` timestamp
- Does NOT delete categories/tags (they might be used by other activities)
- Keeps all time_entries (for historical data)
- Deleted activities won't show in GET /api/activities
- Can be restored later if needed

### Delete Category
```
DELETE /api/categories/:id
```
- Sets `deleted_at` timestamp on category
- Activities using this category remain (foreign key still valid)
- Frontend should handle displaying "(Deleted Category)" or similar

### Delete Tag
```
DELETE /api/tags/:id
```
- Sets `deleted_at` timestamp on tag
- Junction table entries remain
- Activities keep the association but tag won't show

---

## Helper Functions Needed

### Backend Utilities

```go
// FindOrCreateCategory - finds category by name or creates new one
func FindOrCreateCategory(db *gorm.DB, name string) (*models.Category, error)

// FindOrCreateTag - finds tag by name or creates new one
func FindOrCreateTag(db *gorm.DB, name string) (*models.Tag, error)

// CalculateDuration - calculates seconds between start and end time
func CalculateDuration(start, end time.Time) int64

// FormatDuration - formats seconds to human readable (e.g., "2h 30m")
func FormatDuration(seconds int64) string

// GetActivityStats - gets total time and entry count for an activity
func GetActivityStats(db *gorm.DB, activityID uint) (totalSeconds int64, count int64, error)
```

---

## Project Structure

```
backend/
├── main.go
├── models/
│   ├── category.go
│   ├── tag.go
│   ├── activity.go
│   └── time_entry.go
├── database/
│   ├── database.go
│   └── seeds/
├── handlers/
│   ├── categories.go      # Category CRUD handlers
│   ├── tags.go            # Tag CRUD handlers
│   ├── activities.go      # Activity CRUD + stats handlers
│   └── time_entries.go    # Time entry handlers
├── services/
│   ├── activity_service.go   # Business logic for activities
│   └── time_service.go       # Time calculation utilities
├── routes/
│   └── routes.go          # Chi router setup
└── utils/
    └── response.go        # JSON response helpers
```

---

## Questions for Discussion

1. **Case Sensitivity**: Should "Work" and "work" be treated as the same category?
   - **Recommendation**: Case-insensitive matching (store as entered, match lowercase)

2. **Duplicate Prevention**: What if user tries to create activity with same name?
   - **Recommendation**: Allow duplicates (same activity might be done multiple times)

3. **Category/Tag Trimming**: Should we trim whitespace from names?
   - **Recommendation**: Yes, always trim and validate non-empty

4. **Maximum Limits**: Any limits on tags per activity?
   - **Recommendation**: No hard limit, but validate reasonable use

5. **Validation Rules**:
   - Activity name: 1-200 characters, required
   - Category name: 1-50 characters, required
   - Tag name: 1-30 characters, required
   - Notes: 0-500 characters, optional

---

## Next Steps (After Approval)

1. Create project structure (handlers, services, routes, utils)
2. Implement helper functions (FindOrCreate, duration calculations)
3. Implement Category CRUD handlers
4. Implement Tag CRUD handlers
5. Implement Activity CRUD handlers with auto-create logic
6. Implement Time Entry handlers
7. Set up Chi router with all routes
8. Test all endpoints -> create a Test folder and Test suit for all our code.
9. Update main.go to start HTTP server

---

**Please review and provide feedback!**
- Do you approve the auto-create approach?
- Any changes to the API structure?
- Any additional endpoints needed?


---

## All Questions & Answers

### Q1: Why specific routes for POST /api/categories and GET /api/categories/:id?
**Answer:** You're right to question this! Since categories are auto-created with activities, we DON'T need POST. However, GET /api/categories/:id could be useful for editing/managing existing categories. 

**Revised Recommendation:**
- **REMOVE** `POST /api/categories` - not needed (auto-created)
- **KEEP** `GET /api/categories/:id` - useful for category management UI
- **KEEP** `GET /api/categories` - needed to populate dropdowns/autocomplete in frontend

### Q2: Why specific routes for POST /api/tags and GET /api/tags/:id?
**Answer:** Same as categories!

**Revised Recommendation:**
- **REMOVE** `POST /api/tags` - not needed (auto-created)
- **KEEP** `GET /api/tags/:id` - useful for tag management UI
- **KEEP** `GET /api/tags` - needed to show available tags in frontend

### Q3: Why specific route for POST /api/activities?
**Answer:** This IS needed! Users need to create new activities. This is the main endpoint for creating activities with auto-created categories/tags. -> only needed for creating activities that he did without our app. We will use the main route as the route when he "start" a new activity and fill the categories and tags.

**Keep:** `POST /api/activities`

### Q4: Should DELETE category/tag remove all relations from activities?
**Answer:** NO, we should NOT cascade delete the relationships. Here's why:

**Current Design (KEEP):**
- Soft delete the category/tag (set deleted_at)
- Keep the foreign keys intact in activities
- Frontend shows "(Deleted)" or hides the category/tag name
- Historical data remains intact

**Why this is better:**
- You don't lose historical activity data
- Activities that used "Work" category still show they were "Work" activities
- You can restore the category later if needed
- Reports and statistics remain accurate

**Alternative (NOT RECOMMENDED):**
- If we remove all relations, activities lose their category info
- Historical data becomes meaningless

### Q5: Why GET /api/time-entries if it already exists in activities?
**Answer:** Excellent point! This is redundant.

**Revised Recommendation:**
- **REMOVE** `GET /api/time-entries` - not needed
- Time entries are fetched via `GET /api/activities/:id/time`
- This keeps the API simpler and more focused

### Q6: Why GET /api/time-entries/:id?
**Answer:** You're right, this is not needed for basic functionality.

**Revised Recommendation:**
- **REMOVE** `GET /api/time-entries/:id` - not needed
- If we need to edit a time entry later, we can add it then

### Q7: Only one activity can be active at a time?
**Answer:** YES, absolutely correct! Only one timer should be running at a time.

**Implementation:**
- `POST /api/time-entries/start` should check if there's already an active timer
- If yes, return error: "Please stop the current timer first"
- Or, auto-stop the previous timer and start the new one (better UX)

**Revised Logic for START:**
```go
1. Check if there's an active timer (end_time IS NULL)
2. If yes:
   Option A: Return error "Timer already running for Activity X"
   Option B (RECOMMENDED): Auto-stop it, then start new timer -> yes.
3. Create new time_entry with start_time = NOW, end_time = NULL
```

### Q8: General question - Why separate routes for categories and tags if they're created with activities?
**Answer:** Great fundamental question! Here's the breakdown:

**Why we DO need these routes:**
1. **GET /api/categories** - Frontend needs to show existing categories for autocomplete/suggestions
2. **GET /api/tags** - Frontend needs to show existing tags for autocomplete/suggestions  
3. **PUT /api/categories/:id** - Admin might want to rename "Wrk" → "Work" (typo fix)
4. **DELETE /api/categories/:id** - Admin might want to hide old unused categories

**Why we DON'T need these routes:**
1. **POST /api/categories** - Removed! Auto-created with activities
2. **POST /api/tags** - Removed! Auto-created with activities

**Frontend Use Case Example:**
```
User creates new activity:
1. Types "React Dev" in activity name
2. Starts typing "Wo..." in category field
3. Frontend calls GET /api/categories
4. Shows autocomplete: "Work" (existing category)
5. User selects "Work" or types "Work Projects" (new)
6. Backend auto-creates "Work Projects" if it doesn't exist
```

### Q9: Create test folder and test suite for all code?
**Answer:** YES! Absolutely important.

**Recommendation:**
```
backend/
├── tests/
│   ├── integration/
│   │   ├── activities_test.go
│   │   ├── categories_test.go
│   │   └── time_entries_test.go
│   └── unit/
│       ├── services_test.go
│       └── utils_test.go
```

We'll use Go's built-in testing framework with:
- Table-driven tests
- Test database (separate from main DB)
- HTTP test server for integration tests

---

## Revised API Endpoints (After Questions)

### Categories
```
GET    /api/categories           - List all active categories (for autocomplete)
GET    /api/categories/:id       - Get single category (for management)
PUT    /api/categories/:id       - Update category (rename)
DELETE /api/categories/:id       - Soft delete (hide from list)
```

### Tags  
```
GET    /api/tags                 - List all active tags (for autocomplete)
GET    /api/tags/:id             - Get single tag (for management)
PUT    /api/tags/:id             - Update tag (rename)
DELETE /api/tags/:id             - Soft delete (hide from list)
```

### Activities
```
GET    /api/activities           - List all active activities
POST   /api/activities           - Create activity (auto-creates categories/tags)
GET    /api/activities/:id       - Get single activity with relationships
PUT    /api/activities/:id       - Update activity
DELETE /api/activities/:id       - Soft delete activity
GET    /api/activities/:id/time  - Get time entries and stats for activity
GET    /api/activities/stats     - Get all activities with time statistics
```

### Time Entries
```
POST   /api/time-entries/start   - Start timer (auto-stops previous if running)
POST   /api/time-entries/stop    - Stop the current timer
GET    /api/time-entries/active  - Get currently running timer
DELETE /api/time-entries/:id     - Delete time entry (for corrections)
```

---

## Start Timer - Detailed Behavior

**POST /api/time-entries/start**

**Request:**
```json
{
  "activity_id": 1
}
```

**Response (Success - 201 Created):**
```json
{
  "id": 5,
  "activity_id": 1,
  "activity_name": "React Development",
  "start_time": "2026-02-03T15:30:00Z",
  "end_time": null,
  "status": "running"
}
```

**Response (Another Timer Running - 200 OK with auto-stop):**
```json
{
  "stopped_previous": {
    "id": 4,
    "activity_id": 2,
    "activity_name": "Morning Workout",
    "start_time": "2026-02-03T15:00:00Z",
    "end_time": "2026-02-03T15:30:00Z",
    "duration_seconds": 1800
  },
  "started_new": {
    "id": 5,
    "activity_id": 1,
    "activity_name": "React Development",
    "start_time": "2026-02-03T15:30:00Z",
    "end_time": null,
    "status": "running"
  }
}
```

---
