import React from "react";
import {
  Hourglass,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";

export type BadgeVariant =
  | "waiting"
  | "in_consultation"
  | "seen"
  | "did_not_attend"
  | "available"
  | "busy"
  | "urgent";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  size?: BadgeSize;
  className?: string;
  showDefaultIcon?: boolean;
}

export function Badge({
  variant,
  children,
  icon,
  size = "md",
  className = "",
  showDefaultIcon = true,
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    waiting: "bg-[#FFF4E5] text-[#F97316] border border-[#FDBA74]/40",
    in_consultation: "bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]/40",
    seen: "bg-[#ECFDF5] text-[#16A34A] border border-[#86EFAC]/40",
    did_not_attend: "bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]/50",
    available: "bg-[#ECFDF5] text-[#16A34A] border border-[#86EFAC]/40 font-semibold",
    busy: "bg-[#FFF7ED] text-[#EA580C] border border-[#FDBA74]/40 font-semibold",
    urgent: "bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]/40 font-bold",
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-[11px] gap-1 rounded",
    md: "px-2.5 py-1 text-xs gap-1.5 rounded",
    lg: "px-3 py-1.5 text-sm gap-2 rounded-md",
  };

  const iconSizes: Record<BadgeSize, string> = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const defaultIcons: Record<BadgeVariant, React.ReactNode> = {
    waiting: <Hourglass className={iconSizes[size]} aria-hidden="true" />,
    in_consultation: <UserCheck className={iconSizes[size]} aria-hidden="true" />,
    seen: <CheckCircle2 className={iconSizes[size]} aria-hidden="true" />,
    did_not_attend: <XCircle className={iconSizes[size]} aria-hidden="true" />,
    available: null,
    busy: <Clock className={iconSizes[size]} aria-hidden="true" />,
    urgent: <AlertTriangle className={iconSizes[size]} aria-hidden="true" />,
  };

  const defaultLabels: Record<BadgeVariant, string> = {
    waiting: "WAITING",
    in_consultation: "IN CONSULTATION",
    seen: "SEEN",
    did_not_attend: "DID NOT ATTEND",
    available: "AVAILABLE",
    busy: "BUSY",
    urgent: "URGENT / PRIORITY",
  };

  const renderedIcon = icon !== undefined ? icon : showDefaultIcon ? defaultIcons[variant] : null;

  return (
    <span
      className={`inline-flex items-center font-medium tracking-wide uppercase whitespace-nowrap select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {renderedIcon && <span className="shrink-0">{renderedIcon}</span>}
      <span>{children || defaultLabels[variant]}</span>
    </span>
  );
}
