import { useQuery } from "@tanstack/react-query";
import { resumeService } from "@/services/resumeService";
import type { ResumePeriod } from "@/interfaces";

export const useResume = (period: ResumePeriod) => {
  return useQuery({
    queryKey: ["resume", period],
    queryFn: () => resumeService.get(period),
  });
};
