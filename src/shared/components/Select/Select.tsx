// src/shared/components/Select/Select.tsx
import React, { forwardRef } from "react";
import "./Select.css";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      options,
      className = "",
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = !!error;

    return (
      <div
        className={`select-container ${
          fullWidth ? "full-width" : ""
        } ${className}`}
      >
        {label && (
          <label htmlFor={selectId} className="select-label">
            {label}
          </label>
        )}

        <div
          className={`select-wrapper ${hasError ? "select-error" : ""} ${
            disabled ? "select-disabled" : ""
          }`}
        >
          <select
            ref={ref}
            id={selectId}
            className="select-field"
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={helperText ? `${selectId}-helper` : undefined}
            {...props}
          >
            <option value="">Select an option</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="select-arrow">▼</span>
        </div>

        {(helperText || error) && (
          <div
            id={`${selectId}-helper`}
            className={`select-message ${
              hasError ? "error-message" : "helper-text"
            }`}
          >
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
