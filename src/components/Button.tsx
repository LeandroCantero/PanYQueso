import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'action';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = "border-4 border-neo-black font-bold py-2 px-4 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-neo";

  // Updated text colors to neo-black for visibility
  const variants = {
    primary: "bg-neo-green text-neo-black hover:bg-lime-400",
    secondary: "bg-neo-white text-neo-black hover:bg-gray-100",
    danger: "bg-neo-red text-neo-black hover:bg-red-400",
    action: "bg-white text-neo-black hover:bg-gray-200",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};