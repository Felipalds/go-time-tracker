# Pages

This folder contains the actual pages of the application with real content and data.

Pages are the top level of the Atomic Design hierarchy:
- They use templates for layout structure
- They consume organisms, molecules, and atoms
- They handle data fetching and state management
- They connect to the backend API

## Example Structure

```
pages/
├── HomePage.tsx          # Landing/home page
├── DashboardPage.tsx     # Main dashboard with timer
├── HistoryPage.tsx       # Activity history
└── SettingsPage.tsx      # User settings
```
