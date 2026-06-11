import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'error' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  iconOnly?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon,
  iconOnly = false,
  className = '',
  ...props
}) => {
  // Base styles for all buttons
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md cursor-pointer transition-all duration-200 gap-2 leading-tight outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant-specific styles
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-sm',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400',
    error: 'bg-red-100 text-red-600 border border-transparent hover:bg-red-200',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-none',
  };
  
  // Size-specific styles
  const sizeStyles = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-5 py-2.5 text-sm',
    large: 'px-7 py-3 text-base',
  };
  
  // Icon only specific styles
  const iconOnlyStyles = iconOnly ? 'p-2 rounded-full' : '';
  
  // Combine all classes
  const buttonClasses = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    iconOnlyStyles,
    className
  ].join(' ');

  return (
    <button className={buttonClasses} {...props}>
      {icon && <span className="inline-flex">{icon}</span>}
      {!iconOnly && children}
    </button>
  );
};

export default Button;