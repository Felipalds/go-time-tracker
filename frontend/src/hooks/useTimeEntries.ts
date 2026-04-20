import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timeEntryService } from "@/services/timeEntryService";

export const useActiveTimer = () => {
  return useQuery({
    queryKey: ["activeTimer"],
    queryFn: () => timeEntryService.getActive(),
    select: (data) => data.active_timer,
    refetchInterval: 5000,
  });
};

export const useStartTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, plannedDuration }: { activityId: number; plannedDuration?: number | null }) =>
      timeEntryService.start(activityId, plannedDuration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
    },
  });
};

export const usePauseTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => timeEntryService.pause(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
    },
  });
};

export const useResumeTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => timeEntryService.resume(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
    },
  });
};

export const useStopTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => timeEntryService.stop(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["rewardStatus"] });
    },
  });
};

export const useDeleteTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => timeEntryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
};
