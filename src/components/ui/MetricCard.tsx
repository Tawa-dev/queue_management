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
  iconBgColor = "bg-primary-tint",
  iconColor = "text-primary-blue",
  valueColor = "text-neutral-slate-900",
  subtext,
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={`bg-white rounded-lg p-4 border border-neutral-slate-200 shadow-clinic-sm flex items-center gap-4 ${className}`}
    >
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${iconBgColor} ${iconColor}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-primary-navy uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight ${valueColor}`}>
            {value}
          </span>
          {subtext && (
            <span className="text-xs text-neutral-slate-400 font-normal">{subtext}</span>
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
    iconColor?: string;
    valueColor?: string;
    subtext?: string;
  }>;
  className?: string;
}

export function MetricBar({ metrics, className = "" }: MetricBarProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-neutral-slate-200 ${className}`}
    >
      {metrics.map((metric) => (
        <div key={metric.id} className="px-4 py-3.5 flex items-center gap-3 min-w-0">
          <div
            className={`shrink-0 ${metric.iconColor || "text-primary-navy"}`}
            aria-hidden="true"
          >
            {metric.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-navy truncate">
              {metric.label}
            </span>
            {metric.subtext && (
              <span className="text-[11px] text-primary-navy/80 leading-tight truncate">
                {metric.subtext}
              </span>
            )}
            <span
              className={`text-[28px] font-bold leading-none mt-0.5 ${
                metric.valueColor || "text-primary-navy"
              }`}
            >
              {metric.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
