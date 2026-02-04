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
