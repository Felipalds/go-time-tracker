import React from "react";

interface RewardIconProps {
  imageUrl: string;
  name: string;
  rarity: "common" | "rare" | "epic";
  masteryLevel?: number;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const rarityStyles = {
  common: "border-slate-500",
  rare: "border-blue-500 shadow-blue-500/30",
  epic: "border-purple-500 shadow-purple-500/30 animate-pulse",
};

const sizeStyles = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

const masteryColors: Record<number, string> = {
  1: "bg-amber-700",
  2: "bg-amber-700",
  3: "bg-amber-700",
  4: "bg-slate-400",
  5: "bg-slate-400",
  6: "bg-yellow-500",
  7: "bg-yellow-500",
};

export const RewardIcon: React.FC<RewardIconProps> = ({
  imageUrl,
  name,
  rarity,
  masteryLevel,
  size = "md",
  onClick,
}) => {
  return (
    <div
      className={`relative rounded-lg overflow-hidden border-2 ${rarityStyles[rarity]} ${sizeStyles[size]} ${rarity !== "common" ? "shadow-lg" : ""} ${onClick ? "cursor-pointer hover:scale-105 transition-transform" : ""}`}
      onClick={onClick}
      title={name}
    >
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Mastery Badge */}
      {masteryLevel && masteryLevel > 0 && (
        <div
          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${masteryColors[masteryLevel] || "bg-amber-700"} border-2 border-slate-900 flex items-center justify-center`}
        >
          <span className="text-white text-xs font-bold">{masteryLevel}</span>
        </div>
      )}
    </div>
  );
};
