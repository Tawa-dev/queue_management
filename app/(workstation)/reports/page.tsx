"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Clock,
  CheckCircle2,
  Stethoscope,
  RefreshCw,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { MetricCard } from "@/components/ui";
import {
  getReportsDataAction,
  type ReportData,
  type HourlyBucket,
} from "@/server/actions/getReports";

const POLL_MS = 30_000; // refresh every 30 s — metrics don't need to be live

// ---------------------------------------------------------------------------
// Hourly volume bar chart (pure SVG — no third-party library)
// ---------------------------------------------------------------------------
function HourlyVolumeChart({ data }: { data: HourlyBucket[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const BAR_HEIGHT = 160; // max bar height in px

  // Highlight the current hour
  const nowHour = new Date().getHours();

  return (
    <div className="bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[13px] font-bold text-primary-navy uppercase tracking-[0.06em]">
            Patients Seen · Per Hour
          </h3>
          <p className="text-[11px] text-neutral-slate-400 mt-0.5">
            Completed visits by check-in hour — today
          </p>
        </div>
        <TrendingUp className="w-5 h-5 text-neutral-slate-300" />
      </div>

      {/* Chart area */}
      <div
        className="flex items-end gap-1.5 overflow-x-auto pb-1"
        role="img"
        aria-label="Bar chart: patients seen per hour today"
      >
        {data.map((bucket) => {
          const isNow = bucket.hour === nowHour;
          const barH =
            maxCount === 0 ? 0 : Math.round((bucket.count / maxCount) * BAR_HEIGHT);
          const minH = bucket.count > 0 ? 6 : 2; // always show a sliver if > 0
          const finalH = Math.max(barH, minH);

          return (
            <div key={bucket.hour} className="flex flex-col items-center gap-1 flex-1 min-w-[28px]">
              {/* Count label above bar */}
              <span
                className={`text-[10px] font-bold leading-none ${
                  isNow ? "text-primary-blue" : "text-neutral-slate-400"
                }`}
              >
                {bucket.count > 0 ? bucket.count : ""}
              </span>

              {/* Bar */}
              <div
                className={`w-full rounded-t-sm transition-all ${
                  isNow
                    ? "bg-primary-blue"
                    : bucket.count > 0
                    ? "bg-[#93C5FD]"
                    : "bg-neutral-slate-100"
                }`}
                style={{ height: `${finalH}px` }}
                title={`${bucket.label}: ${bucket.count} patient${bucket.count !== 1 ? "s" : ""}`}
              />

              {/* Hour label below bar */}
              <span
                className={`text-[9px] font-medium leading-none whitespace-nowrap ${
                  isNow ? "text-primary-blue font-bold" : "text-neutral-slate-400"
                }`}
              >
                {bucket.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-slate-100">
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-slate-400">
          <span className="w-3 h-3 rounded-sm bg-[#93C5FD] inline-block" />
          Past hours
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-primary-blue font-semibold">
          <span className="w-3 h-3 rounded-sm bg-primary-blue inline-block" />
          Current hour
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 border border-neutral-slate-200 shadow-clinic-sm flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-lg bg-neutral-slate-100 shrink-0" />
      <div className="flex flex-col gap-2">
        <div className="h-2 w-20 bg-neutral-slate-100 rounded" />
        <div className="h-6 w-12 bg-neutral-slate-200 rounded" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm p-5 animate-pulse">
      <div className="h-3 w-48 bg-neutral-slate-100 rounded mb-4" />
      <div className="flex items-end gap-1.5 h-40">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 min-w-[28px] bg-neutral-slate-100 rounded-t-sm"
            style={{ height: `${20 + Math.random() * 80}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = useCallback(async () => {
    const result = await getReportsDataAction();
    if (result.success) {
      setData(result);
      setLastUpdated(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const avgWaitLabel =
    data?.avgWaitMinutes != null ? `${data.avgWaitMinutes} min` : "—";

  const avgWaitSubtext =
    data?.avgWaitMinutes != null
      ? data.avgWaitMinutes > 30
        ? "above target"
        : "within target"
      : "no completed visits yet";

  return (
    <div className="space-y-5 pb-6">
      <h1 className="sr-only">Reports — Mabvuku Polyclinic</h1>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold text-primary-navy leading-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-neutral-slate-400" />
            Reports
          </h2>
          <p className="text-[13px] text-neutral-slate-500 mt-0.5">
            Today&apos;s outpatient statistics — {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div
              className="flex items-center gap-1.5 text-[11px] text-neutral-slate-500"
              role="status"
              aria-live="polite"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-status-seen-text" />
              <span>Live · {lastUpdated}</span>
            </div>
          )}
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-slate-200 bg-white text-[12px] font-medium text-primary-navy hover:bg-neutral-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Refresh report data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <MetricCard
            label="Patients Seen Today"
            value={data?.seenToday ?? 0}
            icon={<CheckCircle2 className="w-6 h-6" />}
            iconBgColor="bg-[#ECFDF5]"
            iconColor="text-status-seen-text"
            valueColor="text-status-seen-text"
            subtext="completed today"
          />
          <MetricCard
            label="Currently Waiting"
            value={data?.waitingNow ?? 0}
            icon={<Users className="w-6 h-6" />}
            iconBgColor="bg-[#FFF4E5]"
            iconColor="text-[#F97316]"
            valueColor="text-[#F97316]"
            subtext="in the queue now"
          />
          <MetricCard
            label="In Consultation"
            value={data?.inConsultationNow ?? 0}
            icon={<Stethoscope className="w-6 h-6" />}
            iconBgColor="bg-[#EFF6FF]"
            iconColor="text-primary-blue"
            valueColor="text-primary-blue"
            subtext="currently in a room"
          />
          <MetricCard
            label="Avg. Wait Time"
            value={avgWaitLabel}
            icon={<Clock className="w-6 h-6" />}
            iconBgColor={
              (data?.avgWaitMinutes ?? 0) > 30 ? "bg-[#FEF2F2]" : "bg-[#F0FDF4]"
            }
            iconColor={
              (data?.avgWaitMinutes ?? 0) > 30
                ? "text-status-urgent-text"
                : "text-status-seen-text"
            }
            valueColor={
              (data?.avgWaitMinutes ?? 0) > 30
                ? "text-status-urgent-text"
                : "text-neutral-slate-900"
            }
            subtext={avgWaitSubtext}
          />
        </div>
      )}

      {/* Hourly volume chart */}
      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <HourlyVolumeChart data={data?.hourlyVolume ?? []} />
      )}

      {/* Contextual note */}
      <p className="text-[11px] text-neutral-slate-400 text-right">
        Stats reset at midnight · Avg. wait = time from check-in to room call · Page refreshes every 30 s
      </p>
    </div>
  );
}
