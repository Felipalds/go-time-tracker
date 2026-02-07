import React from "react";
import { ClaimableBox } from "./ClaimableBox";
import { RewardGrid } from "./RewardGrid";
import type { Reward, ChampionMastery } from "@/interfaces";

interface RewardsPanelProps {
  totalClaimable: number;
  onClaim: () => Promise<void>;
  claimDisabled: boolean;
  rewards: Reward[];
  mastery: ChampionMastery[];
  onOpenCollection: () => void;
}

export const RewardsPanel: React.FC<RewardsPanelProps> = ({
  totalClaimable,
  onClaim,
  claimDisabled,
  rewards,
  mastery,
  onOpenCollection,
}) => {
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-8 flex flex-col items-center gap-4">
      <ClaimableBox
        count={totalClaimable}
        onClaim={onClaim}
        disabled={claimDisabled}
      />
      <RewardGrid
        rewards={rewards}
        mastery={mastery}
        onOpenCollection={onOpenCollection}
      />
    </div>
  );
};
