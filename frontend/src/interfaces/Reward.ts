import type { ChampionMastery } from "./ChampionMastery";

export type RewardType = "champion" | "item" | "skin" | "icon";
export type Rarity = "common" | "rare" | "epic";

export interface Reward {
  id: number;
  reward_type: RewardType;
  external_id: string;
  name: string;
  image_url: string;
  rarity: Rarity;
  created_at?: string;
}

export interface ClaimedReward extends Reward {
  is_duplicate?: boolean;
  mastery_level?: number;
}

export interface RewardStatus {
  total_claimable: number;
  activities: {
    activity_id: number;
    activity_name: string;
    claimable: number;
  }[];
}

export interface RewardsResponse {
  rewards: Reward[];
  mastery: ChampionMastery[];
}

export interface ClaimResponse {
  reward: ClaimedReward;
  intervals_remaining: number;
}
