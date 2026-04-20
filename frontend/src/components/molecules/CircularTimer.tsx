import React, { useState, useEffect } from "react";

interface CircularTimerProps {
  isRunning: boolean;
  isPaused: boolean;
  isStarting: boolean;
  activityName: string | null;
  startTime: Date | null;
  elapsedSeconds?: number; // Elapsed from backend (when paused, this is frozen)
  plannedDuration?: number | null; // Duration in seconds, null = free-running
  pausedDuration?: number; // Cumulative seconds paused
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDelete: () => void;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  isRunning,
  isPaused,
  isStarting,
  activityName,
  startTime,
  elapsedSeconds,
  plannedDuration,
  pausedDuration = 0,
  onStart,
  onPause,
  onResume,
  onStop,
  onDelete,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [showStopMenu, setShowStopMenu] = useState(false);

  // When paused, use the frozen elapsed time from backend
  useEffect(() => {
    if (isPaused && elapsedSeconds !== undefined) {
      setElapsed(elapsedSeconds);
      return;
    }

    if (!isRunning || !startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      // Subtract paused duration to get actual elapsed time
      setElapsed(diff - pausedDuration);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, startTime, pausedDuration, elapsedSeconds]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // For timed sessions: count down from planned duration
  // For free-running: count up in 25-min cycles
  const displayTime = plannedDuration
    ? Math.max(0, plannedDuration - elapsed) // Countdown: show remaining time
    : elapsed;                                // Count up: show elapsed time

  // Use planned duration if available, otherwise default to 25-min cycles
  const cycleTime = plannedDuration || (25 * 60);
  const progress = plannedDuration
    ? Math.min(elapsed / plannedDuration, 1) // 0-100% for timed sessions (fills up)
    : (elapsed % cycleTime) / cycleTime;      // Loop for free-running

  // Check if timer is complete (for timed sessions)
  const isComplete = plannedDuration && elapsed >= plannedDuration;

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const handleClick = () => {
    if (isStarting) return;
    if (isPaused) {
      onResume();
    } else if (isRunning) {
      onPause();
    } else {
      onStart();
    }
  };

  const getLabel = () => {
    if (isStarting) return "STARTING...";
    if (isPaused) return "PAUSED";
    if (isRunning && isComplete) return "COMPLETE!";
    if (isRunning) return "RUNNING";
    return "START";
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className={`timer-circle ${isRunning ? "timer-running" : ""} ${isStarting ? "opacity-70" : ""} ${isComplete ? "timer-complete" : ""}`}
        onClick={handleClick}
        style={{ cursor: isStarting ? "wait" : "pointer" }}
      >
        <svg className="progress-ring" viewBox="0 0 100 100">
          <circle className="progress-ring-circle" cx="50" cy="50" r={radius} />
          <circle
            className={`progress-ring-progress ${isComplete ? "complete" : ""}`}
            cx="50"
            cy="50"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={(isRunning || isPaused) ? strokeDashoffset : circumference}
            style={{
              stroke: isComplete ? '#10b981' : progress > 0.75 && plannedDuration ? '#eab308' : undefined
            }}
          />
        </svg>

        <div className="timer-content">
          <div className="timer-time">{formatTime(displayTime)}</div>
          <div className={`timer-label ${isComplete ? "text-green-400" : ""}`}>{getLabel()}</div>
        </div>

        {/* Completion indicator overlay */}
        {isComplete && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-green-500/10 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {activityName && (isRunning || isPaused) && (
        <div
          className="badge-accent badge"
          style={{ fontSize: "14px", padding: "8px 16px" }}
        >
          {activityName}
        </div>
      )}

      {/* Control Buttons - Show when running or paused */}
      {(isRunning || isPaused) && (
        <div className="flex justify-center mt-4">
          {/* Stop dropdown button */}
          <div className="relative">
            <button
              onClick={() => setShowStopMenu(!showStopMenu)}
              disabled={isStarting}
              className="px-6 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              STOP
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showStopMenu && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowStopMenu(false)}
                />

                {/* Dropdown menu */}
                <div className="absolute top-full mt-1 right-0 bg-slate-900 border border-white/10 rounded-lg overflow-hidden shadow-lg z-20 w-48">
                  <button
                    onClick={() => {
                      setShowStopMenu(false);
                      onStop();
                    }}
                    className="w-full px-4 py-3 text-left text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition-colors"
                  >
                    <div className="font-medium">Stop & Save</div>
                    <div className="text-xs text-slate-500">Finish activity</div>
                  </button>
                  <button
                    onClick={() => {
                      setShowStopMenu(false);
                      onDelete();
                    }}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border-t border-white/5"
                  >
                    <div className="font-medium">Delete Entry</div>
                    <div className="text-xs text-red-500/70">Remove completely</div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
