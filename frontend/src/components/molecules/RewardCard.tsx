import React, { useState, useRef, useEffect } from "react";

interface RewardCardProps {
  imageUrl: string;
  name: string;
  type: string;
  rarity: "common" | "rare" | "epic";
  count?: number;
  masteryLevel?: number;
  onClose: () => void;
}

export const RewardCard: React.FC<RewardCardProps> = ({
  imageUrl,
  name,
  type,
  rarity,
  count = 1,
  masteryLevel,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // Track mouse movement anywhere on screen
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      // Calculate rotation based on distance from card center (max 20 degrees)
      const maxDistance = Math.max(window.innerWidth, window.innerHeight) / 2;
      const rotateY = (mouseX / maxDistance) * 20;
      const rotateX = -(mouseY / maxDistance) * 20;

      setRotation({ x: rotateX, y: rotateY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const rarityColors = {
    common: {
      border: "border-slate-400",
      glow: "shadow-slate-400/30",
      gradient: "from-slate-600 to-slate-800",
      text: "text-slate-300",
    },
    rare: {
      border: "border-blue-400",
      glow: "shadow-blue-500/40",
      gradient: "from-blue-600 to-blue-900",
      text: "text-blue-300",
    },
    epic: {
      border: "border-purple-400",
      glow: "shadow-purple-500/50",
      gradient: "from-purple-600 to-purple-900",
      text: "text-purple-300",
    },
  };

  const colors = rarityColors[rarity];

  const typeLabels: Record<string, string> = {
    champion: "Champion",
    item: "Item",
    skin: "Skin",
    icon: "Summoner Icon",
  };

  // Calculate shine intensity based on rotation
  const shineIntensity =
    Math.min(Math.abs(rotation.x) + Math.abs(rotation.y), 20) / 20;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        ref={cardRef}
        className="relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          perspective: "1000px",
        }}
      >
        {/* Card */}
        <div
          className={`relative w-72 rounded-2xl overflow-hidden border-2 ${colors.border} shadow-2xl ${colors.glow} transition-transform duration-75 ease-out`}
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Holographic shine effect */}
          <div
            className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-150"
            style={{
              opacity: 0.15 + shineIntensity * 0.35,
              background: `linear-gradient(
                ${105 + rotation.y * 3}deg,
                transparent 20%,
                rgba(255, 255, 255, 0.4) 45%,
                rgba(255, 255, 255, 0.6) 50%,
                rgba(255, 255, 255, 0.4) 55%,
                transparent 80%
              )`,
            }}
          />

          {/* Card Header */}
          <div className={`bg-gradient-to-r ${colors.gradient} p-3`}>
            <h3 className="text-white font-bold text-lg truncate">{name}</h3>
            <p className={`text-sm ${colors.text}`}>
              {typeLabels[type] || type}
            </p>
          </div>

          {/* Image */}
          <div className="relative aspect-square bg-slate-900">
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />

            {/* Mastery Badge */}
            {masteryLevel && masteryLevel > 0 && (
              <div className="absolute bottom-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold text-sm px-2 py-1 rounded-lg shadow-lg">
                M{masteryLevel}
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className={`bg-gradient-to-r ${colors.gradient} p-3`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${colors.text} capitalize`}>
                {rarity}
              </span>
              {count > 1 && (
                <span className="bg-white/20 text-white text-sm font-bold px-2 py-0.5 rounded">
                  x{count}
                </span>
              )}
            </div>
          </div>

          {/* Rainbow border effect for epic */}
          {rarity === "epic" && (
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-150"
              style={{
                opacity: 0.2 + shineIntensity * 0.3,
                background: `linear-gradient(${rotation.y * 10}deg,
                  rgba(255,0,0,0.3),
                  rgba(255,127,0,0.3),
                  rgba(255,255,0,0.3),
                  rgba(0,255,0,0.3),
                  rgba(0,0,255,0.3),
                  rgba(139,0,255,0.3)
                )`,
                mixBlendMode: "overlay",
              }}
            />
          )}
        </div>

        {/* Glow underneath */}
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 rounded-full blur-xl transition-opacity duration-300"
          style={{
            opacity: 0.3 + shineIntensity * 0.4,
            background:
              rarity === "epic"
                ? "linear-gradient(90deg, #a855f7, #ec4899, #a855f7)"
                : rarity === "rare"
                  ? "#3b82f6"
                  : "#94a3b8",
          }}
        />
      </div>

      {/* Close hint */}
      <p className="absolute bottom-8 text-slate-500 text-sm">
        Click anywhere to close
      </p>
    </div>
  );
};
