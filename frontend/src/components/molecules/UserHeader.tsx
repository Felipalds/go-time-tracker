import React from "react";

interface UserHeaderProps {
  userName: string;
  onLogout: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ userName, onLogout }) => {
  return (
    <div className="absolute top-4 right-4 flex items-center gap-3">
      <span className="text-slate-400 text-sm">{userName}</span>
      <button
        onClick={onLogout}
        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
      >
        Logout
      </button>
    </div>
  );
};
