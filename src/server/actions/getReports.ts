"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface HourlyBucket {
  hour: number;   // 0–23
  label: string;  // "08:00", "09:00", etc.
  count: number;
}

export interface ReportData {
  success: boolean;
  seenToday: number;
  waitingNow: number;
  inConsultationNow: number;
  dnaToday: number;              // cancelled / did-not-attend visits today
  avgWaitMinutes: number | null; // null when no completed visits yet
  hourlyVolume: HourlyBucket[];  // 06:00–20:00 window (15 buckets)
  error?: string;
}

/**
 * Returns today's queue statistics for the Admin reports page.
 * Middleware gates this route to ADMIN only — auth() here is for zone resolution.
 */
export async function getReportsDataAction(): Promise<ReportData> {
  const empty: ReportData = {
    success: false,
    seenToday: 0,
    waitingNow: 0,
    inConsultationNow: 0,
    dnaToday: 0,
    avgWaitMinutes: null,
    hourlyVolume: [],
  };

  try {
    const session = await auth();
    // zoneId is baked into the JWT at login (Phase B) — no fallback DB query needed
    const zoneId = session?.user?.zoneId ?? null;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // Build the zone filter — admins see all zones if somehow zoneId is missing
    const zoneFilter = zoneId ? { zoneId } : {};

    // Run both queries in parallel:
    //   1. groupBy — all status counts for today (active + completed + cancelled)
    //   2. findMany — completed visits today, only the two time fields needed for avg-wait
    const [statusGroups, completedVisits] = await Promise.all([
      db.visit.groupBy({
        by: ["status"],
        where: {
          ...zoneFilter,
          checkInTime: { gte: todayStart, lt: tomorrowStart },
        },
        _count: { _all: true },
      }),
      db.visit.findMany({
        where: {
          ...zoneFilter,
          status: "COMPLETED",
          completedTime: { gte: todayStart, lt: tomorrowStart },
        },
        select: {
          checkInTime: true,
          calledTime: true,
        },
      }),
    ]);

    // Aggregate counts from the groupBy in a single pass
    let waitingCount       = 0;
    let inConsultationCount = 0;
    let seenCount          = 0;
    let dnaCount           = 0;

    for (const g of statusGroups) {
      const c = g._count._all;
      if      (g.status === "WAITING"   ) waitingCount        = c;
      else if (g.status === "IN_ROOM"   ) inConsultationCount = c;
      else if (g.status === "COMPLETED" ) seenCount           = c;
      else if (g.status === "CANCELLED" ) dnaCount            = c;
    }

    // Average wait: checkInTime → calledTime (time in queue before being called)
    let avgWaitMinutes: number | null = null;
    const visitsWithCalledTime = completedVisits.filter((v) => v.calledTime != null);
    if (visitsWithCalledTime.length > 0) {
      const totalWaitMs = visitsWithCalledTime.reduce(
        (acc, v) => acc + (v.calledTime!.getTime() - v.checkInTime.getTime()),
        0
      );
      avgWaitMinutes = Math.round(totalWaitMs / visitsWithCalledTime.length / 60000);
    }

    // Per-hour volume: bucket completed visits by hour of checkInTime
    const HOUR_START = 6;
    const HOUR_END   = 20;
    const bucketMap  = new Map<number, number>();
    for (let h = HOUR_START; h <= HOUR_END; h++) bucketMap.set(h, 0);

    for (const v of completedVisits) {
      const hour = v.checkInTime.getHours();
      if (hour >= HOUR_START && hour <= HOUR_END) {
        bucketMap.set(hour, (bucketMap.get(hour) ?? 0) + 1);
      }
    }

    const hourlyVolume: HourlyBucket[] = Array.from(bucketMap.entries()).map(
      ([hour, count]) => ({
        hour,
        label: `${String(hour).padStart(2, "0")}:00`,
        count,
      })
    );

    return {
      success: true,
      seenToday: seenCount,
      waitingNow: waitingCount,
      inConsultationNow: inConsultationCount,
      dnaToday: dnaCount,
      avgWaitMinutes,
      hourlyVolume,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("getReportsDataAction error:", message);
    return { ...empty, error: message };
  }
}
