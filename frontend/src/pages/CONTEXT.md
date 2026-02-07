# HomePage.tsx Refactoring Plan

## Problem

`HomePage.tsx` (464 lines) is doing too much: managing state for timers, activities, rewards, forms, tags, and rendering everything inline. The page should only orchestrate components — not contain business logic, inline forms, or activity card rendering.

---

## Current Responsibilities in HomePage.tsx

| Responsibility | Lines | Type |
|---|---|---|
| User header (name + logout) | 211–219 | Component |
| Timer + Rewards panel layout | 227–254 | Component |
| Activity creation form (name, category, tags) | 257–346 | Component |
| Activity card rendering (inline map) | 383–431 | Component |
| Scroll hint indicator | 349–361 | Component |
| `handlePlay` (create activity + start timer) | 70–97 | Service |
| `handleStopTimer` | 99–105 | Service |
| `handleActivityClick` (start timer for existing) | 107–122 | Service |
| `handleEditActivity` | 124–135 | Service |
| `handleDeleteActivity` | 137–148 | Service |
| `handleClaimReward` | 150–173 | Service |
| `handleLogout` | 190–193 | Service |
| `addTag` / `removeTag` | 179–188 | Helper |
| `filteredCategories` / `filteredTags` | 195–203 | Helper |

---

## Extraction Plan

### 1. New Components

#### `components/molecules/UserHeader.tsx`
- Extract the user info + logout button (lines 211–219).
- **Props:** `userName: string`, `onLogout: () => void`

#### `components/organisms/TimerSection.tsx`
- Extract the entire timer area: `CircularTimer` + `RewardsPanel` + `ActivityCreationForm`.
- This component manages its own local form state (`activityName`, `mainCategory`, `selectedTags`, `tagInput`, `isStarting`).
- Uses hooks: `useActiveTimer`, `useCategories`, `useTags`, `useCreateActivity`, `useStartTimer`, `useStopTimer`, `useRewardStatus`, `useRewards`, `useClaimReward`.
- Handles: `handlePlay`, `handleStopTimer`, `handleClaimReward`.
- **Props:** `onRevealReward: (reward: ClaimedReward) => void`, `onOpenCollection: () => void`

#### `components/molecules/ActivityCreationForm.tsx`
- Extract the form with activity name, category autocomplete, tag autocomplete, and selected tags display (lines 257–346).
- Manages its own form state internally.
- **Props:** `categories: string[]`, `availableTags: string[]`, `isStarting: boolean`, `onSubmit: (data: { name: string; mainCategory: string; tags: string[] }) => void`
- Uses helpers: `addTag`, `removeTag`, `filteredCategories`, `filteredTags`.

#### `components/molecules/RewardsPanel.tsx`
- Extract the rewards panel to the right of the timer (lines 239–253).
- **Props:** `totalClaimable: number`, `onClaim: () => void`, `claimDisabled: boolean`, `rewards: Reward[]`, `mastery: ChampionMastery[]`, `onOpenCollection: () => void`

#### `components/molecules/ActivityCard.tsx`
- Extract the individual activity card rendered inside the `.map()` (lines 384–430).
- **Props:** `activity: Activity`, `isStarting: boolean`, `onStart: (id: number) => void`, `onEdit: (activity: Activity) => void`, `onDelete: (id: number) => void`

#### `components/molecules/ScrollHint.tsx`
- Extract the scroll-down indicator (lines 349–361).
- **Props:** `label: string` (defaults to "DATA")
1. this is not needed!

#### `components/organisms/DataSection.tsx`
- Extract the entire Section 2: ResumeSection + activities list.
- Uses hooks: `useActivities`, `useActiveTimer`.
- Handles: `handleActivityClick`, `handleEditActivity`, `handleDeleteActivity`.
- **Props:** `onEditActivity: (activity: Activity) => void` (or manages edit dialog internally)
1. Inside this, also separate the list from the chart. But on the DataSection must be the filter, so the filter can be applied to both (list and chart)

### 2. New Helpers — `helpers/filterHelpers.ts`

Create `frontend/src/helpers/filterHelpers.ts`:

```ts
export function filterBySubstring(items: string[], query: string, exclude?: string[]): string[] {
  const lower = query.toLowerCase();
  return items.filter(
    (item) => item.toLowerCase().includes(lower) && !(exclude || []).includes(item)
  );
}
```

Used by `ActivityCreationForm` and `EditActivityDialog` to filter categories and tags.

### 3. New Helpers — `helpers/tagHelpers.ts`

Create `frontend/src/helpers/tagHelpers.ts`:

