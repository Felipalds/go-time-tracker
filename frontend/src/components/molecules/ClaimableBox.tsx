import React, { useState } from "react";

interface ClaimableBoxProps {
  count: number;
  onClaim: () => Promise<void>;
  disabled?: boolean;
}

export const ClaimableBox: React.FC<ClaimableBoxProps> = ({
  count,
  onClaim,
  disabled = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async () => {
    if (count <= 0 || disabled || isAnimating) return;

    setIsAnimating(true);
    try {
      await onClaim();
    } finally {
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  if (count <= 0) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isAnimating}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-slate-900 font-bold shadow-lg shadow-amber-500/30 transition-all ${
        isAnimating
          ? "scale-110 animate-bounce"
          : "hover:scale-105 hover:shadow-amber-500/50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {/* Box Icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={isAnimating ? "animate-bounce" : ""}
      >
        {/* Box body */}
        <rect x="3" y="8" width="18" height="13" rx="2" />
        {/* Box lid */}
        <rect
          x="2"
          y="5"
          width="20"
          height="4"
          rx="1"
          fill="rgba(255,255,255,0.3)"
        />
        {/* Ribbon vertical */}
        <rect x="10.5" y="5" width="3" height="16" fill="rgba(180,83,9,0.6)" />
        {/* Ribbon horizontal */}
        <rect x="3" y="10" width="18" height="3" fill="rgba(180,83,9,0.6)" />
        {/* Bow */}
        <circle cx="12" cy="5" r="2.5" fill="rgba(180,83,9,0.8)" />
      </svg>

      {/* Count Badge */}
      <span className="text-lg">x{count}</span>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 opacity-0 hover:opacity-20 transition-opacity" />

      {/* Sparkle animation when available */}
      {!isAnimating && (
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400" />
        </div>
      )}
    </button>
  );
};
