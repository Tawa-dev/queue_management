import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type AlertType = "success" | "warning" | "error" | "info";

export interface AlertBannerProps {
  type?: AlertType;
  message: string | React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  isDismissible?: boolean;
}

export function AlertBanner({
  type = "info",
  message,
  onDismiss,
  className = "",
  isDismissible = true,
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  const typeStyles: Record<
    AlertType,
    { container: string; icon: React.ReactNode; iconColor: string; closeColor: string }
  > = {
    success: {
      container: "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]",
      icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
      iconColor: "text-[#16A34A]",
      closeColor: "text-[#16A34A] hover:bg-[#D1FAE5]",
    },
    warning: {
      container: "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]",
      icon: <AlertTriangle className="w-4 h-4" aria-hidden="true" />,
      iconColor: "text-[#D97706]",
      closeColor: "text-[#D97706] hover:bg-[#FEF3C7]",
    },
    error: {
      container: "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]",
      icon: <XCircle className="w-4 h-4" aria-hidden="true" />,
      iconColor: "text-[#DC2626]",
      closeColor: "text-[#DC2626] hover:bg-[#FEE2E2]",
    },
    info: {
      container: "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]",
      icon: <Info className="w-4 h-4" aria-hidden="true" />,
      iconColor: "text-[#2563EB]",
      closeColor: "text-[#2563EB] hover:bg-[#DBEAFE]",
    },
  };

  const current = typeStyles[type];

  return (
    <div
      role="alert"
      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded border text-sm transition-all duration-200 ${current.container} ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`shrink-0 ${current.iconColor}`}>{current.icon}</span>
        <div className="font-medium text-xs sm:text-sm leading-tight">{message}</div>
      </div>
      {isDismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className={`p-1 rounded-sm transition-colors cursor-pointer shrink-0 ${current.closeColor}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
