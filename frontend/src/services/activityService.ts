import { api } from "./api";
import type { Activity } from "@/interfaces";

export interface CreateActivityData {
  name: string;
  main_category_name: string;
  sub_category_name?: string | null;
  tag_names?: string[];
}

export interface UpdateActivityData {
  name: string;
  main_category_name: string;
  tag_names?: string[];
}

export const activityService = {
  getAll: () => api.get<{ activities: Activity[] }>("/activities"),

  getWithStats: () => api.get<{ activities: Activity[] }>("/activities/stats"),

  create: (data: CreateActivityData) => api.post<Activity>("/activities", data),

  update: (id: number, data: UpdateActivityData) =>
    api.put<Activity>(`/activities/${id}`, data),

  delete: (id: number) => api.delete(`/activities/${id}`),
};
