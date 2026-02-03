import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'pink' | 'blue' | 'green' | 'purple' | 'yellow';
  onRemove?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'purple', onRemove }) => {
  const colors = {
    pink: 'bg-pixel-pink',
    blue: 'bg-pixel-blue',
    green: 'bg-pixel-green',
    purple: 'bg-pixel-purple',
    yellow: 'bg-pixel-yellow',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-2
        ${colors[color]}
        px-3 py-1
        pixel-border-thin
        text-pixel-sm
      `}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:text-red-600 font-bold"
          type="button"
        >
          ×
        </button>
      )}
    </span>
  );
};
