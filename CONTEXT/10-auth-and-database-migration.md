# Authentication System & Database Migration

## Overview

Two major changes needed for deployment:
1. **Authentication**: User login system to separate user data
2. **Database Migration**: SQLite → PostgreSQL for cloud deployment (Vercel/Render)

---

## Part 1: Authentication Options

### Option A: Email/Password (Traditional)

**How it works:**
- User registers with name, email, password
- Password hashed with bcrypt before storing
- Login returns JWT token stored in localStorage/cookie
- Token sent with each API request

**Implementation:**
```
Backend:
- User model (id, name, email, password_hash, created_at)
- POST /api/auth/register
- POST /api/auth/login
- JWT middleware for protected routes

Frontend:
- Register/Login forms
- Store JWT in localStorage
- Add Authorization header to all requests
```

**Pros:**
- Full control over user data
- No external dependencies
- Works offline (after login)
- No third-party costs
- Simple to understand

**Cons:**
- Must handle password reset flow (email sending)
- Must handle email verification
- Security responsibility on us (password storage, rate limiting)
- Users need to remember another password
- More code to write and maintain

**Complexity:** Medium
**Time to implement:** 4-6 hours

---

### Option B: Social Login (OAuth)

**Providers to consider:**
1. **Google** - Most common, everyone has Gmail
2. **GitHub** - Good for developer audience
3. **Discord** - Good for gaming audience (fits LoL theme!)

**How it works:**
1. User clicks "Login with Google"
2. Redirect to Google's OAuth page
3. User authorizes app
4. Google redirects back with auth code
5. Backend exchanges code for user info
6. Create/find user in database
7. Return JWT to frontend

**Implementation:**
```
Backend:
- User model (id, name, email, provider, provider_id, avatar_url, created_at)
- GET /api/auth/google (redirect to Google)
- GET /api/auth/google/callback (handle response)
- Similar for other providers

Frontend:
- "Login with Google" button
- Handle OAuth redirect
```

**Pros:**
- No password management
- No email verification needed
- Users trust Google/GitHub more than random site
- Faster signup (2 clicks)
- Get profile picture for free
- More secure (Google handles auth)

**Cons:**
- Depends on external services
- Need to register app with each provider
- More complex OAuth flow
- Users without Google/GitHub can't use app
- Provider API changes can break login

**Complexity:** Medium-High
**Time to implement:** 5-8 hours (per provider)

---

### Option C: Magic Link (Passwordless)

**How it works:**
1. User enters email
2. Backend sends email with unique login link
3. User clicks link
4. Backend verifies link, creates session
5. User is logged in

**Implementation:**
```
Backend:
- User model (id, name, email, created_at)
- MagicLink model (id, user_id, token, expires_at, used)
- POST /api/auth/magic-link (send email)
- GET /api/auth/verify?token=xxx (verify and login)

Frontend:
- Email input form
- "Check your email" message
- Handle verify redirect
```

**Pros:**
- No passwords to remember
- Very secure (email is the auth)
- Simple user experience
- No password reset flow needed

**Cons:**
- **Requires email sending service** (SendGrid, Resend, etc.)
- Slower login (wait for email)
- Email deliverability issues
- Users must have email access to login
- Monthly cost for email service

**Complexity:** Medium
**Time to implement:** 4-6 hours + email service setup

---

### Option D: Passkeys (WebAuthn) - Modern

**How it works:**
- Uses device biometrics (fingerprint, Face ID)
- No passwords at all
- Browser handles everything

**Pros:**
- Most secure option
- Great UX on supported devices
- No passwords

**Cons:**
- Not all browsers/devices support it
- Complex implementation
- Need fallback for unsupported devices
- Relatively new technology

**Complexity:** High
**Time to implement:** 8-12 hours

---

### Option E: Hybrid (Recommended)

**Combination: Email/Password + Google OAuth**

**Why this is best:**
1. **Google OAuth** for easy signup (most users)
2. **Email/Password** as fallback for users who don't want OAuth
3. Covers 99% of users
4. Can link accounts later (same email = same user)

**Implementation priority:**
1. Start with Email/Password (simpler, works immediately)
2. Add Google OAuth later (better UX)

---

## Recommendation

### For MVP: **Email/Password Only**

**Reasons:**
1. Simplest to implement
2. No external dependencies
3. Can add OAuth later without breaking changes
4. Full control over user experience
5. Works for all users

