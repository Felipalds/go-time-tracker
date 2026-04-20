# Render Deployment Plan

## Overview

Deploy the Go Pomodoro app to Render with:
- **Backend (Go)**: Web service with PostgreSQL database
- **Frontend (React)**: Static site
- Environment variables properly configured
- CORS configured for production

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Render Platform               │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │───▶│   Backend    │  │
│  │ Static Site  │    │ Web Service  │  │
│  │ (Vite Build) │    │   (Go API)   │  │
│  └──────────────┘    └───────┬──────┘  │
│                              │          │
│                      ┌───────▼──────┐   │
│                      │  PostgreSQL  │   │
│                      │   Database   │   │
│                      └──────────────┘   │
└─────────────────────────────────────────┘
```

---

## Prerequisites

- [x] Render account (free tier works)
- [x] GitHub repository
- [x] Code pushed to GitHub
- [ ] Environment variables identified
- [ ] .env files in .gitignore

---

## Current Issues to Fix

### Frontend
- ❌ Backend URL hardcoded: `http://localhost:8085/api`
  - Location: `frontend/src/services/api.ts`
  - Fix: Use `VITE_API_URL` environment variable

### Backend
- ❌ Database connection uses individual env vars or defaults
  - Location: `backend/database/database.go`
  - Current: Checks `DATABASE_URL` first (✅ Render-ready)
  - Fallback: Individual vars with hardcoded defaults (❌ needs fixing)
- ❌ CORS allows only localhost
  - Location: `backend/routes/routes.go`
  - Fix: Use `FRONTEND_URL` environment variable
- ❌ Server port hardcoded?
  - Need to check `backend/main.go`

---

## Step 1: Environment Variables Setup

### A. Backend Environment Variables

