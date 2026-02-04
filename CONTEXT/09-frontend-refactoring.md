# Frontend Refactoring: Interfaces, Services & React Query

## Overview

Refactored the frontend to:
1. Centralize all TypeScript interfaces in `/interfaces` folder
2. Move all API calls to `/services` folder
3. Replace `fetch` with TanStack React Query for better caching, loading states, and error handling

## New Structure

```
frontend/src/
├── interfaces/
│   ├── index.ts              # Re-exports all interfaces
│   ├── Activity.ts
│   ├── Category.ts
│   ├── Tag.ts
│   ├── TimeEntry.ts
│   ├── Reward.ts
│   ├── ChampionMastery.ts
│   └── Resume.ts
├── services/
│   ├── api.ts                # Base API wrapper with typed methods
│   ├── activityService.ts
│   ├── categoryService.ts
│   ├── tagService.ts
│   ├── timeEntryService.ts
│   ├── rewardService.ts
│   └── resumeService.ts
└── hooks/
    ├── useActivities.ts      # useActivities, useCreateActivity, useUpdateActivity, useDeleteActivity
    ├── useCategories.ts      # useCategories
    ├── useTags.ts            # useTags
    ├── useTimeEntries.ts     # useActiveTimer, useStartTimer, useStopTimer
    ├── useRewards.ts         # useRewards, useRewardStatus, useClaimReward
    └── useResume.ts          # useResume
```

## Interfaces

### Activity.ts
```typescript
import type { Category } from "./Category";
import type { Tag } from "./Tag";

export interface Activity {
  id: number;
  name: string;
  main_category: Category;
  sub_category?: Category | null;
  tags?: Tag[];
  total_seconds?: number;
  total_formatted?: string;
  entry_count?: number;
  intervals_rewarded?: number;
}
```

### Category.ts
```typescript
export interface Category {
  id?: number;
  name: string;
}
```

### Tag.ts
```typescript
export interface Tag {
  id?: number;
  name: string;
}
```

### TimeEntry.ts
```typescript
export interface TimeEntry {
  id: number;
  activity_id: number;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
}

export interface ActiveTimer {
  id: number;
  activity_id: number;
  activity_name: string;
  start_time: string;
}
```

### Reward.ts
```typescript
import type { ChampionMastery } from "./ChampionMastery";

export type RewardType = "champion" | "item" | "skin" | "icon";
export type Rarity = "common" | "rare" | "epic";

export interface Reward {
  id: number;
  reward_type: RewardType;
  external_id: string;
  name: string;
  image_url: string;
  rarity: Rarity;
  created_at?: string;
}

export interface ClaimedReward extends Reward {
  is_duplicate?: boolean;
  mastery_level?: number;
}

export interface RewardStatus {
  total_claimable: number;
  activities: {
    activity_id: number;
    activity_name: string;
    claimable: number;
  }[];
}

export interface RewardsResponse {
  rewards: Reward[];
  mastery: ChampionMastery[];
}

export interface ClaimResponse {
  reward: ClaimedReward;
  intervals_remaining: number;
}
```

### ChampionMastery.ts
```typescript
export interface ChampionMastery {
  champion_id: string;
  champion_name: string;
  image_url: string;
  mastery_level: number;
  times_obtained: number;
}
```

### Resume.ts
```typescript
export type ResumePeriod = "today" | "week" | "month" | "year" | "all";

export interface ActivityResume {
  activity_id: number;
  activity_name: string;
  category_name: string;
  total_seconds: number;
  total_formatted: string;
  percentage: number;
  entry_count: number;
}

export interface ResumeData {
  period: ResumePeriod;
  total_seconds: number;
  total_formatted: string;
  activities: ActivityResume[];
}
```

## Services

### api.ts - Base API Wrapper
```typescript
const API_URL = "http://localhost:8085/api";

export const api = {
  get: async <T>(endpoint: string): Promise<T> => { ... },
  post: async <T>(endpoint: string, data?: unknown): Promise<T> => { ... },
  put: async <T>(endpoint: string, data: unknown): Promise<T> => { ... },
  delete: async (endpoint: string): Promise<void> => { ... },
};
```

