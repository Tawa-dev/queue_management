import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  isRequired?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      icon,
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
          {icon && (
            <div className="absolute left-3 text-[#64748B] pointer-events-none flex items-center justify-center">
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
            className={`w-full h-10 rounded bg-white text-[#0F172A] text-sm placeholder:text-[#94A3B8] border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#1E4DB7] focus:border-[#1E4DB7] disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] disabled:cursor-not-allowed ${
              icon ? "pl-9 pr-3" : "px-3"
            } ${
              error
                ? "border-[#DC2626] focus:ring-[#DC2626] focus:border-[#DC2626]"
                : "border-[#CBD5E1] hover:border-[#94A3B8]"
            } ${className}`}
            {...props}
          />
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
