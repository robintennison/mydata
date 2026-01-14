// src/shared/components/Input/Input.tsx
import React, { forwardRef } from "react";
import "./Input.css";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      startIcon,
      endIcon,
      className = "",
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = !!error;

    return (
      <div
        className={`input-container ${
          fullWidth ? "full-width" : ""
        } ${className}`}
      >
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}

        <div
          className={`input-wrapper ${hasError ? "input-error" : ""} ${
            disabled ? "input-disabled" : ""
          }`}
        >
          {startIcon && (
            <span className="input-icon start-icon">{startIcon}</span>
          )}

          <input
            ref={ref}
            id={inputId}
            className="input-field"
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={helperText ? `${inputId}-helper` : undefined}
            {...props}
          />

          {endIcon && <span className="input-icon end-icon">{endIcon}</span>}
        </div>

        {(helperText || error) && (
          <div
            id={`${inputId}-helper`}
            className={`input-message ${
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

Input.displayName = "Input";

// TextArea Component
export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  rows?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = "",
      id,
      rows = 3,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = !!error;

    return (
      <div
        className={`input-container ${
          fullWidth ? "full-width" : ""
        } ${className}`}
      >
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}

        <div
          className={`input-wrapper ${hasError ? "input-error" : ""} ${
            disabled ? "input-disabled" : ""
          }`}
        >
          <textarea
            ref={ref}
            id={inputId}
            className="textarea-field"
            rows={rows}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
        </div>

        {(helperText || error) && (
          <div
            id={`${inputId}-helper`}
            className={`input-message ${
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

TextArea.displayName = "TextArea";

// REMOVE THIS LINE - already exported above
// export { Input, TextArea };
