import { api } from "./api";
import type { ActiveTimer } from "@/interfaces";

export const timeEntryService = {
  getActive: () =>
    api.get<{ active_timer: ActiveTimer | null }>("/time-entries/active"),

  start: (activityId: number) =>
    api.post("/time-entries/start", { activity_id: activityId }),

  stop: () => api.post("/time-entries/stop"),
};
