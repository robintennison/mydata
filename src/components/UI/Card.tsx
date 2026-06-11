import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  footer, 
  hoverable = false,
  className = '',
  onClick
}) => {
  // Base card styles
  const baseStyles = 'bg-white rounded-lg shadow-md p-4 border border-gray-100 mb-4 transition-all duration-200';
  
  // Hoverable styles
  const hoverStyles = hoverable ? 'hover:-translate-y-0.5 hover:shadow-lg cursor-pointer' : '';
  
  // Title styles
  const titleStyles = 'text-base font-semibold text-gray-800 mb-2 flex items-center gap-2';
  
  // Content styles
  const contentStyles = 'text-gray-700 text-sm';
  
  // Footer styles
  const footerStyles = 'mt-4 pt-2 border-t border-gray-100 flex justify-end gap-2';
  
  const cardClasses = [baseStyles, hoverStyles, className].join(' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      {title && (
        <div className={titleStyles}>
          {title}
        </div>
      )}
      <div className={contentStyles}>
        {children}
      </div>
      {footer && (
        <div className={footerStyles}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;