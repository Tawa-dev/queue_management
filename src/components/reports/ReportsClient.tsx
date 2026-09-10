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
  XCircle,
  Download,
} from "lucide-react";
import { MetricCard } from "@/components/ui";
import {
  getReportsDataAction,
  get7DayTrendAction,
  type ReportData,
  type HourlyBucket,
  type DayBucket,
} from "@/server/actions/getReports";

const POLL_MS = 30_000;

// ---------------------------------------------------------------------------
// Hourly volume bar chart
// ---------------------------------------------------------------------------
function HourlyVolumeChart({ data }: { data: HourlyBucket[] }) {
  // Lazy initializer: safe on both server (returns null) and client
  const [nowHour, setNowHour] = useState<number | null>(() =>
    typeof window !== "undefined" ? new Date().getHours() : null
  );
  // Keep nowHour current as the hour changes
  useEffect(() => {
    const id = setInterval(() => setNowHour(new Date().getHours()), 60_000);
    return () => clearInterval(id);
  }, []);

  const maxCount  = Math.max(...data.map((d) => d.count), 1);
  const BAR_HEIGHT = 160;

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

      <div
        className="flex items-end gap-1.5 overflow-x-auto pb-1"
        role="img"
        aria-label="Bar chart: patients seen per hour today"
      >
        {data.map((bucket) => {
          const isNow = nowHour !== null && bucket.hour === nowHour;
          const barH  = Math.round((bucket.count / maxCount) * BAR_HEIGHT);
          const finalH = Math.max(barH, bucket.count > 0 ? 6 : 2);

          return (
            <div
              key={bucket.hour}
              className="flex flex-col items-center gap-1 flex-1 min-w-[28px]"
            >
              <span
                className={`text-[10px] font-bold leading-none ${
                  isNow ? "text-primary-blue" : "text-neutral-slate-400"
                }`}
              >
                {bucket.count > 0 ? bucket.count : ""}
              </span>
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
// CSV export helpers — pure client-side Blob downloads, no server round-trip
// ---------------------------------------------------------------------------
function triggerCsvDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadDailyCSV(data: ReportData, todayLabel: string) {
  const rows: string[][] = [
    ["Mabvuku Polyclinic \u2014 Daily Report", todayLabel],
    [],
    ["Metric", "Value"],
    ["Patients Seen Today",  String(data.seenToday)],
    ["Currently Waiting",    String(data.waitingNow)],
    ["In Consultation",      String(data.inConsultationNow)],
    ["Did Not Attend",       String(data.dnaToday)],
    ["Average Wait Time",    data.avgWaitMinutes != null ? `${data.avgWaitMinutes} min` : "N/A"],
    [],
    ["Hour", "Patients Seen"],
    ...data.hourlyVolume.map((b) => [b.label, String(b.count)]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const date = new Date().toISOString().slice(0, 10);
  triggerCsvDownload(csv, `mabvuku-daily-report-${date}.csv`);
}

function download7DayCSV(trend: DayBucket[]) {
  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const rows: string[][] = [
    ["Mabvuku Polyclinic \u2014 7-Day Patient Volume"],
    ["Generated", todayLabel],
    [],
    ["Date", "Day", "Patients Seen"],
    ...trend.map((b) => [b.isoDate, b.dayLabel, String(b.count)]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const date = new Date().toISOString().slice(0, 10);
  triggerCsvDownload(csv, `mabvuku-7day-trend-${date}.csv`);
}

// ---------------------------------------------------------------------------
// 7-day weekly trend chart
// ---------------------------------------------------------------------------
function WeeklyTrendChart({
  data,
  onExport,
}: {
  data: DayBucket[];
  onExport: () => void;
}) {
  const maxCount  = Math.max(...data.map((d) => d.count), 1);
  const BAR_HEIGHT = 140;

  return (
    <div className="bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[13px] font-bold text-primary-navy uppercase tracking-[0.06em]">
            Patient Volume · Last 7 Days
          </h3>
          <p className="text-[11px] text-neutral-slate-400 mt-0.5">
            Completed visits per day — past week
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-neutral-slate-200 bg-white text-[11px] font-medium text-primary-navy hover:bg-neutral-slate-50 transition-colors cursor-pointer"
          aria-label="Export 7-day trend as CSV"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      <div
        className="flex items-end gap-3 sm:gap-4"
        role="img"
        aria-label="Bar chart: patients seen per day over last 7 days"
      >
        {data.map((bucket) => {
          const barH   = Math.round((bucket.count / maxCount) * BAR_HEIGHT);
          const finalH = Math.max(barH, bucket.count > 0 ? 8 : 3);

          return (
            <div key={bucket.isoDate} className="flex flex-col items-center gap-1 flex-1">
              <span className={`text-[11px] font-bold leading-none ${
                bucket.isToday ? "text-primary-blue" : "text-neutral-slate-400"
              }`}>
                {bucket.count > 0 ? bucket.count : ""}
              </span>
              <div
                className={`w-full rounded-t-sm transition-all ${
                  bucket.isToday
                    ? "bg-primary-blue"
                    : bucket.count > 0
                    ? "bg-[#93C5FD]"
                    : "bg-neutral-slate-100"
                }`}
                style={{ height: `${finalH}px` }}
                title={`${bucket.fullLabel}: ${bucket.count} patient${bucket.count !== 1 ? "s" : ""}`}
              />
              <span className={`text-[10px] font-semibold leading-none ${
                bucket.isToday ? "text-primary-blue" : "text-neutral-slate-500"
              }`}>
                {bucket.dayLabel}
              </span>
              <span className="text-[9px] text-neutral-slate-400 leading-none">
                {bucket.fullLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-slate-100">
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-slate-400">
          <span className="w-3 h-3 rounded-sm bg-[#93C5FD] inline-block" />
          Previous days
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-primary-blue font-semibold">
          <span className="w-3 h-3 rounded-sm bg-primary-blue inline-block" />
          Today
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export interface ReportsClientProps {
  initialData: ReportData;
  initialTrend: DayBucket[];
}

export function ReportsClient({ initialData, initialTrend }: ReportsClientProps) {
  // Seed with server-fetched data — no skeleton flash on first render
  const [data, setData]         = useState<ReportData>(initialData);
  const [trend, setTrend]       = useState<DayBucket[]>(initialTrend);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Date string must be derived client-side to avoid hydration mismatch
  const [todayLabel, setTodayLabel] = useState<string>("");
  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [result, trendResult] = await Promise.all([
        getReportsDataAction(),
        get7DayTrendAction(),
      ]);
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
      if (trendResult.length > 0) setTrend(trendResult);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Skip immediate fetch on mount — server already gave us fresh data
  useEffect(() => {
    const id = setInterval(fetchData, POLL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const avgWaitLabel   = data.avgWaitMinutes != null ? `${data.avgWaitMinutes} min` : "—";
  const avgWaitSubtext = data.avgWaitMinutes != null
    ? data.avgWaitMinutes > 30 ? "above target" : "within target"
    : "no completed visits yet";
  const waitOverTarget = (data.avgWaitMinutes ?? 0) > 30;

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
          {/* todayLabel set in useEffect — empty string on server, real date on client */}
          <p className="text-[13px] text-neutral-slate-500 mt-0.5 min-h-[18px]">
            {todayLabel ? `Today's outpatient statistics — ${todayLabel}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          <button
            type="button"
            onClick={() => downloadDailyCSV(data, todayLabel)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-slate-200 bg-white text-[12px] font-medium text-primary-navy hover:bg-neutral-slate-50 transition-colors cursor-pointer"
            aria-label="Export daily report as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
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

      {/* 5 metric cards — updated to include DNA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <MetricCard
          label="Patients Seen Today"
          value={data.seenToday}
          icon={<CheckCircle2 className="w-6 h-6" />}
          iconBgColor="bg-[#ECFDF5]"
          iconColor="text-status-seen-text"
          valueColor="text-status-seen-text"
          subtext="completed today"
        />
        <MetricCard
          label="Currently Waiting"
          value={data.waitingNow}
          icon={<Users className="w-6 h-6" />}
          iconBgColor="bg-[#FFF4E5]"
          iconColor="text-[#F97316]"
          valueColor="text-[#F97316]"
          subtext="in the queue now"
        />
        <MetricCard
          label="In Consultation"
          value={data.inConsultationNow}
          icon={<Stethoscope className="w-6 h-6" />}
          iconBgColor="bg-[#EFF6FF]"
          iconColor="text-primary-blue"
          valueColor="text-primary-blue"
          subtext="currently in a room"
        />
        <MetricCard
          label="Did Not Attend"
          value={data.dnaToday}
          icon={<XCircle className="w-6 h-6" />}
          iconBgColor="bg-neutral-slate-100"
          iconColor="text-neutral-slate-500"
          valueColor="text-neutral-slate-700"
          subtext="cancelled today"
        />
        <MetricCard
          label="Avg. Wait Time"
          value={avgWaitLabel}
          icon={<Clock className="w-6 h-6" />}
          iconBgColor={waitOverTarget ? "bg-[#FEF2F2]" : "bg-[#F0FDF4]"}
          iconColor={waitOverTarget ? "text-status-urgent-text" : "text-status-seen-text"}
          valueColor={waitOverTarget ? "text-status-urgent-text" : "text-neutral-slate-900"}
          subtext={avgWaitSubtext}
        />
      </div>

      {/* Hourly volume chart */}
      <HourlyVolumeChart data={data.hourlyVolume} />

      {/* 7-day weekly trend chart */}
      {trend.length > 0 && (
        <WeeklyTrendChart
          data={trend}
          onExport={() => download7DayCSV(trend)}
        />
      )}

      {/* Contextual note */}
      <p className="text-[11px] text-neutral-slate-400 text-right">
        Stats reset at midnight · Avg. wait = time from check-in to room call · Page refreshes every 30 s · CSV exports open in Excel
      </p>
    </div>
  );
}
