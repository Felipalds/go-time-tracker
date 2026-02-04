import React, { useEffect, useState } from "react";

interface RewardRevealProps {
  reward: {
    name: string;
    image_url: string;
    rarity: "common" | "rare" | "epic";
    reward_type: string;
    is_duplicate?: boolean;
    mastery_level?: number;
  } | null;
  onClose: () => void;
}

const rarityColors = {
  common: "from-slate-500 to-slate-700",
  rare: "from-blue-500 to-blue-700",
  epic: "from-purple-500 to-purple-700",
};

const rarityGlow = {
  common: "shadow-slate-500/50",
  rare: "shadow-blue-500/50",
  epic: "shadow-purple-500/50",
};

const rarityLabels = {
  common: "COMMON",
  rare: "RARE",
  epic: "EPIC",
};

export const RewardReveal: React.FC<RewardRevealProps> = ({
  reward,
  onClose,
}) => {
  const [stage, setStage] = useState<"opening" | "reveal" | "done">("opening");

  useEffect(() => {
    if (!reward) return;

    // Animation stages
    const timer1 = setTimeout(() => setStage("reveal"), 500);
    const timer2 = setTimeout(() => setStage("done"), 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [reward]);

  if (!reward) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative flex flex-col items-center transition-all duration-500 ${
          stage === "opening" ? "scale-50 opacity-0" : "scale-100 opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Rarity Label */}
        <div
          className={`mb-4 px-4 py-1 rounded-full bg-gradient-to-r ${rarityColors[reward.rarity]} text-white text-sm font-bold tracking-wider`}
        >
          {rarityLabels[reward.rarity]}
        </div>

        {/* Reward Image */}
        <div
          className={`relative w-40 h-40 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl ${rarityGlow[reward.rarity]} ${
            stage === "done" ? "animate-bounce" : ""
          }`}
        >
          <img
            src={reward.image_url}
            alt={reward.name}
            className="w-full h-full object-cover"
          />

          {/* Shine effect */}
          <div
            className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent transition-transform duration-1000 ${
              stage === "reveal" ? "translate-x-full" : "-translate-x-full"
            }`}
          />
        </div>

        {/* Reward Name */}
        <h2 className="mt-4 text-2xl font-bold text-white">{reward.name}</h2>
        <p className="text-slate-400 text-sm capitalize">{reward.reward_type}</p>

        {/* Duplicate / Mastery info */}
        {reward.is_duplicate && reward.mastery_level && (
          <div className="mt-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-semibold">
            Mastery Level {reward.mastery_level}!
          </div>
        )}

        {/* Click to close hint */}
        <p className="mt-6 text-slate-500 text-sm">Click anywhere to close</p>
      </div>
    </div>
  );
};
