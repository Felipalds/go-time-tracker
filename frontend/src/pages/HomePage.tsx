import React, { useState, useEffect } from 'react';
import { PlayButton } from '../components/molecules/PlayButton';
import { ActivityForm } from '../components/molecules/ActivityForm';
import { ActivityList } from '../components/organisms/ActivityList';

const API_URL = 'http://localhost:8081/api';

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

interface ActiveTimer {
  id: number;
  activity_id: number;
  activity_name: string;
  start_time: string;
}

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories.map((c: any) => c.name));
      })
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  // Fetch tags
  useEffect(() => {
    fetch(`${API_URL}/tags`)
      .then(res => res.json())
      .then(data => {
        setTags(data.tags.map((t: any) => t.name));
      })
      .catch(err => console.error('Failed to fetch tags:', err));
  }, []);

  // Fetch activities with stats
  useEffect(() => {
    fetchActivities();
  }, []);

  // Check for active timer
  useEffect(() => {
    fetchActiveTimer();
    const interval = setInterval(fetchActiveTimer, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = () => {
    fetch(`${API_URL}/activities/stats`)
      .then(res => res.json())
      .then(data => {
        setActivities(data.activities || []);
      })
      .catch(err => console.error('Failed to fetch activities:', err));
  };

  const fetchActiveTimer = () => {
    fetch(`${API_URL}/time-entries/active`)
      .then(res => res.json())
      .then(data => {
        setActiveTimer(data.active_timer);
      })
      .catch(err => console.error('Failed to fetch active timer:', err));
  };

  const handleCreateActivity = async (formData: {
    name: string;
    mainCategory: string;
    subCategory: string;
    tags: string[];
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          main_category_name: formData.mainCategory,
          sub_category_name: formData.subCategory || null,
          tag_names: formData.tags,
        }),
      });

      const newActivity = await response.json();

      // Start timer for the new activity
      await handleStartTimer(newActivity.id);

      // Refresh activities
      fetchActivities();
    } catch (err) {
      console.error('Failed to create activity:', err);
      alert('Failed to create activity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTimer = async (activityId: number) => {
    try {
      await fetch(`${API_URL}/time-entries/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activityId }),
      });

      await fetchActiveTimer();
    } catch (err) {
      console.error('Failed to start timer:', err);
      alert('Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    try {
      await fetch(`${API_URL}/time-entries/stop`, {
        method: 'POST',
      });

      setActiveTimer(null);
      fetchActivities();
    } catch (err) {
      console.error('Failed to stop timer:', err);
      alert('Failed to stop timer');
    }
  };

  const handleActivityClick = async (activityId: number) => {
    if (activeTimer) {
      const confirm = window.confirm('Stop current timer and start new one?');
      if (!confirm) return;
    }

    await handleStartTimer(activityId);
  };

  return (
    <div className="min-h-screen bg-bg-primary py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <h1 className="text-pixel-2xl text-center bg-pixel-pink px-6 py-4 pixel-border">
          ⏰ TIME TRACKER
        </h1>

        {/* Play Button */}
        <PlayButton
          isRunning={!!activeTimer}
          activityName={activeTimer?.activity_name || null}
          startTime={activeTimer ? new Date(activeTimer.start_time) : null}
          onStart={() => alert('Create an activity below to start tracking!')}
          onStop={handleStopTimer}
        />

        {/* Activity Form */}
        <ActivityForm
          categories={categories}
          tags={tags}
          onSubmit={handleCreateActivity}
          disabled={isLoading}
        />

        {/* Activity List */}
        <ActivityList
          activities={activities}
          onActivityClick={handleActivityClick}
        />
      </div>
    </div>
  );
};
