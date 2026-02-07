import React, { useState, useRef } from "react";
import { CircularTimer } from "../molecules/CircularTimer";
import { RewardsPanel } from "../molecules/RewardsPanel";
import { ActivityCreationForm } from "../molecules/ActivityCreationForm";
import type { ClaimedReward } from "@/interfaces";
import { useCategories } from "@/hooks/useCategories";
import { useTags } from "@/hooks/useTags";
import {
  useActiveTimer,
  useStartTimer,
  useStopTimer,
} from "@/hooks/useTimeEntries";
import {
  useRewards,
  useRewardStatus,
  useClaimReward,
} from "@/hooks/useRewards";
import { useCreateActivity } from "@/hooks/useActivities";

interface TimerSectionProps {
  onRevealReward: (reward: ClaimedReward) => void;
  onOpenCollection: () => void;
}

export const TimerSection: React.FC<TimerSectionProps> = ({
  onRevealReward,
  onOpenCollection,
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const formDataRef = useRef<{ name: string; mainCategory: string; tags: string[] }>({
    name: "",
    mainCategory: "",
    tags: [],
  });

  const { data: categories = [] } = useCategories();
  const { data: availableTags = [] } = useTags();
  const { data: activeTimer } = useActiveTimer();
  const { data: rewardsData } = useRewards();
  const { data: rewardStatus } = useRewardStatus();

  const createActivity = useCreateActivity();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const claimReward = useClaimReward();

  const rewards = rewardsData?.rewards || [];
  const mastery = rewardsData?.mastery || [];
  const totalClaimable = rewardStatus?.total_claimable || 0;

  const handlePlay = async () => {
    if (isStarting) return;
    setIsStarting(true);

    try {
      const data = formDataRef.current;
      const newActivity = await createActivity.mutateAsync({
        name: data.name || "Work",
        main_category_name: data.mainCategory || "Work",
        sub_category_name: null,
        tag_names: data.tags,
      });

      await startTimer.mutateAsync(newActivity.id);

      // Reset form data
      formDataRef.current = { name: "", mainCategory: "", tags: [] };
    } catch (err) {
      console.error("Failed to start activity:", err);
      alert("Failed to start activity");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTimer.mutateAsync();
    } catch (err) {
      console.error("Failed to stop timer:", err);
    }
  };

  const handleClaimReward = async () => {
    if (
      claimReward.isPending ||
      !rewardStatus ||
      rewardStatus.total_claimable <= 0
    ) {
      return;
    }

    const claimableActivity = rewardStatus.activities.find(
      (a) => a.claimable > 0,
    );
    if (!claimableActivity) return;

    try {
      const result = await claimReward.mutateAsync(
        claimableActivity.activity_id,
      );
      onRevealReward(result.reward);
    } catch (err) {
      console.error("Failed to claim reward:", err);
      alert("Failed to claim reward");
    }
  };

  const handleFormUpdate = (data: { name: string; mainCategory: string; tags: string[] }) => {
    formDataRef.current = data;
  };

  return (
    <>
      {/* Timer with Rewards Panel */}
      <div className="relative">
        {/* Circular Timer - Centered */}
        <CircularTimer
          isRunning={!!activeTimer}
          isStarting={isStarting}
          activityName={activeTimer?.activity_name || null}
          startTime={activeTimer ? new Date(activeTimer.start_time) : null}
          onStart={handlePlay}
          onStop={handleStopTimer}
        />

        {/* Rewards Panel - Positioned to the right */}
        <RewardsPanel
          totalClaimable={totalClaimable}
          onClaim={handleClaimReward}
          claimDisabled={claimReward.isPending || !!activeTimer}
          rewards={rewards}
          mastery={mastery}
          onOpenCollection={onOpenCollection}
        />
      </div>

      {/* Form - Only show when not running */}
      {!activeTimer && (
        <ActivityCreationForm
          categories={categories}
          availableTags={availableTags}
          isStarting={isStarting}
          onSubmit={handlePlay}
          onFormChange={handleFormUpdate}
        />
      )}
    </>
  );
};
