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
        <div key={metric.id} className="px-3 py-3 flex items-center gap-2.5 min-w-0">
          {/* Icon wrapper — shrinks slightly at lg where 5 columns are tight */}
          <div
            className={`shrink-0 [&_svg]:w-4 [&_svg]:h-4 lg:[&_svg]:w-[18px] lg:[&_svg]:h-[18px] ${metric.iconColor || "text-primary-navy"}`}
            aria-hidden="true"
          >
            {metric.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-primary-navy leading-tight whitespace-normal break-words">
              {metric.label}
            </span>
            {metric.subtext && (
              <span className="text-[10px] text-primary-navy/80 leading-tight">
                {metric.subtext}
              </span>
            )}
            <span
              className={`text-xl lg:text-[26px] font-bold leading-none mt-0.5 ${
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