```ts
export function addTag(selectedTags: string[], tag: string): string[] {
  if (tag && !selectedTags.includes(tag)) {
    return [...selectedTags, tag];
  }
  return selectedTags;
}

export function removeTag(selectedTags: string[], tag: string): string[] {
  return selectedTags.filter((t) => t !== tag);
}
```

### 4. Interfaces — No New Interfaces Needed

All required interfaces (`Activity`, `ClaimedReward`, `Reward`, `ChampionMastery`, `RewardStatus`) already exist in `src/interfaces/`. No new interfaces are needed.

However, **component prop types** should be defined as interfaces co-located with each component (e.g., `ActivityCardProps`, `UserHeaderProps`).

### 5. Services — No New Services Needed

The handler functions (`handlePlay`, `handleStopTimer`, etc.) are **not pure service calls** — they combine React Query mutations with local state updates (e.g., `setIsStarting`, `setRevealedReward`). They belong in the components that own that state (e.g., `TimerSection`, `DataSection`), not in a standalone service file.

The actual API calls are already properly abstracted in `src/services/`.

---

## Resulting HomePage.tsx (Target)

```tsx
export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [revealedReward, setRevealedReward] = useState<ClaimedReward | null>(null);
  const [showCollection, setShowCollection] = useState(false);

  const { data: rewardsData } = useRewards();
  const rewards = rewardsData?.rewards || [];
  const mastery = rewardsData?.mastery || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth">
      {/* Section 1: Timer */}
      <section className="h-screen snap-start snap-always flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto h-full flex flex-col items-center justify-center gap-8 relative">
          <UserHeader userName={user?.name || ""} onLogout={handleLogout} />
          <h1 className="text-2xl text-slate-50 tracking-widest">Legends Time Tracker</h1>
          <TimerSection
            onRevealReward={setRevealedReward}
            onOpenCollection={() => setShowCollection(true)}
          />
          <ScrollHint label="DATA" />
        </div>
      </section>

      {/* Section 2: Data */}
      <section className="min-h-screen snap-start snap-always flex items-center justify-center p-4 py-12">
        <DataSection />
      </section>

      {/* Modals */}
      <RewardReveal reward={revealedReward} onClose={() => setRevealedReward(null)} />
      {showCollection && (
        <CollectionModal rewards={rewards} mastery={mastery} onClose={() => setShowCollection(false)} />
      )}
    </div>
  );
};
```

---

## File Creation Summary

| Action | Path |
|---|---|
| Create | `src/components/molecules/UserHeader.tsx` |
| Create | `src/components/molecules/ActivityCreationForm.tsx` |
| Create | `src/components/molecules/RewardsPanel.tsx` |
| Create | `src/components/molecules/ActivityCard.tsx` |
| Create | `src/components/molecules/ScrollHint.tsx` |
| Create | `src/components/organisms/TimerSection.tsx` |
| Create | `src/components/organisms/DataSection.tsx` |
| Create | `src/helpers/filterHelpers.ts` |
| Create | `src/helpers/tagHelpers.ts` |
| Rewrite | `src/pages/HomePage.tsx` |

---

## Dependency Graph

```
HomePage
├── UserHeader (molecule)
├── TimerSection (organism)
│   ├── CircularTimer (molecule, existing)
│   ├── RewardsPanel (molecule, new)
│   │   ├── ClaimableBox (molecule, existing)
│   │   └── RewardGrid (molecule, existing)
│   └── ActivityCreationForm (molecule, new)
│       └── helpers/filterHelpers, helpers/tagHelpers
├── ScrollHint (molecule, new)
├── DataSection (organism, new)
│   ├── ResumeSection (organism, existing)
│   ├── ActivityCard (molecule, new)
│   ├── ActivityMenu (molecule, existing)
│   └── EditActivityDialog (molecule, existing)
├── RewardReveal (molecule, existing)
└── CollectionModal (organism, existing)
```

---

## Implementation Order

1. `helpers/filterHelpers.ts` + `helpers/tagHelpers.ts` (no dependencies)
2. `ScrollHint.tsx` + `UserHeader.tsx` (simple, no dependencies)
3. `ActivityCard.tsx` (used by DataSection)
4. `RewardsPanel.tsx` (used by TimerSection)
5. `ActivityCreationForm.tsx` (uses helpers)
6. `DataSection.tsx` (uses ActivityCard, existing components)
7. `TimerSection.tsx` (uses RewardsPanel, ActivityCreationForm, existing components)
8. Rewrite `HomePage.tsx` (uses all new components)
