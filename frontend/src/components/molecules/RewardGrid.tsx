import React from "react";
import { RewardIcon } from "../atoms/RewardIcon";

interface Reward {
  id: number;
  reward_type: string;
  external_id: string;
  name: string;
  image_url: string;
  rarity: "common" | "rare" | "epic";
}

interface ChampionMastery {
  champion_id: string;
  mastery_level: number;
}

interface RewardGridProps {
  rewards: Reward[];
  mastery: ChampionMastery[];
  onOpenCollection: () => void;
}

export const RewardGrid: React.FC<RewardGridProps> = ({
  rewards,
  mastery,
  onOpenCollection,
}) => {
  // Get last 8 rewards
  const recentRewards = rewards.slice(0, 8);

  // Create mastery lookup
  const masteryLookup = mastery.reduce(
    (acc, m) => {
      acc[m.champion_id] = m.mastery_level;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (recentRewards.length === 0) {
    return (
      <div
        className="w-24 h-24 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center cursor-pointer hover:bg-white/[0.04] transition-colors"
        onClick={onOpenCollection}
      >
        <span className="text-slate-600 text-xs text-center px-2">
          No rewards yet
        </span>
      </div>
    );
  }

  return (
    <div
      className="w-[188px] grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors"
      onClick={onOpenCollection}
    >
      {recentRewards.map((reward) => (
        <RewardIcon
          key={reward.id}
          imageUrl={reward.image_url}
          name={reward.name}
          rarity={reward.rarity}
          masteryLevel={
            reward.reward_type === "champion"
              ? masteryLookup[reward.external_id]
              : undefined
          }
          size="sm"
        />
      ))}
      {/* Fill empty slots */}
      {Array.from({ length: Math.max(0, 8 - recentRewards.length) }).map(
        (_, i) => (
          <div
            key={`empty-${i}`}
            className="w-10 h-10 rounded-lg bg-white/[0.02] border border-white/[0.04]"
          />
        ),
      )}
    </div>
  );
};
