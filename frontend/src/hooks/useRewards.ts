import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rewardService } from "@/services/rewardService";

export const useRewards = () => {
  return useQuery({
    queryKey: ["rewards"],
    queryFn: () => rewardService.getAll(),
  });
};

export const useRewardStatus = () => {
  return useQuery({
    queryKey: ["rewardStatus"],
    queryFn: () => rewardService.getStatus(),
  });
};

export const useClaimReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: number) => rewardService.claim(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["rewardStatus"] });
    },
  });
};
