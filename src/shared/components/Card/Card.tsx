// src/shared/components/Card/Card.tsx
import React from "react";
import "./Card.css";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: "sm" | "md" | "lg" | "xl";
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverable = false,
  padding = "lg",
}) => {
  const paddingClass = `card-padding-${padding}`;
  const hoverClass = hoverable ? "card-hoverable" : "";

  return (
    <div className={`card ${paddingClass} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};

// Card Header component
export const CardHeader: React.FC<CardProps> = ({
  children,
  className = "",
}) => <div className={`card-header ${className}`}>{children}</div>;

// Card Body component
export const CardBody: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`card-body ${className}`}>{children}</div>
);
