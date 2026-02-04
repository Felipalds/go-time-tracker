import React, { useState, useEffect } from "react";

interface CircularTimerProps {
  isRunning: boolean;
  isStarting: boolean;
  activityName: string | null;
  startTime: Date | null;
  onStart: () => void;
  onStop: () => void;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  isRunning,
  isStarting,
  activityName,
  startTime,
  onStart,
  onStop,
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning || !startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const cycleTime = 25 * 60;
  const progress = (elapsed % cycleTime) / cycleTime;

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const handleClick = () => {
    if (isStarting) return;
    if (isRunning) {
      onStop();
    } else {
      onStart();
    }
  };

  const getLabel = () => {
    if (isStarting) return "STARTING...";
    if (isRunning) return "PAUSE";
    return "START";
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className={`timer-circle ${isRunning ? "timer-running" : ""} ${isStarting ? "opacity-70" : ""}`}
        onClick={handleClick}
        style={{ cursor: isStarting ? "wait" : "pointer" }}
      >
        <svg className="progress-ring" viewBox="0 0 100 100">
          <circle className="progress-ring-circle" cx="50" cy="50" r={radius} />
          <circle
            className="progress-ring-progress"
            cx="50"
            cy="50"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={isRunning ? strokeDashoffset : circumference}
          />
        </svg>

        <div className="timer-content">
          <div className="timer-time">{formatTime(elapsed)}</div>
          <div className="timer-label">{getLabel()}</div>
        </div>
      </div>

      {activityName && isRunning && (
        <div
          className="badge-accent badge"
          style={{ fontSize: "14px", padding: "8px 16px" }}
        >
          {activityName}
        </div>
      )}
    </div>
  );
};
