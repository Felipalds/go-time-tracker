# Test Scripts

## Add Test Timer (`add_test_timer.go`)

This script allows you to create custom time entries for testing without waiting hours.

### How to Edit

Open the file and edit the values at the top:

```go
var (
    // Your user ID from the database
    userID = uint(1)

    // Activity details
    activityName     = "Test Activity"
    mainCategoryName = "Work"
    subCategoryName  = ""  // Leave empty for no subcategory

    // Duration in HOURS (1.5 = 1 hour 30 minutes)
    durationHours = 1.0

    // How long ago did it START? (2.0 = started 2 hours ago)
    hoursAgo = 2.0
)
```

### How to Run

From the `backend/scripts` directory:

```bash
cd backend/scripts
go run add_test_timer.go
```

### Examples

**Create a 1-hour activity that finished now:**
```go
durationHours = 1.0
hoursAgo = 1.0  // Started 1 hour ago, ended now
```

**Create a 3-hour activity that finished 2 hours ago:**
```go
durationHours = 3.0
hoursAgo = 5.0  // Started 5 hours ago, ended 2 hours ago
```

**Create a 30-minute activity:**
```go
durationHours = 0.5
hoursAgo = 0.5
```

### Finding Your User ID

**Option 1: Check the app**
- Login to the app
- Open browser DevTools (F12)
- Go to Application → Local Storage
- Look at the JWT token or check the API response

**Option 2: Query the database**
```bash
# Using psql
docker exec -it timetracker-db psql -U timetracker -d timetracker -c "SELECT id, name, email FROM users;"

# Or using any PostgreSQL client
SELECT id, name, email FROM users;
```

### Output Example

```
🚀 Adding test time entry...
=====================================
User ID:        1
Activity:       Test Activity
Category:       Work
Duration:       1.00 hours
Started:        2.00 hours ago
=====================================
✓ User found: John Doe (john@example.com)
✓ Found existing category: Work
✓ Using existing activity: Test Activity (ID: 5)

✅ SUCCESS! Time entry created:
   ID:         42
   Start:      2026-02-06 14:04:23
   End:        2026-02-06 15:04:23
   Duration:   1h 0m 0s (1.00 hours)

🎉 You can now see this entry in your app!
```

### Troubleshooting

**Error: "User with ID X not found"**
- Check your user ID in the database
- Make sure you're logged in and have created a user

**Error: "Failed to connect to database"**
- Make sure PostgreSQL is running: `docker-compose up -d`
- Check your `.env` file has correct database credentials

**Error: "no such file or directory: ../.env"**
- Make sure you're running from `backend/scripts/` directory
- Or the backend `.env` file exists
