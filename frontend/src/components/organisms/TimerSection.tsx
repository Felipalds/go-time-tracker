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
  usePauseTimer,
  useResumeTimer,
  useDeleteTimer,
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
  const [timerMode, setTimerMode] = useState<'free' | 'timed'>('free');
  const [plannedMinutes, setPlannedMinutes] = useState(25);
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
  const pauseTimer = usePauseTimer();
  const resumeTimer = useResumeTimer();
  const stopTimer = useStopTimer();
  const deleteTimer = useDeleteTimer();
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

      // Calculate planned duration in seconds (null for free-running)
      const plannedDuration = timerMode === 'timed' ? plannedMinutes * 60 : null;

      await startTimer.mutateAsync({
        activityId: newActivity.id,
        plannedDuration
      });

      // Reset form data
      formDataRef.current = { name: "", mainCategory: "", tags: [] };
    } catch (err) {
      console.error("Failed to start activity:", err);
      alert("Failed to start activity");
    } finally {
      setIsStarting(false);
    }
  };

  const handlePauseTimer = async () => {
    try {
      await pauseTimer.mutateAsync();
    } catch (err) {
      console.error("Failed to pause timer:", err);
    }
  };

  const handleResumeTimer = async () => {
    try {
      await resumeTimer.mutateAsync();
    } catch (err) {
      console.error("Failed to resume timer:", err);
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTimer.mutateAsync();
    } catch (err) {
      console.error("Failed to stop timer:", err);
    }
  };

  const handleDeleteTimer = async () => {
    if (!activeTimer) return;

    if (!window.confirm("Are you sure you want to delete this timer entry?")) {
      return;
    }

    try {
      await deleteTimer.mutateAsync(activeTimer.id);
    } catch (err) {
      console.error("Failed to delete timer:", err);
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
      {/* Timer Mode Selector - Only show when not running */}
      {!activeTimer && (
        <div className="w-full max-w-2xl flex items-center justify-center gap-4 mb-6">
          {/* Mode Toggle */}
          <div className="flex bg-white/[0.03] border border-white/[0.08] rounded-xl p-1">
            <button
              onClick={() => setTimerMode('free')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timerMode === 'free'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:text-slate-50'
              }`}
            >
              Free Running
            </button>
            <button
              onClick={() => setTimerMode('timed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timerMode === 'timed'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:text-slate-50'
              }`}
            >
              Timed
            </button>
          </div>

          {/* Duration Input - Only show in timed mode */}
          {timerMode === 'timed' && (
            <div className="flex items-center gap-2">
              {/* Preset Buttons */}
              {[15, 25, 45, 60].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => setPlannedMinutes(minutes)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    plannedMinutes === minutes
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-slate-50 hover:border-white/[0.15]'
                  }`}
                >
                  {minutes}m
                </button>
              ))}

              {/* Custom Number Input */}
              <input
                type="number"
                min="1"
                max="240"
                value={plannedMinutes}
                onChange={(e) => setPlannedMinutes(Math.max(1, Math.min(240, Number(e.target.value))))}
                className="w-20 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-50 text-sm text-center focus:outline-none focus:border-indigo-400/40"
                placeholder="min"
              />

              {/* Time Picker */}
              <input
                type="time"
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':').map(Number);
                  setPlannedMinutes(hours * 60 + minutes);
                }}
                className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-50 text-sm focus:outline-none focus:border-indigo-400/40"
              />
            </div>
          )}
        </div>
      )}

      {/* Timer with Rewards Panel */}
      <div className="relative">
        {/* Circular Timer - Centered */}
        <CircularTimer
          isRunning={!!activeTimer && !activeTimer.paused_at}
          isPaused={!!activeTimer?.paused_at}
          isStarting={isStarting}
          activityName={activeTimer?.activity_name || null}
          startTime={activeTimer ? new Date(activeTimer.start_time) : null}
          elapsedSeconds={activeTimer?.elapsed_seconds}
          plannedDuration={activeTimer?.planned_duration}
          pausedDuration={activeTimer?.paused_duration || 0}
          onStart={handlePlay}
          onPause={handlePauseTimer}
          onResume={handleResumeTimer}
          onStop={handleStopTimer}
          onDelete={handleDeleteTimer}
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
