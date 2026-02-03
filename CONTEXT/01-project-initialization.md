# Project Initialization - Time Tracker

## Date
2026-02-03

## Project Goal
Build a Time Tracker application to track activities throughout the day.

## Tech Stack

### Backend
- **Language:** Go
- **HTTP Framework:** Chi (lightweight, idiomatic router)
- **Logging:** Uber Zap (structured, high-performance logging)
- **Database:** SQLite (file-based, zero-config)
- **ORM:** GORM (Go ORM with nice API)

### Frontend
- **Framework:** React
- **Build Tool:** Vite (fast, modern build tool)
- **UI Components:** Shadcn UI (headless, accessible components)
- **Styling:** Tailwind CSS (utility-first CSS)
- **Architecture:** Atomic Design (atoms → molecules → organisms → templates → pages)

## Project Structure
```
go-pomodoro/
├── backend/          # Go backend API
├── frontend/         # React frontend
└── CONTEXT/          # Documentation and plans
```

## Initialization Steps

### Step 1: Backend Initialization
1. Initialize Go module in `backend/` folder
2. Install dependencies:
   - Chi router
   - Uber Zap logger
   - GORM + SQLite driver
3. Commit: "Initialize Go backend with dependencies"

### Step 2: Frontend Initialization
1. Create Vite + React app in `frontend/` folder
2. Install dependencies:
   - Tailwind CSS
   - Shadcn UI
3. Set up Atomic Design folder structure
4. Commit: "Initialize React frontend with Vite, Tailwind, and Shadcn"

Let's start!
