# Collection UI & Reward Card

## Overview

The Collection UI allows users to view all their earned rewards in an organized modal, and inspect individual items with an interactive 3D card effect inspired by Pokemon TCG cards.

## Collection Modal

### Design
- **Smaller, centered modal** (max-width: 672px, max-height: 80vh)
- Dark background with blur effect
- Tabs for different reward types
- Grid layout for items
- Click outside to close

### Tabs
1. **Champions** - Shows all earned champions with mastery badges
2. **Items** - Shows unique items with duplicate count
3. **Skins** - Shows skins with landscape aspect ratio
4. **Icons** - Shows summoner icons

### Layout
```
┌────────────────────────────────────────┐
│  My Collection                    [X]  │
│  25 rewards • 10 champions • 2 M7      │
├────────────────────────────────────────┤
│ [Champions] [Items] [Skins] [Icons]    │
├────────────────────────────────────────┤
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│  │M5│ │M3│ │M1│ │M1│ │x2│ │  │ │  │  │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘  │
│  Ahri Jinx  Zed  Lux  Item Item Icon  │
│                                        │
└────────────────────────────────────────┘
```

### Grid Columns
- Champions/Items/Icons: 5-8 columns (responsive)
- Skins: 3-5 columns (wider cards for landscape images)

## Reward Card (3D Tilt Effect)

### Interaction
- **Mouse tracking**: Card tilts based on mouse position **anywhere on screen**
- **Not just on hover**: The card responds to mouse movement across the entire viewport
- **Smooth transitions**: 75ms ease-out for responsive feel
- **Click anywhere to close**: Closes only the card, not the collection modal

### 3D Effect Details
- Max rotation: 20 degrees on X and Y axes
- Perspective: 1000px for realistic depth
- Rotation calculated from card center relative to mouse position

```typescript
// Mouse position relative to screen center
const maxDistance = Math.max(window.innerWidth, window.innerHeight) / 2;
const rotateY = (mouseX / maxDistance) * 20;
const rotateX = -(mouseY / maxDistance) * 20;
```

### Holographic Shine Effect
- Linear gradient that shifts with card rotation
- Opacity increases with tilt intensity
- Creates a light reflection illusion

```css
background: linear-gradient(
  ${105 + rotation.y * 3}deg,
  transparent 20%,
  rgba(255, 255, 255, 0.4) 45%,
  rgba(255, 255, 255, 0.6) 50%,
  rgba(255, 255, 255, 0.4) 55%,
  transparent 80%
);
```

### Rarity Visual Effects

| Rarity | Border Color | Glow Color | Special Effect |
|--------|--------------|------------|----------------|
| Common | Slate/Gray | Slate shadow | None |
| Rare | Blue | Blue shadow | None |
| Epic | Purple | Purple shadow | Rainbow overlay on tilt |

### Epic Rainbow Effect
For epic rarity items, a rainbow gradient overlay appears:

```css
background: linear-gradient(${rotation.y * 10}deg,
  rgba(255,0,0,0.3),
  rgba(255,127,0,0.3),
  rgba(255,255,0,0.3),
  rgba(0,255,0,0.3),
  rgba(0,0,255,0.3),
  rgba(139,0,255,0.3)
);
mix-blend-mode: overlay;
```

### Card Structure
```
┌─────────────────────┐
│ Champion Name       │ <- Header (gradient bg)
│ Champion            │
├─────────────────────┤
│                     │
│     [IMAGE]         │ <- Square aspect ratio
│              [M7]   │ <- Mastery badge
│                     │
├─────────────────────┤
│ Epic          x3    │ <- Footer (rarity + count)
└─────────────────────┘
```

### Glow Effect
- Blurred circle underneath the card
- Color matches rarity
- Intensity increases with tilt
- Creates floating effect

## Component Props

### CollectionModal
```typescript
interface CollectionModalProps {
  rewards: Reward[];
  mastery: ChampionMastery[];
  onClose: () => void;
}
```

### RewardCard
```typescript
interface RewardCardProps {
  imageUrl: string;
  name: string;
  type: string;           // 'champion' | 'item' | 'skin' | 'icon'
  rarity: 'common' | 'rare' | 'epic';
  count?: number;         // For duplicates
  masteryLevel?: number;  // For champions
  onClose: () => void;
}
```

## File Structure

```
frontend/src/components/
├── molecules/
│   └── RewardCard.tsx      # 3D tilt card component
└── organisms/
    └── CollectionModal.tsx # Collection grid modal
```

## UX Flow

1. User clicks on RewardGrid (small icons next to timer)
2. CollectionModal opens (centered, smaller)
3. User browses tabs to see all rewards
4. User clicks on any item
5. RewardCard opens with 3D effect
6. Mouse movement anywhere tilts the card
7. Click anywhere closes RewardCard (modal stays open)
8. Click outside modal closes CollectionModal

## Technical Notes

- Uses `useEffect` with `window.addEventListener` for global mouse tracking
- Card uses CSS `transform-style: preserve-3d` for 3D effect
- `e.stopPropagation()` prevents click events from bubbling
- Z-index layering: Modal (z-50), Card (z-60)
- Responsive grid adapts to screen size