**Why `<T>` generics?**
- The base API doesn't know the response type - it's determined when called
- Example: `api.get<{ activities: Activity[] }>('/activities')` - caller specifies the type

### Service Examples
```typescript
// activityService.ts
export const activityService = {
  getAll: () => api.get<{ activities: Activity[] }>("/activities"),
  getWithStats: () => api.get<{ activities: Activity[] }>("/activities/stats"),
  create: (data: CreateActivityData) => api.post<Activity>("/activities", data),
  update: (id: number, data: UpdateActivityData) => api.put<Activity>(`/activities/${id}`, data),
  delete: (id: number) => api.delete(`/activities/${id}`),
};

// rewardService.ts
export const rewardService = {
  getAll: () => api.get<RewardsResponse>("/rewards"),
  getStatus: () => api.get<RewardStatus>("/rewards/status"),
  claim: (activityId: number) => api.post<ClaimResponse>("/rewards/claim", { activity_id: activityId }),
};
```

## React Query Hooks

### Setup (main.tsx)
```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute - data considered fresh for 1 min
      retry: 1,             // Retry failed requests once
    },
  },
});
```

**What is `staleTime`?**
- Controls how long data is considered "fresh"
- `staleTime: 0` (default): Data immediately stale, refetch on every mount
- `staleTime: 60000` (1 min): No refetch if same query used within 1 minute
- Prevents duplicate API calls when navigating between components

### Hook Examples

```typescript
// useActivities.ts
export const useActivities = () => {
  return useQuery({
    queryKey: ["activities"],
    queryFn: () => activityService.getWithStats(),
    select: (data) => data.activities, // Transform response
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActivityData) => activityService.create(data),
    onSuccess: () => {
      // Invalidate related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

// useTimeEntries.ts
export const useActiveTimer = () => {
  return useQuery({
    queryKey: ["activeTimer"],
    queryFn: () => timeEntryService.getActive(),
    select: (data) => data.active_timer,
    refetchInterval: 5000, // Poll every 5 seconds
  });
};
```

### Usage in Components

**Before (HomePage.tsx):**
```typescript
const [activities, setActivities] = useState<Activity[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch(`${API_URL}/activities/stats`)
    .then(res => res.json())
    .then(data => setActivities(data.activities || []))
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
}, []);
```

**After (HomePage.tsx):**
```typescript
const { data: activities = [], isLoading } = useActivities();
```

## Benefits

### React Query Advantages
- **Automatic caching**: No duplicate requests for same data
- **Background refetching**: Data stays fresh automatically
- **Loading/error states**: Built-in `isLoading`, `isError`, `error`
- **Optimistic updates**: Better UX for mutations
- **Cache invalidation**: Related data updates automatically
- **Devtools**: Debug queries easily with React Query Devtools

### Code Organization
- **Single source of truth**: All interfaces in `/interfaces`
- **Reusable services**: API logic separated from components
- **Testable**: Easy to mock services in tests
- **Type safety**: Full TypeScript support throughout

## Files Modified

| File | Changes |
|------|---------|
| `main.tsx` | Added QueryClientProvider |
| `HomePage.tsx` | Replaced fetch with hooks, removed local interfaces |
| `ResumeSection.tsx` | Replaced fetch with useResume hook |
| `CollectionModal.tsx` | Import Reward, ChampionMastery from interfaces |
| `RewardGrid.tsx` | Import Reward, ChampionMastery from interfaces |
| `EditActivityDialog.tsx` | Import Activity from interfaces |
| `ActivityList.tsx` | Import Activity from interfaces |

## Files Created

| Folder | Files |
|--------|-------|
| `interfaces/` | Activity.ts, Category.ts, Tag.ts, TimeEntry.ts, Reward.ts, ChampionMastery.ts, Resume.ts, index.ts |
| `services/` | api.ts, activityService.ts, categoryService.ts, tagService.ts, timeEntryService.ts, rewardService.ts, resumeService.ts |
| `hooks/` | useActivities.ts, useCategories.ts, useTags.ts, useTimeEntries.ts, useRewards.ts, useResume.ts |
