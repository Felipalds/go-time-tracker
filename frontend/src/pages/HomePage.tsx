import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserHeader } from "../components/molecules/UserHeader";
import { TimerSection } from "../components/organisms/TimerSection";
import { DataSection } from "../components/organisms/DataSection";
import { RewardReveal } from "../components/molecules/RewardReveal";
import { CollectionModal } from "../components/organisms/CollectionModal";
import { useAuth } from "@/contexts/AuthContext";
import { useRewards } from "@/hooks/useRewards";
import type { ClaimedReward } from "@/interfaces";

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [revealedReward, setRevealedReward] = useState<ClaimedReward | null>(null);
  const [showCollection, setShowCollection] = useState(false);

  const { data: rewardsData } = useRewards();
  const rewards = rewardsData?.rewards || [];
  const mastery = rewardsData?.mastery || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth">
      {/* Section 1: Timer */}
      <section className="h-screen snap-start snap-always flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto h-full flex flex-col items-center justify-center gap-8 relative">
          <UserHeader userName={user?.name || ""} onLogout={handleLogout} />

          <h1 className="text-2xl text-slate-50 tracking-widest">
            Legends Time Tracker
          </h1>

          <TimerSection
            onRevealReward={setRevealedReward}
            onOpenCollection={() => setShowCollection(true)}
          />

          {/* Scroll hint - positioned at bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-600 text-xs font-medium tracking-widest opacity-60 animate-bounce">
            <span>DATA</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </div>
        </div>
      </section>

      {/* Section 2: Data */}
      <section className="min-h-screen snap-start snap-always flex items-center justify-center p-4 py-12">
        <DataSection />
      </section>

      {/* Modals */}
      <RewardReveal
        reward={revealedReward}
        onClose={() => setRevealedReward(null)}
      />
      {showCollection && (
        <CollectionModal
          rewards={rewards}
          mastery={mastery}
          onClose={() => setShowCollection(false)}
        />
      )}
    </div>
  );
};