**Skip for MVP:**
- Email verification (trust the email initially)
- Password reset (manual reset via database if needed)
- Add these features after launch if needed

### Implementation Plan

**User Model:**
```go
type User struct {
    ID           uint      `gorm:"primarykey"`
    Name         string    `gorm:"type:varchar(100);not null"`
    Email        string    `gorm:"type:varchar(255);uniqueIndex;not null"`
    PasswordHash string    `gorm:"type:varchar(255);not null"`
    CreatedAt    time.Time
    UpdatedAt    time.Time
}
```

**API Endpoints:**
```
POST /api/auth/register
  Body: { name, email, password }
  Response: { user, token }

POST /api/auth/login
  Body: { email, password }
  Response: { user, token }

GET /api/auth/me
  Header: Authorization: Bearer <token>
  Response: { user }
```

**JWT Structure:**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "exp": 1234567890
}
```

**Security measures:**
- bcrypt for password hashing (cost factor 10)
- JWT with 7-day expiration
- Refresh token for extended sessions (optional)

---

## Part 2: Database Migration (SQLite → PostgreSQL)

### Why PostgreSQL?

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Deployment | File-based, hard to deploy | Cloud-native, easy to deploy |
| Concurrency | Single writer | Multiple concurrent writers |
| Scaling | Limited | Horizontal scaling |
| Vercel/Render | Not supported | Fully supported |
| Free tier | N/A | Render: 1GB free, Supabase: 500MB free |

### Migration Steps

**1. Update GORM dialect:**
```go
// Before (SQLite)
import "gorm.io/driver/sqlite"
db, err := gorm.Open(sqlite.Open("app.db"), &gorm.Config{})

// After (PostgreSQL)
import "gorm.io/driver/postgres"
dsn := "host=localhost user=postgres password=xxx dbname=timetracker port=5432"
db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
```

**2. Environment variables:**
```env
DATABASE_URL=postgres://user:password@host:5432/dbname
# or individual vars
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secret
DB_NAME=timetracker
```

**3. Model changes (minimal):**
- SQLite uses `INTEGER` for IDs, PostgreSQL uses `SERIAL`
- GORM handles this automatically
- No code changes needed for basic types

**4. Local development:**
- Option A: Use PostgreSQL locally via Docker
- Option B: Use free cloud PostgreSQL (Supabase/Render) for dev too

### PostgreSQL Hosting Options

| Provider | Free Tier | Paid | Best For |
|----------|-----------|------|----------|
| **Render** | 1GB, 90 days | $7/mo | Simple deployment |
| **Supabase** | 500MB, 2 projects | $25/mo | Extra features (auth, storage) |
| **Neon** | 512MB, unlimited | $19/mo | Serverless, branching |
| **Railway** | $5 free credit | Pay as you go | Easy setup |
| **Vercel Postgres** | 256MB | $20/mo | If using Vercel |

**Recommendation: Render**
- Generous free tier (1GB)
- Simple setup
- Same platform can host the Go backend
- Good for small projects

---

## Implementation Order

### Phase 1: Database Migration
1. Add PostgreSQL driver to Go backend
2. Update database connection to use env vars
3. Test locally with Docker PostgreSQL
4. Deploy database to Render
5. Migrate existing data (if any)

### Phase 2: Authentication (Email/Password)
1. Create User model
2. Add register endpoint with bcrypt
3. Add login endpoint with JWT
4. Add auth middleware
5. Update all endpoints to require auth
6. Add user_id foreign key to existing models
7. Update frontend with login/register pages
8. Store JWT and add to API requests

### Phase 3: Deploy
1. Deploy backend to Render
2. Deploy frontend to Vercel
3. Configure environment variables
4. Test end-to-end

### Phase 4: (Future) Add OAuth
1. Register app with Google
2. Add OAuth endpoints
3. Add "Login with Google" button
4. Link accounts by email

---

## Questions to Answer

1. **Do we need email verification for MVP?**
   - Recommendation: No, add later if spam becomes issue

2. **Do we need password reset for MVP?**
   - Recommendation: No, manual reset if needed

3. **Should we use Supabase Auth instead of custom?**
   - Supabase provides auth out of the box
   - But: adds dependency, less control, learning curve
   - Recommendation: Custom auth for learning, Supabase if want to ship faster

4. **Local development with Docker or cloud DB?**
   - Docker: faster, works offline, no internet needed
   - Cloud: same as production, no setup
   - Recommendation: Docker for local, cloud for prod
