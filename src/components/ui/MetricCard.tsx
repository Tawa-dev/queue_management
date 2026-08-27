import React from "react";

export interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  valueColor?: string;
  subtext?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  iconBgColor = "bg-[#EFF6FF]",
  iconColor = "text-[#1E4DB7]",
  valueColor = "text-[#0F172A]",
  subtext,
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={`bg-white rounded-lg p-4 border border-[#E2E8F0] shadow-sm flex items-center gap-4 transition-shadow duration-150 hover:shadow-md ${className}`}
    >
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${iconBgColor} ${iconColor}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight ${valueColor}`}>
            {value}
          </span>
          {subtext && (
            <span className="text-xs text-[#94A3B8] font-normal">{subtext}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export interface MetricBarProps {
  metrics: Array<{
    id: string;
    label: string;
    value: number | string;
    icon: React.ReactNode;
    valueColor?: string;
    subtext?: string;
  }>;
  className?: string;
}

export function MetricBar({ metrics, className = "" }: MetricBarProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-[#E2E8F0] shadow-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0] ${className}`}
    >
      {metrics.map((metric) => (
        <div key={metric.id} className="p-3.5 flex items-center gap-3">
          <div className="text-[#64748B] shrink-0" aria-hidden="true">
            {metric.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] truncate">
              {metric.label}
            </span>
            <div className="flex items-baseline gap-1.5">
              {metric.subtext && (
                <span className="text-xs text-[#94A3B8]">{metric.subtext}</span>
              )}
              <span
                className={`text-xl font-bold ${
                  metric.valueColor || "text-[#0F172A]"
                }`}
              >
                {metric.value}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
