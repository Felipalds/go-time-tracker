import { api } from "./api";
import type { ActiveTimer } from "@/interfaces";

export const timeEntryService = {
  getActive: () =>
    api.get<{ active_timer: ActiveTimer | null }>("/time-entries/active"),

  start: (activityId: number, plannedDuration?: number | null) =>
    api.post("/time-entries/start", {
      activity_id: activityId,
      ...(plannedDuration !== undefined && plannedDuration !== null && { planned_duration: plannedDuration }),
    }),

  pause: () => api.post("/time-entries/pause"),

  resume: () => api.post("/time-entries/resume"),

  stop: () => api.post("/time-entries/stop"),

  delete: (id: number) => api.delete(`/time-entries/${id}`),
};
