import React, { useState, useEffect } from "react";
import { Button } from "../atoms/Button";

interface PlayButtonProps {
  isRunning: boolean;
  activityName: string | null;
  startTime: Date | null;
  onStart: () => void;
  onStop: () => void;
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  isRunning,
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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <Button
        variant="play"
        size="xl"
        onClick={isRunning ? onStop : onStart}
        className={`
          min-w-[500px] min-h-[200px]
          ${isRunning ? "animate-pulse bg-pixel-peach" : ""}
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl">{isRunning ? "⏹ STOP" : "▶ PLAY"}</div>
          <div className="text-3xl">{formatTime(elapsed)}</div>
        </div>
      </Button>

      {activityName && isRunning && (
        <div className="text-pixel-lg text-center bg-pixel-yellow px-6 py-3 pixel-border-thin max-w-md">
          {activityName}
        </div>
      )}
    </div>
  );
};