**Required for production:**
- `DATABASE_URL` - Provided automatically by Render PostgreSQL
- `JWT_SECRET` - Secret key for JWT tokens (generate strong random string)
- `PORT` - Provided automatically by Render (don't set manually)
- `FRONTEND_URL` - Frontend URL for CORS (e.g., `https://your-app.onrender.com`)

**Optional:**
- `GO_ENV` - Set to `production`
- `LOG_LEVEL` - Set to `info` or `error`

**Create `backend/.env.example`:**
```env
# Database (automatically set by Render)
DATABASE_URL=postgres://user:password@host:5432/dbname

# JWT Secret (REQUIRED - generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server (automatically set by Render)
PORT=8080

# CORS (set to your frontend URL)
FRONTEND_URL=http://localhost:5173

# Environment
GO_ENV=development
```

### B. Frontend Environment Variables

**Required for production:**
- `VITE_API_URL` - Backend API URL (e.g., `https://your-backend.onrender.com/api`)

**Create `frontend/.env.example`:**
```env
# Backend API URL
VITE_API_URL=http://localhost:8085/api
```

**Create `frontend/.env.development`:**
```env
VITE_API_URL=http://localhost:8085/api
```

**Create `frontend/.env.production`:**
```env
# This will be overridden by Render environment variable
VITE_API_URL=https://your-backend.onrender.com/api
```

### C. Update .gitignore

**Backend `.gitignore`:**
```
.env
.env.local
.env.*.local
```

**Frontend `.gitignore`:**
```
.env
.env.local
.env.production.local
.env.development.local
```

---

## Step 2: Code Changes

### A. Update Frontend API Base URL

**File:** `frontend/src/services/api.ts`

**Current:**
```ts
const BASE_URL = "http://localhost:8085/api";
```

**New:**
```ts
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8085/api";
```

### B. Update Backend CORS Configuration

**File:** `backend/routes/routes.go`

**Current:**
```go
AllowedOrigins: []string{"http://localhost:*", "http://127.0.0.1:*"},
```

**New:**
```go
frontendURL := os.Getenv("FRONTEND_URL")
if frontendURL == "" {
    frontendURL = "http://localhost:5173"
}

AllowedOrigins: []string{frontendURL, "http://localhost:*", "http://127.0.0.1:*"},
```

### C. Update Backend Database Defaults

**File:** `backend/database/database.go`

**Current:**
```go
host := getEnv("DB_HOST", "localhost")
port := getEnv("DB_PORT", "5432")
user := getEnv("DB_USER", "timetracker")
password := getEnv("DB_PASSWORD", "timetracker123")
dbname := getEnv("DB_NAME", "timetracker")
```

**Better:** Remove hardcoded defaults for production safety.

### D. Verify Backend Port Configuration

**File:** `backend/main.go` (need to check if PORT is configurable)

---

## Step 3: Render Setup

### A. Create PostgreSQL Database

1. Go to Render Dashboard
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `go-pomodoro-db`
   - **Database:** `timetracker`
   - **User:** `timetracker`
   - **Region:** Choose closest to you
   - **Plan:** Free
4. Click **"Create Database"**
5. Wait for provisioning (~2 minutes)
6. **Copy the Internal Database URL** (starts with `postgres://`)

### B. Deploy Backend (Go Web Service)

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `go-pomodoro-backend`
   - **Region:** Same as database
   - **Branch:** `master` (or `main`)
   - **Root Directory:** `backend`
   - **Runtime:** `Go`
   - **Build Command:** `go build -o main .`
   - **Start Command:** `./main`
   - **Plan:** Free
4. **Environment Variables** (click "Advanced"):
   ```
   DATABASE_URL = <paste Internal Database URL from step A>
   JWT_SECRET = <generate strong random string, e.g., use: openssl rand -base64 32>
   FRONTEND_URL = https://go-pomodoro-frontend.onrender.com (we'll update this later)
   GO_ENV = production
   ```
5. Click **"Create Web Service"**
6. Wait for deployment (~3-5 minutes)
7. **Copy the backend URL** (e.g., `https://go-pomodoro-backend.onrender.com`)

### C. Deploy Frontend (Static Site)

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `go-pomodoro-frontend`
   - **Branch:** `master` (or `main`)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. **Environment Variables**:
   ```
   VITE_API_URL = <paste backend URL from step B>/api
   ```
   Example: `https://go-pomodoro-backend.onrender.com/api`
5. Click **"Create Static Site"**
6. Wait for deployment (~2-3 minutes)
7. **Copy the frontend URL** (e.g., `https://go-pomodoro-frontend.onrender.com`)

### D. Update Backend CORS

1. Go to backend web service settings
2. Update environment variable:
   ```
   FRONTEND_URL = <paste frontend URL from step C>
   ```
   Example: `https://go-pomodoro-frontend.onrender.com`
3. Click **"Save Changes"**
4. Backend will auto-redeploy (~1 minute)

---

## Step 4: Verify Deployment

### A. Test Backend API

```bash
curl https://go-pomodoro-backend.onrender.com/api/auth/login
```

Expected: CORS headers present, accepts POST requests

### B. Test Frontend

1. Visit `https://go-pomodoro-frontend.onrender.com`
2. Try to register a new user
3. Try to login
4. Start a timer
5. Check browser console for errors

### C. Common Issues

**CORS errors:**
- Check `FRONTEND_URL` matches exactly (no trailing slash)
- Check backend logs in Render dashboard

**Database connection errors:**
- Verify `DATABASE_URL` is set correctly
- Check database is in same region as backend

**404 errors on refresh:**
- Add `_redirects` file to frontend public folder:
  ```
  /* /index.html 200
  ```

**API not responding:**
- Check backend logs for errors
- Verify `PORT` is not hardcoded (Render sets it dynamically)

---

## Step 5: Database Migrations

GORM AutoMigrate will run automatically on first backend startup. No manual migration needed.

If you need to seed data:
1. SSH into backend service (Render Shell)
2. Run seed command if you have one
3. Or use Render's PostgreSQL web shell to run SQL

---

## Step 6: Custom Domain (Optional)

### Frontend Custom Domain
1. Go to frontend static site settings
2. Click **"Custom Domain"**
3. Add your domain (e.g., `app.yourdomain.com`)
4. Add CNAME record in your DNS:
   ```
   CNAME app.yourdomain.com → go-pomodoro-frontend.onrender.com
   ```

### Backend Custom Domain
1. Go to backend web service settings
2. Click **"Custom Domain"**
3. Add your domain (e.g., `api.yourdomain.com`)
4. Add CNAME record in your DNS:
   ```
   CNAME api.yourdomain.com → go-pomodoro-backend.onrender.com
   ```

**Important:** Update `FRONTEND_URL` and `VITE_API_URL` after adding custom domains!

---

## Step 7: Monitoring & Maintenance

### Free Tier Limitations
- Backend spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- 750 hours/month free (shared across all services)

### Solutions for Cold Starts
1. **UptimeRobot** (free): Ping your backend every 10 minutes
2. **Render Cron Jobs**: Schedule a health check
3. **Upgrade to paid plan**: No cold starts

### Logs
- View logs in Render dashboard (last 7 days on free tier)
- Backend logs: `backend > Logs` tab
- Frontend build logs: `frontend > Events` tab

### Database Backups
- Free tier: 7 days of backups
- Manual backups: PostgreSQL dashboard → "Backup Now"

---

## Deployment Checklist

### Pre-Deployment
- [ ] Update frontend API URL to use `VITE_API_URL`
- [ ] Update backend CORS to use `FRONTEND_URL`
- [ ] Add `.env.example` files to both frontend and backend
- [ ] Add `.env` to `.gitignore`
- [ ] Generate strong `JWT_SECRET`
- [ ] Push code to GitHub

### Render Setup
- [ ] Create PostgreSQL database
- [ ] Deploy backend web service
- [ ] Deploy frontend static site
- [ ] Update backend `FRONTEND_URL` with frontend URL
- [ ] Verify CORS is working

### Testing
- [ ] Test user registration
- [ ] Test user login
- [ ] Test timer start/stop
- [ ] Test activity creation
- [ ] Test rewards system
- [ ] Test on mobile device

### Post-Deployment
- [ ] Set up uptime monitoring
- [ ] Configure custom domains (optional)
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor logs for errors

---

## Troubleshooting Guide

### "Failed to fetch" errors
**Cause:** CORS or wrong API URL
**Fix:**
1. Check browser console for exact error
2. Verify `VITE_API_URL` is correct in frontend
3. Verify `FRONTEND_URL` is correct in backend
4. Check backend logs for CORS errors

### Database connection failed
**Cause:** Wrong `DATABASE_URL` or database not ready
**Fix:**
1. Check `DATABASE_URL` is set in backend environment
2. Verify database status in Render dashboard
3. Check backend logs for exact error

### 404 on page refresh
**Cause:** Missing redirect rules for SPA
**Fix:**
1. Create `frontend/public/_redirects`:
   ```
   /* /index.html 200
   ```
2. Redeploy frontend

### Backend not starting
**Cause:** Build or runtime error
**Fix:**
1. Check backend logs in Render
2. Verify `go build` succeeds locally
3. Check `main.go` uses `PORT` env var

### Frontend blank page
**Cause:** Build error or wrong base URL
**Fix:**
1. Check frontend build logs
2. Verify `npm run build` works locally
3. Check browser console for errors
4. Verify `VITE_API_URL` is set

---

## Cost Estimates

### Free Tier (Render)
- **PostgreSQL:** Free (1 GB storage, shared CPU)
- **Backend:** Free (750 hours/month)
- **Frontend:** Free (100 GB bandwidth/month)
- **Total:** $0/month

### Limitations:
- Services spin down after inactivity
- Shared resources
- 7-day log retention

### Paid Tier (Starter)
- **PostgreSQL:** $7/month (10 GB storage)
- **Backend:** $7/month (always on, more resources)
- **Frontend:** Free
- **Total:** ~$14/month

Benefits:
- No cold starts
- Better performance
- More storage
- Priority support

---

## Next Steps After Deployment

1. **Set up environment variable management**
   - Use Render's environment groups for shared vars
   - Keep secrets in Render, not in code

2. **Add health check endpoint**
   - Create `/health` endpoint in backend
   - Use for monitoring

3. **Set up CI/CD**
   - Render auto-deploys on git push
   - Add GitHub Actions for tests before deploy

4. **Add error tracking**
   - Sentry for both frontend and backend
   - Get notified of production errors

5. **Performance monitoring**
   - Add logging for slow queries
   - Monitor API response times

---

## Useful Commands

### Generate JWT Secret
```bash
openssl rand -base64 32
```

### Test Backend Locally with Production-like Setup
```bash
export DATABASE_URL="postgres://..."
export JWT_SECRET="your-secret"
export FRONTEND_URL="http://localhost:5173"
cd backend && go run main.go
```

### Test Frontend Locally with Production API
```bash
# Create frontend/.env.local
echo "VITE_API_URL=https://your-backend.onrender.com/api" > .env.local
cd frontend && npm run dev
```

### Check Render Service Status
```bash
curl https://go-pomodoro-backend.onrender.com/health
```

---

## Resources

- [Render Documentation](https://render.com/docs)
- [Deploying Go Apps on Render](https://render.com/docs/deploy-go)
- [Deploying Static Sites on Render](https://render.com/docs/deploy-vite)
- [Environment Variables on Render](https://render.com/docs/environment-variables)
