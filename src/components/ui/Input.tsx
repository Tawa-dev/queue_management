import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isRequired?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      icon,
      iconPosition = "left",
      isRequired = false,
      id,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[#334155] flex items-center gap-1"
          >
            {label}
            {isRequired && <span className="text-[#DC2626] font-bold" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 text-neutral-slate-500 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={`w-full h-10 rounded-md bg-white text-neutral-slate-900 text-sm placeholder:text-neutral-slate-400 border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue disabled:bg-neutral-slate-100 disabled:text-neutral-slate-400 disabled:cursor-not-allowed ${
              icon && iconPosition === "left"
                ? "pl-9 pr-3"
                : icon && iconPosition === "right"
                ? "pl-3 pr-9"
                : "px-3"
            } ${
              error
                ? "border-status-urgent-text focus:ring-status-urgent-text focus:border-status-urgent-text"
                : "border-neutral-slate-300 hover:border-neutral-slate-400"
            } ${className}`}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <div className="absolute right-3 text-neutral-slate-400 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-[#DC2626] font-medium" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-[#64748B]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
