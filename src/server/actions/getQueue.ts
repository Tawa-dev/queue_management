"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface QueueVisitItem {
  id: string;
  ticketNumber: string;
  patientName: string;
  reason: string;
  isUrgent: boolean;
  status: string;
  checkInTime: string; // ISO string for client parsing
  zoneId: string;
  roomId?: string | null;
  roomName?: string | null;
}

export interface QueueSummaryMetrics {
  todayCount: number;
  waitingCount: number;
  inConsultationCount: number;
  seenCount: number;
  dnaCount: number;
}

export interface GetQueueDataResult {
  success: boolean;
  visits: QueueVisitItem[];
  summary: QueueSummaryMetrics;
  lastUpdated: string;
  error?: string;
}

export async function getQueueDataAction(
  targetZoneId?: string
): Promise<GetQueueDataResult> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return {
        success: false,
        visits: [],
        summary: {
          todayCount: 0,
          waitingCount: 0,
          inConsultationCount: 0,
          seenCount: 0,
          dnaCount: 0,
        },
        lastUpdated: new Date().toLocaleTimeString("en-GB"),
        error: "Authentication required to fetch queue data.",
      };
    }

    // Resolve target zone ID
    let zoneId = targetZoneId || session.user.zoneId;
    if (!zoneId) {
      const defaultZone = await db.zone.findFirst({
        where: { code: "A" },
      });
      if (!defaultZone) {
        return {
          success: false,
          visits: [],
          summary: {
            todayCount: 0,
            waitingCount: 0,
            inConsultationCount: 0,
            seenCount: 0,
            dnaCount: 0,
          },
          lastUpdated: new Date().toLocaleTimeString("en-GB"),
          error: "No active clinic zone found.",
        };
      }
      zoneId = defaultZone.id;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Fetch summary metrics for today using a single aggregated groupBy query
    const statusGroups = await db.visit.groupBy({
      by: ["status"],
      where: { zoneId, checkInTime: { gte: startOfDay } },
      _count: { _all: true },
    });

    let todayCount = 0;
    let waitingCount = 0;
    let inConsultationCount = 0;
    let seenCount = 0;
    let dnaCount = 0;

    for (const group of statusGroups) {
      const count = group._count._all;
      todayCount += count;
      if (group.status === "WAITING") waitingCount = count;
      else if (group.status === "IN_ROOM") inConsultationCount = count;
      else if (group.status === "COMPLETED") seenCount = count;
      else if (group.status === "CANCELLED") dnaCount = count;
    }

    // Fetch active WAITING visits ordered by isUrgent desc, then checkInTime asc
    const rawVisits = await db.visit.findMany({
      where: {
        zoneId,
        status: "WAITING",
      },
      include: {
        patient: true,
        room: true,
      },
      orderBy: [{ isUrgent: "desc" }, { checkInTime: "asc" }],
    });

    const visits: QueueVisitItem[] = rawVisits.map((v) => ({
      id: v.id,
      ticketNumber: v.ticketNumber,
      patientName: v.patient.fullName,
      reason: v.reason,
      isUrgent: v.isUrgent,
      status: v.status,
      checkInTime: v.checkInTime.toISOString(),
      zoneId: v.zoneId,
      roomId: v.roomId,
      roomName: v.room?.name || null,
    }));

    return {
      success: true,
      visits,
      summary: {
        todayCount,
        waitingCount,
        inConsultationCount,
        seenCount,
        dnaCount,
      },
      lastUpdated: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
    };
  } catch (err: any) {
    console.error("Error in getQueueDataAction:", err);
    return {
      success: false,
      visits: [],
      summary: {
        todayCount: 0,
        waitingCount: 0,
        inConsultationCount: 0,
        seenCount: 0,
        dnaCount: 0,
      },
      lastUpdated: new Date().toLocaleTimeString("en-GB"),
      error: err?.message || "Failed to retrieve queue data.",
    };
  }
}
