import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';

interface Activity {
  id: number;
  name: string;
  main_category: { name: string };
  sub_category?: { name: string } | null;
  tags?: { name: string }[];
  total_seconds?: number;
  total_formatted?: string;
  entry_count?: number;
}

interface ActivityListProps {
  activities: Activity[];
  onActivityClick: (activityId: number) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  onActivityClick,
}) => {
  if (activities.length === 0) {
    return (
      <div className="text-center text-pixel-base text-gray-500 py-8">
        No activities yet. Create one above! 👆
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-pixel-lg text-center mb-6 bg-pixel-lavender px-4 py-2 pixel-border">
        📋 YOUR ACTIVITIES
      </h2>

      {activities.map((activity) => (
        <Card
          key={activity.id}
          onClick={() => onActivityClick(activity.id)}
          className="hover:scale-[1.02] transition-transform"
        >
          <div className="space-y-2">
            {/* Activity Name */}
            <h3 className="text-pixel-base font-bold">
              🎮 {activity.name}
            </h3>

            {/* Categories */}
            <div className="text-pixel-sm text-gray-600">
              {activity.main_category.name}
              {activity.sub_category && ` > ${activity.sub_category.name}`}
            </div>

            {/* Stats and Tags */}
            <div className="flex flex-wrap items-center gap-2 text-pixel-sm">
              {activity.total_formatted && (
                <span className="bg-pixel-mint px-2 py-1 pixel-border-thin">
                  ⏱️ {activity.total_formatted}
                </span>
              )}

              {activity.tags && activity.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {activity.tags.map((tag, index) => (
                    <Badge key={index} color="purple">
                      🏷️ {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
