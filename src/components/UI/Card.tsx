import React from 'react';
import styles from './Card.module.css';

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
  const cardClasses = [
    styles.card,
    hoverable ? styles.cardHover : '',
    className
  ].join(' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      {title && (
        <div className={styles.cardTitle}>
          {title}
        </div>
      )}
      <div className={styles.cardContent}>
        {children}
      </div>
      {footer && (
        <div className={styles.cardFooter}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
