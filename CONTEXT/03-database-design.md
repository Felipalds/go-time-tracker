# Database Design - Time Tracker

## Date
2026-02-03

## Status
✅ **APPROVED** - Ready for Implementation

## Database Choice
SQLite - file-based, zero-config, perfect for this application

---

## Final Schema Design

### Table 1: `categories`
Stores predefined categories for organizing activities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique category ID |
| name | TEXT | NOT NULL, UNIQUE | Category name (e.g., "Work", "Health", "Study") |
| deleted_at | DATETIME | NULL | Soft delete timestamp (NULL = active) |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When category was created |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Example rows:**
```
id | name     | deleted_at | created_at          | updated_at
1  | Work     | NULL       | 2026-02-03 10:00:00 | 2026-02-03 10:00:00
2  | Health   | NULL       | 2026-02-03 10:00:00 | 2026-02-03 10:00:00
3  | Study    | NULL       | 2026-02-03 10:00:00 | 2026-02-03 10:00:00
4  | Personal | 2026-02-03 | 2026-02-03 10:00:00 | 2026-02-03 15:00:00
```
*Note: Row 4 is soft-deleted*

### Table 2: `tags`
Stores tags for flexible activity organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique tag ID |
| name | TEXT | NOT NULL, UNIQUE | Tag name (e.g., "urgent", "relaxing", "learning") |
| deleted_at | DATETIME | NULL | Soft delete timestamp (NULL = active) |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When tag was created |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Example rows:**
```
id | name      | deleted_at | created_at          | updated_at
1  | urgent    | NULL       | 2026-02-03 10:00:00 | 2026-02-03 10:00:00
2  | relaxing  | NULL       | 2026-02-03 10:00:00 | 2026-02-03 10:00:00
3  | learning  | 2026-02-03 | 2026-02-03 10:00:00 | 2026-02-03 15:00:00
```
*Note: Row 3 is soft-deleted*

### Table 3: `activities`
Stores the activity definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique activity ID |
| name | TEXT | NOT NULL | Activity name (e.g., "Morning Workout", "React Development") |
| main_category_id | INTEGER | NOT NULL, FOREIGN KEY → categories(id) | Main category reference |
| sub_category_id | INTEGER | NULL, FOREIGN KEY → categories(id) | Optional subcategory reference |
| deleted_at | DATETIME | NULL | Soft delete timestamp (NULL = active) |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When activity was created |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Foreign Key Constraints:**
- `main_category_id` REFERENCES `categories(id)` ON DELETE RESTRICT
- `sub_category_id` REFERENCES `categories(id)` ON DELETE SET NULL

**Example rows:**
```
id | name              | main_category_id | sub_category_id | deleted_at | created_at          | updated_at
1  | React Development | 1 (Work)         | 1 (Work)        | NULL       | 2026-02-03 10:00:00 | 2026-02-03 10:00:00
2  | Morning Workout   | 2 (Health)       | 2 (Health)      | NULL       | 2026-02-03 11:00:00 | 2026-02-03 11:00:00
3  | Reading           | 4 (Personal)     | NULL            | NULL       | 2026-02-03 12:00:00 | 2026-02-03 12:00:00
4  | Old Task          | 1 (Work)         | NULL            | 2026-02-03 | 2026-02-01 10:00:00 | 2026-02-03 10:00:00
```
*Note: Row 4 is soft-deleted (has deleted_at timestamp)*

### Table 4: `activity_tags` (Many-to-Many Junction)
Links activities to tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique junction ID |
| activity_id | INTEGER | NOT NULL, FOREIGN KEY → activities(id) | Activity reference |
| tag_id | INTEGER | NOT NULL, FOREIGN KEY → tags(id) | Tag reference |

**Foreign Key Constraints:**
- `activity_id` REFERENCES `activities(id)` ON DELETE CASCADE
- `tag_id` REFERENCES `tags(id)` ON DELETE CASCADE
- UNIQUE constraint on (`activity_id`, `tag_id`) to prevent duplicates

**Example rows:**
```
id | activity_id | tag_id
1  | 1           | 3 (learning)
2  | 1           | 1 (urgent)
3  | 2           | 2 (relaxing)
```

### Table 5: `time_entries`
Stores individual time tracking sessions for each activity.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique entry ID |
| activity_id | INTEGER | NOT NULL, FOREIGN KEY → activities(id) | Reference to activity |
| start_time | DATETIME | NOT NULL | When tracking started |
| end_time | DATETIME | NULL | When tracking ended (NULL = still running) |
| notes | TEXT | NULL | Optional notes about this session |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When entry was created |

**Foreign Key Constraint:**
- `activity_id` REFERENCES `activities(id)` ON DELETE CASCADE
  - If activity is deleted, all its time entries are also deleted

