import React from "react";
import { ActivityMenu } from "./ActivityMenu";
import type { Activity } from "@/interfaces";

interface ActivityCardProps {
  activity: Activity;
  isStarting: boolean;
  onStart: (id: number) => void;
  onEdit: (activity: Activity) => void;
  onDelete: (id: number) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  isStarting,
  onStart,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className={`w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all ${isStarting ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex justify-between items-center">
        <div
          className="flex-1 cursor-pointer"
          onClick={() => onStart(activity.id)}
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
            onClick={() => onStart(activity.id)}
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
            onEdit={() => onEdit(activity)}
            onDelete={() => onDelete(activity.id)}
          />
        </div>
      </div>
    </div>
  );
};
