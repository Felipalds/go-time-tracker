import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircularTimer } from "../components/molecules/CircularTimer";
import { ResumeSection } from "../components/organisms/ResumeSection";
import { ActivityMenu } from "../components/molecules/ActivityMenu";
import { EditActivityDialog } from "../components/molecules/EditActivityDialog";
import { RewardGrid } from "../components/molecules/RewardGrid";
import { ClaimableBox } from "../components/molecules/ClaimableBox";
import { CollectionModal } from "../components/organisms/CollectionModal";
import { RewardReveal } from "../components/molecules/RewardReveal";
import { useAuth } from "@/contexts/AuthContext";

import type { Activity, ClaimedReward } from "@/interfaces";
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from "@/hooks/useActivities";
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

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // React Query hooks
  const { data: activities = [] } = useActivities();
  const { data: categories = [] } = useCategories();
  const { data: availableTags = [] } = useTags();
  const { data: activeTimer } = useActiveTimer();
  const { data: rewardsData } = useRewards();
  const { data: rewardStatus } = useRewardStatus();

  // Mutations
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const claimReward = useClaimReward();

  // Local state
  const [isStarting, setIsStarting] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [revealedReward, setRevealedReward] = useState<ClaimedReward | null>(
    null,
  );
  const [showCollection, setShowCollection] = useState(false);

  // Derived data
  const rewards = rewardsData?.rewards || [];
  const mastery = rewardsData?.mastery || [];
  const totalClaimable = rewardStatus?.total_claimable || 0;

  const handlePlay = async () => {
    if (isStarting) return;
    setIsStarting(true);

    try {
      const name = activityName.trim() || "Work";
      const category = mainCategory.trim() || "Work";

      const newActivity = await createActivity.mutateAsync({
        name,
        main_category_name: category,
        sub_category_name: null,
        tag_names: selectedTags,
      });

      await startTimer.mutateAsync(newActivity.id);

      setActivityName("");
      setMainCategory("");
      setSelectedTags([]);
      setTagInput("");
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

  const handleActivityClick = async (activityId: number) => {
    if (isStarting) return;

    if (activeTimer) {
      if (!window.confirm("Stop current timer and start new one?")) return;
    }

    setIsStarting(true);
    try {
      await startTimer.mutateAsync(activityId);
    } catch (err) {
      console.error("Failed to start timer:", err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEditActivity = async (
    id: number,
    data: { name: string; main_category_name: string; tag_names: string[] },
  ) => {
    try {
      await updateActivity.mutateAsync({ id, data });
      setEditingActivity(null);
    } catch (err) {
      console.error("Failed to update activity:", err);
      alert("Failed to update activity");
    }
  };

  const handleDeleteActivity = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) {
      return;
    }

    try {
      await deleteActivity.mutateAsync(id);
    } catch (err) {
      console.error("Failed to delete activity:", err);
      alert("Failed to delete activity");
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
      setRevealedReward(result.reward);
    } catch (err) {
      console.error("Failed to claim reward:", err);
      alert("Failed to claim reward");
    }
  };

  const handleOpenCollection = () => {
    setShowCollection(true);
  };

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(mainCategory.toLowerCase()),
  );

  const filteredTags = availableTags.filter(
    (t) =>
      t.toLowerCase().includes(tagInput.toLowerCase()) &&
      !selectedTags.includes(t),
  );

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth">
      {/* Section 1: Timer */}
      <section className="h-screen snap-start snap-always flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto h-full flex flex-col items-center justify-center gap-8 relative">
          {/* User info & logout - top right */}
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <span className="text-slate-400 text-sm">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Header */}
          <h1 className="text-2xl text-slate-50 tracking-widest">
            Legends Time Tracker
          </h1>

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
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-8 flex flex-col items-center gap-4">
              {/* Claimable Box */}
              <ClaimableBox
                count={totalClaimable}
                onClaim={handleClaimReward}
                disabled={claimReward.isPending || !!activeTimer}
              />

              {/* Recent Rewards Grid */}
              <RewardGrid
                rewards={rewards}
                mastery={mastery}
                onOpenCollection={handleOpenCollection}
              />
            </div>
          </div>

          {/* Form - Only show when not running */}
          {!activeTimer && (
            <div className="w-full max-w-sm flex flex-col gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl z-50">
              {/* Activity Name */}
              <input
                type="text"
                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-slate-50 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.04]"
                placeholder="What are you working on?"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                disabled={isStarting}
              />

              {/* Category */}
              <div className="relative z-50">
                <input
                  type="text"
                  className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-slate-50 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.04]"
                  placeholder="Category (e.g., Work, Study)"
                  value={mainCategory}
                  onChange={(e) => setMainCategory(e.target.value)}
                  disabled={isStarting}
                />
                {mainCategory && filteredCategories.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/10 rounded-lg overflow-hidden">
                    {filteredCategories.slice(0, 5).map((cat, i) => (
                      <div
                        key={i}
                        className="px-4 py-2 text-slate-400 text-sm hover:bg-slate-800 hover:text-slate-50 cursor-pointer"
                        onClick={() => setMainCategory(cat)}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="relative z-40">
                <input
                  type="text"
                  className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-slate-50 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.04]"
                  placeholder="Add tags..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput) {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  disabled={isStarting}
                />
                {tagInput && filteredTags.length > 0 && (
                  <div className="absolute z-40 w-full mt-1 bg-slate-900 border border-white/10 rounded-lg overflow-hidden">
                    {filteredTags.slice(0, 5).map((tag, i) => (
                      <div
                        key={i}
                        className="px-4 py-2 text-slate-400 text-sm hover:bg-slate-800 hover:text-slate-50 cursor-pointer"
                        onClick={() => addTag(tag)}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedTags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-white"
                        disabled={isStarting}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scroll hint - positioned at bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-600 text-xs font-medium tracking-widest opacity-60 animate-bounce">
            <span>DATA</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </div>
        </div>
      </section>

      {/* Section 2: Data */}
      <section className="min-h-screen snap-start snap-always flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-xl flex flex-col items-center gap-12">
          {/* Resume Section */}
          <div className="w-full flex flex-col items-center">
            <h2 className="text-slate-400 mb-6 tracking-widest text-sm">
              RESUME
            </h2>
            <ResumeSection />
          </div>

          {/* Activities List */}
          {activities && activities.length > 0 && (
            <div className="w-full">
              <h2 className="text-slate-400 mb-6 tracking-widest text-sm">
                RECENT ACTIVITIES
              </h2>
              <div className="flex flex-col gap-4 w-full">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all ${isStarting ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <div className="flex justify-between items-center">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleActivityClick(activity.id)}
                      >
                        <h3 className="text-slate-50 mb-2 text-sm">
                          {activity.name}
                        </h3>
                        <p className="text-slate-600 text-xs">
                          {activity.main_category?.name}
                          {activity.sub_category &&
                            ` / ${activity.sub_category.name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className="text-right cursor-pointer"
                          onClick={() => handleActivityClick(activity.id)}
                        >
                          <div className="text-indigo-400 text-base">
                            {activity.total_formatted || "0s"}
                          </div>
                          {activity.tags && activity.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 justify-end">
                              {activity.tags.slice(0, 2).map((tag, i) => (
                                <span
                                  key={i}
                                  className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-xs font-semibold"
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <ActivityMenu
                          onEdit={() => setEditingActivity(activity)}
                          onDelete={() => handleDeleteActivity(activity.id)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Edit Activity Dialog */}
      {editingActivity && (
        <EditActivityDialog
          activity={editingActivity}
          categories={categories}
          availableTags={availableTags}
          onSave={handleEditActivity}
          onClose={() => setEditingActivity(null)}
        />
      )}

      {/* Reward Reveal Animation */}
      <RewardReveal
        reward={revealedReward}
        onClose={() => setRevealedReward(null)}
      />

      {/* Collection Modal */}
      {showCollection && (
        <CollectionModal
          rewards={rewards}
          mastery={mastery}
          onClose={() => setShowCollection(false)}
        />
      )}
    </div>
  );
};
