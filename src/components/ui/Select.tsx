import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  helperText?: string;
  error?: string;
  isRequired?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options = [],
      helperText,
      error,
      isRequired = false,
      id,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const errorId = selectId ? `${selectId}-error` : undefined;
    const helperId = selectId ? `${selectId}-helper` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-[#334155] flex items-center gap-1"
          >
            {label}
            {isRequired && <span className="text-[#DC2626] font-bold" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={`w-full h-10 pl-3 pr-9 rounded bg-white text-[#0F172A] text-sm border transition-colors duration-150 appearance-none focus:outline-none focus:ring-2 focus:ring-[#1E4DB7] focus:border-[#1E4DB7] disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] disabled:cursor-not-allowed cursor-pointer ${
              error
                ? "border-[#DC2626] focus:ring-[#DC2626] focus:border-[#DC2626]"
                : "border-[#CBD5E1] hover:border-[#94A3B8]"
            } ${className}`}
            {...props}
          >
            {children
              ? children
              : options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))}
          </select>
          <ChevronDown
            className="absolute right-3 w-4 h-4 text-[#64748B] pointer-events-none"
            aria-hidden="true"
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

Select.displayName = "Select";
