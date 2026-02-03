import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-pixel-sm mb-2 text-text-primary">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3
          pixel-border-thin
          bg-white
          text-pixel-base text-text-primary
          focus:outline-none focus:border-pixel-purple
          placeholder:text-gray-400
          ${className}
        `}
        {...props}
      />
    </div>
  );
};
