import { api } from "./api";
import type { ResumeData, ResumePeriod } from "@/interfaces";

export const resumeService = {
  get: (period: ResumePeriod) => api.get<ResumeData>(`/resume?period=${period}`),
};
