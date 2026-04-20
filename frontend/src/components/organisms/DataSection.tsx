import React, { useState } from "react";
import { ResumeSection } from "./ResumeSection";
import { EditActivityDialog } from "../molecules/EditActivityDialog";
import { ActivityCard } from "../molecules/ActivityCard";
import type { Activity } from "@/interfaces";
import {
  useActivities,
  useUpdateActivity,
  useDeleteActivity,
} from "@/hooks/useActivities";
import { useCategories } from "@/hooks/useCategories";
import { useTags } from "@/hooks/useTags";
import { useActiveTimer, useStartTimer } from "@/hooks/useTimeEntries";

export const DataSection: React.FC = () => {
  const [isStarting, setIsStarting] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const { data: activities = [] } = useActivities();
  const { data: categories = [] } = useCategories();
  const { data: availableTags = [] } = useTags();
  const { data: activeTimer } = useActiveTimer();
  const startTimer = useStartTimer();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();

  const handleActivityClick = async (activityId: number) => {
    if (isStarting) return;

    if (activeTimer) {
      if (!window.confirm("Stop current timer and start new one?")) return;
    }

    setIsStarting(true);
    try {
      await startTimer.mutateAsync({ activityId, plannedDuration: null });
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

  return (
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
              <ActivityCard
                key={activity.id}
                activity={activity}
                isStarting={isStarting}
                onStart={handleActivityClick}
                onEdit={setEditingActivity}
                onDelete={handleDeleteActivity}
              />
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
};
