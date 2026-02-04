import { api } from "./api";
import type { RewardsResponse, RewardStatus, ClaimResponse } from "@/interfaces";

export const rewardService = {
  getAll: () => api.get<RewardsResponse>("/rewards"),

  getStatus: () => api.get<RewardStatus>("/rewards/status"),

  claim: (activityId: number) =>
    api.post<ClaimResponse>("/rewards/claim", { activity_id: activityId }),
};
