# Frontend Design - Pixelated Pokemon Style

## Date
2026-02-03

## Status
✅ **APPROVED** - Ready for Implementation

## Design Concept

Retro pixelated Pokemon-style interface with pastel colors and nostalgic vibes.

## Visual Style

### Color Palette (Pastel Pokemon)
```css
--pixel-pink: #FFB3D9
--pixel-blue: #B3D9FF
--pixel-yellow: #FFFACD
--pixel-green: #B3FFCC
--pixel-purple: #E6CCFF
--pixel-peach: #FFDAB3
--pixel-mint: #CCFFED
--pixel-lavender: #D9CCFF

--bg-primary: #F5F5DC (Beige/Cream background)
--bg-secondary: #FFE4E1 (Misty Rose)
--text-primary: #4A4A4A (Dark gray for readability)
--border-pixel: #8B8B8B (Gray for pixel borders)
```

### Typography
- **Main Font**: Press Start 2P (Google Fonts) - Classic pixelated font
- **Fallback**: Courier New, monospace
- Font sizes adjusted for readability (pixel fonts can be small)

### UI Elements
- **Pixel borders**: 4px solid borders with corner pixels for retro effect
- **Shadows**: Box shadows in pixel style (stepped/blocky)
- **Buttons**: Chunky with pixel corners, hover effects
- **Input fields**: Retro game input boxes with pixel borders

## Page Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│              TIME TRACKER                   │
│           (Pixel Title Banner)              │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│         ╔═══════════════════╗              │
│         ║                   ║              │
│         ║   ▶ PLAY/STOP    ║  (Big Button)│
│         ║     00:00:00      ║              │
│         ╚═══════════════════╝              │
│                                             │
│    ┌─────────────────────────────────┐    │
│    │ Activity Name                   │    │
│    └─────────────────────────────────┘    │
│                                             │
│    ┌─────────────────┐ ┌──────────────┐   │
│    │ Category ▼      │ │ Subcategory▼ │   │
│    └─────────────────┘ └──────────────┘   │
│                                             │
│    ┌─────────────────────────────────┐    │
│    │ Tags (autocomplete)             │    │
│    └─────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│        📋 YOUR ACTIVITIES                   │
│                                             │
│  ┌────────────────────────────────────┐   │
│  │ 🎮 React Development                │   │
│  │    Work > Frontend                  │   │
│  │    ⏱️  2h 30m • 🏷️ urgent, learning  │   │
│  └────────────────────────────────────┘   │
│                                             │
│  ┌────────────────────────────────────┐   │
│  │ 💪 Morning Workout                  │   │
│  │    Health > Cardio                  │   │
│  │    ⏱️  45m • 🏷️ health               │   │
│  └────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

## Component Structure (Atomic Design)

### Atoms
- `Button.tsx` - Pixel-style button component
- `Input.tsx` - Pixel-style input field
- `Badge.tsx` - Tag badge component
- `PixelBorder.tsx` - Reusable pixel border wrapper

### Molecules
- `ActivityForm.tsx` - Form with inputs for activity creation
- `AutocompleteInput.tsx` - Input with dropdown suggestions
- `ActivityCard.tsx` - Card displaying activity info
- `Timer.tsx` - Timer display component

### Organisms
- `PlayButton.tsx` - Big central play/stop button with timer
- `ActivityList.tsx` - List of all activities

### Templates
- `MainLayout.tsx` - Main page layout structure

### Pages
- `HomePage.tsx` - Main SPA page

## Features to Implement

### 1. Big Play/Stop Button
- Center of the screen
- Shows current activity name when running
- Shows elapsed time (live updating)
- Pixel-art play/stop icon
- Pastel gradient background
- Pulse animation when active

### 2. Activity Form
- **Activity Name**: Text input
- **Main Category**: Autocomplete dropdown (fetches from API)
- **Sub Category**: Autocomplete dropdown (optional)
- **Tags**: Multi-select autocomplete (chip display)

### 3. Activity List
- Display all activities with stats
- Show category, subcategory, tags
- Show total time tracked
- Pixel card design
- Click to start timer for that activity

## Implementation Plan

### Phase 1: Setup & Styling
1. Install pixel font (Press Start 2P)
2. Create pixel CSS utilities
3. Set up color theme
4. Create base pixel components (Button, Input, Card)

### Phase 2: Core Components
1. Big Play/Stop Button component
2. Timer display with live updates
3. Activity Form with all inputs
4. Autocomplete functionality

### Phase 3: API Integration
1. Fetch categories/tags for autocomplete
2. Create activity endpoint
3. Start/Stop timer endpoints
4. Fetch activities with stats

### Phase 4: Polish
1. Animations (pulse, hover effects)
2. Loading states
3. Error handling
4. Pixel borders and shadows

## Technical Notes

### State Management
- Use React hooks (useState, useEffect)
- Real-time timer updates with setInterval
- API calls with fetch

### Pixel Font Installation
```bash
npm install @fontsource/press-start-2p
```

Or via Google Fonts CDN in index.html

### Key Libraries Needed
- `react-select` or custom autocomplete
- `@fontsource/press-start-2p` for font

## Pixel Border Effect (CSS)

```css
.pixel-border {
  position: relative;
  background: var(--bg-primary);
  padding: 1rem;
}

.pixel-border::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(to right, black 4px, transparent 4px) 0 0,
    linear-gradient(to right, black 4px, transparent 4px) 0 100%;
  background-size: 8px 4px;
  background-repeat: repeat-x;
}
```

---

**Ready to implement!** 🎮✨