**Example rows:**
```
id | activity_id | start_time           | end_time             | notes                    | created_at
1  | 1           | 2026-02-03 09:00:00  | 2026-02-03 10:30:00  | NULL                     | 2026-02-03 09:00:00
2  | 1           | 2026-02-03 14:00:00  | 2026-02-03 15:45:00  | "Had to stop for lunch"  | 2026-02-03 14:00:00
3  | 2           | 2026-02-03 07:00:00  | 2026-02-03 07:30:00  | NULL                     | 2026-02-03 07:00:00
4  | 1           | 2026-02-03 16:00:00  | NULL                 | NULL                     | 2026-02-03 16:00:00
```
*Note: Row 4 shows an active/running timer (end_time is NULL)*

---

## Database Relationships

```
categories ─┬─< activities >─┬─< time_entries
            │                │
            └─< activities   └─< activity_tags >─< tags
               (sub_category)
```

---

## Indexes for Performance

```sql
-- Categories
CREATE INDEX idx_categories_deleted_at ON categories(deleted_at);

-- Tags
CREATE INDEX idx_tags_deleted_at ON tags(deleted_at);

-- Activities
CREATE INDEX idx_activities_main_category ON activities(main_category_id);
CREATE INDEX idx_activities_sub_category ON activities(sub_category_id);
CREATE INDEX idx_activities_deleted_at ON activities(deleted_at);

-- Time Entries
CREATE INDEX idx_time_entries_activity_id ON time_entries(activity_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX idx_time_entries_end_time ON time_entries(end_time);

-- Activity Tags
CREATE INDEX idx_activity_tags_activity_id ON activity_tags(activity_id);
CREATE INDEX idx_activity_tags_tag_id ON activity_tags(tag_id);
```

---

## GORM Model Definitions (Go)

### Category Model
```go
type Category struct {
    ID        uint       `gorm:"primaryKey"`
    Name      string     `gorm:"not null;unique"`
    DeletedAt *time.Time `gorm:"index"` // Soft delete
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

### Tag Model
```go
type Tag struct {
    ID         uint       `gorm:"primaryKey"`
    Name       string     `gorm:"not null;unique"`
    DeletedAt  *time.Time `gorm:"index"` // Soft delete
    CreatedAt  time.Time
    UpdatedAt  time.Time
    Activities []Activity `gorm:"many2many:activity_tags;"`
}
```

### Activity Model
```go
type Activity struct {
    ID              uint       `gorm:"primaryKey"`
    Name            string     `gorm:"not null"`
    MainCategoryID  uint       `gorm:"not null"`
    MainCategory    Category   `gorm:"foreignKey:MainCategoryID"`
    SubCategoryID   *uint      `gorm:"default:null"`
    SubCategory     *Category  `gorm:"foreignKey:SubCategoryID"`
    DeletedAt       *time.Time `gorm:"index"` // Soft delete
    CreatedAt       time.Time
    UpdatedAt       time.Time
    TimeEntries     []TimeEntry `gorm:"constraint:OnDelete:CASCADE;"`
    Tags            []Tag       `gorm:"many2many:activity_tags;"`
}
```

### TimeEntry Model
```go
type TimeEntry struct {
    ID         uint       `gorm:"primaryKey"`
    ActivityID uint       `gorm:"not null;index"`
    Activity   Activity   `gorm:"foreignKey:ActivityID"`
    StartTime  time.Time  `gorm:"not null;index"`
    EndTime    *time.Time `gorm:"index"`
    Notes      *string    `gorm:"type:text"`
    CreatedAt  time.Time
}
```

---

## Common Queries

### Get all active activities (not deleted)
```go
db.Where("deleted_at IS NULL").Find(&activities)
```

### Get total time for an activity
```sql
SELECT 
    a.id,
    a.name,
    SUM(CAST((julianday(end_time) - julianday(start_time)) * 86400 AS INTEGER)) as total_seconds
FROM activities a
LEFT JOIN time_entries te ON a.id = te.activity_id
WHERE a.deleted_at IS NULL 
  AND te.end_time IS NOT NULL
GROUP BY a.id, a.name
```

### Get currently running timer
```sql
SELECT * FROM time_entries WHERE end_time IS NULL
```

### Get activities by tag
```go
db.Joins("JOIN activity_tags ON activity_tags.activity_id = activities.id").
   Where("activity_tags.tag_id = ? AND activities.deleted_at IS NULL", tagID).
   Find(&activities)
```

---

## Implementation Plan

### Phase 1: Models & Database
1. ✅ Create `backend/models/` directory
2. ✅ Create all GORM models
3. ✅ Create `backend/database/database.go` for connection
4. ✅ Create migration function with indexes
5. ✅ Seed initial categories

### Phase 2: API Routes
1. Categories CRUD
2. Tags CRUD
3. Activities CRUD (with soft delete)
4. Time Entries CRUD
5. Special endpoints:
   - Start timer
   - Stop timer
   - Get active timer
   - Get activity statistics

### Phase 3: Testing
1. Create sample data
2. Test all queries
3. Verify relationships and cascades

---

**Ready to implement! 🚀**
