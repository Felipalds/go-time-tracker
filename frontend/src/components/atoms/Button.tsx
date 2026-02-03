import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'play';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'pixel-border font-bold cursor-pointer transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-pixel-blue hover:bg-pixel-lavender',
    secondary: 'bg-pixel-mint hover:bg-pixel-green',
    play: 'bg-pixel-pink hover:bg-pixel-peach text-pixel-xl',
  };

  const sizes = {
    sm: 'px-3 py-2 text-pixel-sm',
    md: 'px-4 py-3 text-pixel-base',
    lg: 'px-6 py-4 text-pixel-lg',
    xl: 'px-8 py-6 text-pixel-2xl',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
