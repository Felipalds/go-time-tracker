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
  elapsed_seconds?: number; // Elapsed time from backend (excluding pauses)
  planned_duration?: number | null; // Duration in seconds, null = free-running
  paused_at?: string | null; // ISO timestamp when paused, null = not paused
  paused_duration?: number; // Cumulative seconds paused
  status?: 'running' | 'paused';
}
