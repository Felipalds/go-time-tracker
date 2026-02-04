import React, { useState, useEffect } from "react";
import { CircularTimer } from "../components/molecules/CircularTimer";

const API_URL = "http://localhost:8085/api";

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
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  // Task 2: Concurrency Lock
  const [isStarting, setIsStarting] = useState(false);

  // Form state
  const [activityName, setActivityName] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Fetch data
  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then((res) => res.json())
      .then((data) =>
        setCategories(data.categories?.map((c: any) => c.name) || []),
      )
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/tags`)
      .then((res) => res.json())
      .then((data) =>
        setAvailableTags(data.tags?.map((t: any) => t.name) || []),
      )
      .catch((err) => console.error("Failed to fetch tags:", err));
  }, []);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    fetchActiveTimer();
    const interval = setInterval(fetchActiveTimer, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = () => {
    fetch(`${API_URL}/activities/stats`)
      .then((res) => res.json())
      .then((data) => setActivities(data.activities || []))
      .catch((err) => console.error("Failed to fetch activities:", err));
  };

  const fetchActiveTimer = () => {
    fetch(`${API_URL}/time-entries/active`)
      .then((res) => res.json())
      .then((data) => setActiveTimer(data.active_timer))
      .catch((err) => console.error("Failed to fetch active timer:", err));
  };

  // Task 2: Auto-Provision - Create activity if needed, then start timer
  const handlePlay = async () => {
    // Prevent duplicate clicks
    if (isStarting) return;

    setIsStarting(true);

    try {
      // Use form values or defaults
      const name = activityName.trim() || "Work";
      const category = mainCategory.trim() || "Work";

      // Create the activity
      const response = await fetch(`${API_URL}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          main_category_name: category,
          sub_category_name: null,
          tag_names: selectedTags,
        }),
      });

      const newActivity = await response.json();

      // Start timer for the new activity
      await fetch(`${API_URL}/time-entries/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_id: newActivity.id }),
      });

      // Task 2: State Sync - Update UI immediately
      await fetchActiveTimer();
      await fetchActivities();

      // Clear form
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
      await fetch(`${API_URL}/time-entries/stop`, { method: "POST" });
      setActiveTimer(null);
      fetchActivities();
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
      await fetch(`${API_URL}/time-entries/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_id: activityId }),
      });
      await fetchActiveTimer();
    } catch (err) {
      console.error("Failed to start timer:", err);
    } finally {
      setIsStarting(false);
    }
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

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(mainCategory.toLowerCase()),
  );

  const filteredTags = availableTags.filter(
    (t) =>
      t.toLowerCase().includes(tagInput.toLowerCase()) &&
      !selectedTags.includes(t),
  );

  return (
    <div className="stage-wrapper bg-primary">
      <div className="main-container">
        {/* Header */}
        <h1 className="text-2xl text-primary tracking-widest">pomodoro</h1>

        {/* Circular Timer */}
        <CircularTimer
          isRunning={!!activeTimer}
          isStarting={isStarting}
          activityName={activeTimer?.activity_name || null}
          startTime={activeTimer ? new Date(activeTimer.start_time) : null}
          onStart={handlePlay}
          onStop={handleStopTimer}
        />

        {/* Form - Only show when not running */}
        {!activeTimer && (
          <div className="form-container">
            {/* Activity Name */}
            <input
              type="text"
              className="input-dark"
              placeholder="What are you working on?"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              disabled={isStarting}
            />

            {/* Category */}
            <div className="relative">
              <input
                type="text"
                className="input-dark"
                placeholder="Category (e.g., Work, Study)"
                value={mainCategory}
                onChange={(e) => setMainCategory(e.target.value)}
                disabled={isStarting}
              />
              {mainCategory && filteredCategories.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card rounded-lg overflow-hidden">
                  {filteredCategories.slice(0, 5).map((cat, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 text-secondary hover:bg-secondary hover:text-primary cursor-pointer"
                      style={{ fontSize: "14px" }}
                      onClick={() => setMainCategory(cat)}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="relative">
              <input
                type="text"
                className="input-dark"
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
                <div className="absolute z-10 w-full mt-1 bg-card rounded-lg overflow-hidden">
                  {filteredTags.slice(0, 5).map((tag, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 text-secondary hover:bg-secondary hover:text-primary cursor-pointer"
                      style={{ fontSize: "14px" }}
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
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag, i) => (
                  <span
                    key={i}
                    className="badge-accent badge flex items-center gap-2"
                    style={{ fontSize: "12px" }}
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

        {/* Activities List */}
        {activities.length > 0 && (
          <div className="activities-section">
            <h2
              className="text-secondary mb-6 tracking-widest"
              style={{ fontSize: "14px" }}
            >
              RECENT ACTIVITIES
            </h2>
            <div className="flex flex-col gap-4 w-full">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`w-full card-dark cursor-pointer flex justify-between items-center ${isStarting ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => handleActivityClick(activity.id)}
                >
                  <div>
                    <h3
                      className="text-primary mb-2"
                      style={{ fontSize: "14px" }}
                    >
                      {activity.name}
                    </h3>
                    <p className="text-muted" style={{ fontSize: "11px" }}>
                      {activity.main_category?.name}
                      {activity.sub_category &&
                        ` / ${activity.sub_category.name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-accent" style={{ fontSize: "16px" }}>
                      {activity.total_formatted || "0s"}
                    </div>
                    {activity.tags && activity.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 justify-end">
                        {activity.tags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="badge"
                            style={{ fontSize: "9px" }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
