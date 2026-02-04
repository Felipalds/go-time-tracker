import React, { useState } from "react";
import { RewardIcon } from "../atoms/RewardIcon";
import { RewardCard } from "../molecules/RewardCard";
import type { Reward, ChampionMastery, Rarity } from "@/interfaces";

interface CollectionModalProps {
  rewards: Reward[];
  mastery: ChampionMastery[];
  onClose: () => void;
}

type TabType = "champions" | "items" | "skins" | "icons";

interface SelectedItem {
  imageUrl: string;
  name: string;
  type: string;
  rarity: Rarity;
  count: number;
  masteryLevel?: number;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  rewards,
  mastery,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("champions");
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  // Calculate stats from data
  const stats = {
    total_rewards:
      rewards.length + mastery.reduce((acc, m) => acc + m.times_obtained, 0),
    champions_collected: mastery.length,
    max_mastery_champions: mastery.filter((m) => m.mastery_level >= 7).length,
  };

  // Group rewards by type
  const champions = mastery;
  const items = rewards.filter((r) => r.reward_type === "item");
  const skins = rewards.filter((r) => r.reward_type === "skin");
  const icons = rewards.filter((r) => r.reward_type === "icon");

  // Count unique items
  const uniqueItems = new Map<string, { reward: Reward; count: number }>();
  items.forEach((item) => {
    const existing = uniqueItems.get(item.external_id);
    if (existing) {
      existing.count++;
    } else {
      uniqueItems.set(item.external_id, { reward: item, count: 1 });
    }
  });

  const uniqueSkins = new Map<string, { reward: Reward; count: number }>();
  skins.forEach((skin) => {
    const existing = uniqueSkins.get(skin.external_id);
    if (existing) {
      existing.count++;
    } else {
      uniqueSkins.set(skin.external_id, { reward: skin, count: 1 });
    }
  });

  const uniqueIcons = new Map<string, { reward: Reward; count: number }>();
  icons.forEach((icon) => {
    const existing = uniqueIcons.get(icon.external_id);
    if (existing) {
      existing.count++;
    } else {
      uniqueIcons.set(icon.external_id, { reward: icon, count: 1 });
    }
  });

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "champions", label: "Champions", count: champions.length },
    { key: "items", label: "Items", count: uniqueItems.size },
    { key: "skins", label: "Skins", count: uniqueSkins.size },
    { key: "icons", label: "Icons", count: uniqueIcons.size },
  ];

  const handleSelectChampion = (champ: ChampionMastery) => {
    setSelectedItem({
      imageUrl: champ.image_url,
      name: champ.champion_name,
      type: "champion",
      rarity:
        champ.mastery_level >= 5
          ? "epic"
          : champ.mastery_level >= 3
            ? "rare"
            : "common",
      count: champ.times_obtained,
      masteryLevel: champ.mastery_level,
    });
  };

  const handleSelectReward = (reward: Reward, count: number, type: string) => {
    setSelectedItem({
      imageUrl: reward.image_url,
      name: reward.name,
      type,
      rarity: reward.rarity,
      count,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal Container - Smaller and centered */}
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h1 className="text-xl font-bold text-slate-50">My Collection</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {stats.total_rewards} rewards • {stats.champions_collected}{" "}
              champions • {stats.max_mastery_champions} mastery 7
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-400"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "champions" && (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {champions.map((champ) => (
                <button
                  key={champ.champion_id}
                  onClick={() => handleSelectChampion(champ)}
                  className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <RewardIcon
                    imageUrl={champ.image_url}
                    name={champ.champion_name}
                    rarity="common"
                    masteryLevel={champ.mastery_level}
                    size="md"
                  />
                  <span className="text-[10px] text-slate-400 truncate max-w-full">
                    {champ.champion_name}
                  </span>
                </button>
              ))}
              {champions.length === 0 && (
                <div className="col-span-full text-center text-slate-500 py-8 text-sm">
                  No champions collected yet. Keep tracking time!
                </div>
              )}
            </div>
          )}

          {activeTab === "items" && (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {Array.from(uniqueItems.values()).map(({ reward, count }) => (
                <button
                  key={reward.external_id}
                  onClick={() => handleSelectReward(reward, count, "item")}
                  className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer relative"
                >
                  <RewardIcon
                    imageUrl={reward.image_url}
                    name={reward.name}
                    rarity={reward.rarity}
                    size="md"
                  />
                  {count > 1 && (
                    <span className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">
                      x{count}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 truncate max-w-full">
                    {reward.name}
                  </span>
                </button>
              ))}
              {uniqueItems.size === 0 && (
                <div className="col-span-full text-center text-slate-500 py-8 text-sm">
                  No items collected yet. Keep tracking time!
                </div>
              )}
            </div>
          )}

          {activeTab === "skins" && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {Array.from(uniqueSkins.values()).map(({ reward, count }) => (
                <button
                  key={reward.external_id}
                  onClick={() => handleSelectReward(reward, count, "skin")}
                  className="flex flex-col items-center gap-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer relative p-1"
                >
                  <div className="w-full aspect-video rounded-lg overflow-hidden border border-blue-500/50 shadow-lg shadow-blue-500/10">
                    <img
                      src={reward.image_url}
                      alt={reward.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {count > 1 && (
                    <span className="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">
                      x{count}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 text-center truncate max-w-full">
                    {reward.name}
                  </span>
                </button>
              ))}
              {uniqueSkins.size === 0 && (
                <div className="col-span-full text-center text-slate-500 py-8 text-sm">
                  No skins collected yet. Track more time for better chances!
                </div>
              )}
            </div>
          )}

          {activeTab === "icons" && (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {Array.from(uniqueIcons.values()).map(({ reward, count }) => (
                <button
                  key={reward.external_id}
                  onClick={() => handleSelectReward(reward, count, "icon")}
                  className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer relative"
                >
                  <RewardIcon
                    imageUrl={reward.image_url}
                    name={reward.name}
                    rarity={reward.rarity}
                    size="md"
                  />
                  {count > 1 && (
                    <span className="absolute top-0 right-0 bg-purple-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">
                      x{count}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 truncate max-w-full">
                    {reward.name}
                  </span>
                </button>
              ))}
              {uniqueIcons.size === 0 && (
                <div className="col-span-full text-center text-slate-500 py-8 text-sm">
                  No icons collected yet. Keep tracking time!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reward Card Detail View */}
      {selectedItem && (
        <RewardCard
          imageUrl={selectedItem.imageUrl}
          name={selectedItem.name}
          type={selectedItem.type}
          rarity={selectedItem.rarity}
          count={selectedItem.count}
          masteryLevel={selectedItem.masteryLevel}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};
