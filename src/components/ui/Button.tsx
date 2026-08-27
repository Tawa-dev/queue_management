import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "destructive"
  | "outline_destructive";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      isLoading = false,
      fullWidth = false,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4DB7] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none";

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "px-2.5 py-1 text-xs gap-1.5 min-h-[32px]",
      md: "px-4 py-2 text-sm gap-2 min-h-[40px]",
      lg: "px-5 py-2.5 text-base gap-2.5 min-h-[46px]",
    };

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-[#0B2D6B] hover:bg-[#1E4DB7] active:bg-[#081F4D] text-white shadow-sm disabled:bg-[#0B2D6B]/50",
      secondary:
        "bg-white hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#0B2D6B] border border-[#CBD5E1] font-semibold",
      tertiary:
        "bg-transparent hover:bg-[#EFF6FF] text-[#1E4DB7] active:text-[#0B2D6B] p-1",
      destructive:
        "bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white shadow-sm",
      outline_destructive:
        "bg-white hover:bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626] font-medium",
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
