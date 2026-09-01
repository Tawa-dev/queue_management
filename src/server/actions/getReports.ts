"use server";

import { db } from "@/lib/db";

export interface HourlyBucket {
  hour: number; // 0–23
  label: string; // "08:00", "09:00", etc.
  count: number;
}

export interface ReportData {
  success: boolean;
  seenToday: number;
  waitingNow: number;
  inConsultationNow: number;
  avgWaitMinutes: number | null; // null when no completed visits yet
  hourlyVolume: HourlyBucket[]; // 06:00–20:00 window (15 buckets)
  error?: string;
}

/**
 * Returns today's queue statistics for the Admin reports page.
 * No auth guard here — the middleware + page both gate on ADMIN role.
 */
export async function getReportsDataAction(): Promise<ReportData> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // Fetch active status counts (WAITING and IN_ROOM) in a single groupBy query
    const activeCounts = await db.visit.groupBy({
      by: ["status"],
      where: { status: { in: ["WAITING", "IN_ROOM"] } },
      _count: { _all: true },
    });

    let waitingCount = 0;
    let inConsultationCount = 0;
    for (const group of activeCounts) {
      if (group.status === "WAITING") waitingCount = group._count._all;
      else if (group.status === "IN_ROOM") inConsultationCount = group._count._all;
    }

    // Fetch completed visits today for count, avg wait, and hourly split
    const completedVisits = await db.visit.findMany({
      where: {
        status: "COMPLETED",
        completedTime: { gte: todayStart, lt: tomorrowStart },
      },
      select: {
        checkInTime: true,
        calledTime: true,
      },
    });

    const seenCount = completedVisits.length;

    // Average wait: checkInTime → calledTime (time spent waiting before being called)
    let avgWaitMinutes: number | null = null;
    if (completedVisits.length > 0) {
      const totalWaitMs = completedVisits.reduce((acc, v) => {
        if (!v.calledTime) return acc;
        return acc + (v.calledTime.getTime() - v.checkInTime.getTime());
      }, 0);
      avgWaitMinutes = Math.round(totalWaitMs / completedVisits.length / 60000);
    }

    // Per-hour volume: bucket completed visits by hour of calledTime
    // Show hours 06:00–20:00 (inclusive) for a clinic day window
    const HOUR_START = 6;
    const HOUR_END = 20;
    const bucketMap = new Map<number, number>();
    for (let h = HOUR_START; h <= HOUR_END; h++) {
      bucketMap.set(h, 0);
    }

    for (const v of completedVisits) {
      const hour = v.checkInTime.getHours();
      if (hour >= HOUR_START && hour <= HOUR_END) {
        bucketMap.set(hour, (bucketMap.get(hour) ?? 0) + 1);
      }
    }

    const hourlyVolume: HourlyBucket[] = Array.from(
      bucketMap.entries()
    ).map(([hour, count]) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      count,
    }));

    return {
      success: true,
      seenToday: seenCount,
      waitingNow: waitingCount,
      inConsultationNow: inConsultationCount,
      avgWaitMinutes,
      hourlyVolume,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("getReportsDataAction error:", message);
    return {
      success: false,
      seenToday: 0,
      waitingNow: 0,
      inConsultationNow: 0,
      avgWaitMinutes: null,
      hourlyVolume: [],
      error: message,
    };
  }
}
