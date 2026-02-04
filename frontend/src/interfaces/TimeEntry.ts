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
