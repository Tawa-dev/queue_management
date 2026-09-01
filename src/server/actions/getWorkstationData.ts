"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { QueueVisitItem, QueueSummaryMetrics } from "./getQueue";
import type { RoomItem, RecentAssignment } from "./getRooms";

// Types are intentionally NOT re-exported from this "use server" file —
// the RSC bundler can mishandle type-only re-exports from server action
// files. Import them directly from getQueue.ts / getRooms.ts in client code.

export interface WorkstationData {
  success: boolean;
  // Queue
  visits: QueueVisitItem[];
  summary: QueueSummaryMetrics;
  lastUpdated: string;
  // Rooms
  rooms: RoomItem[];
  recentAssignments: RecentAssignment[];
  error?: string;
}

const EMPTY_SUMMARY: QueueSummaryMetrics = {
  todayCount: 0,
  waitingCount: 0,
  inConsultationCount: 0,
  seenCount: 0,
  dnaCount: 0,
};

/**
 * Single server action for the workstation page.
 * Calls auth() once and fires all four DB queries in parallel,
 * halving the number of auth() calls vs. the previous separate actions.
 */
export async function getWorkstationDataAction(): Promise<WorkstationData> {
  const failed = (error: string): WorkstationData => ({
    success: false,
    visits: [],
    summary: EMPTY_SUMMARY,
    lastUpdated: new Date().toLocaleTimeString("en-GB"),
    rooms: [],
    recentAssignments: [],
    error,
  });

  try {
    const session = await auth();
    if (!session?.user) return failed("Authentication required.");

    // zoneId is always present in the JWT — resolved at login time for all
    // roles including admins (see src/lib/auth.ts authorize callback).
    const zoneId = session.user.zoneId;
    if (!zoneId) return failed("No active clinic zone found. Please sign out and sign in again.");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // All four queries are independent — fire them all at once
    const [statusGroups, rawVisits, rawRooms, recentRaw] = await Promise.all([
      // 1. Summary counts (groupBy)
      db.visit.groupBy({
        by: ["status"],
        where: { zoneId, checkInTime: { gte: startOfDay } },
        _count: { _all: true },
      }),

      // 2. Waiting visit rows
      db.visit.findMany({
        where: { zoneId, status: "WAITING" },
        orderBy: [{ isUrgent: "desc" }, { checkInTime: "asc" }],
        select: {
          id: true,
          ticketNumber: true,
          reason: true,
          isUrgent: true,
          status: true,
          checkInTime: true,
          zoneId: true,
          roomId: true,
          patient: { select: { fullName: true } },
          room:    { select: { name: true } },
        },
      }),

      // 3. Rooms with active visit
      db.room.findMany({
        where: { zoneId },
        orderBy: { roomNumber: "asc" },
        select: {
          id: true,
          name: true,
          roomNumber: true,
          status: true,
          visits: {
            where: { status: "IN_ROOM" },
            orderBy: { calledTime: "desc" },
            take: 1,
            select: {
              id: true,
              ticketNumber: true,
              reason: true,
              calledTime: true,
              patient: { select: { fullName: true } },
            },
          },
        },
      }),

      // 4. Recent assignments (today)
      db.visit.findMany({
        where: {
          zoneId,
          status: { in: ["IN_ROOM", "COMPLETED"] },
          calledTime: { gte: startOfDay },
          roomId: { not: null },
        },
        orderBy: { calledTime: "desc" },
        take: 5,
        select: {
          ticketNumber: true,
          calledTime: true,
          patient: { select: { fullName: true } },
          room:    { select: { name: true } },
        },
      }),
    ]);

    // Aggregate summary counts
    let todayCount = 0, waitingCount = 0, inConsultationCount = 0,
        seenCount = 0, dnaCount = 0;
    for (const g of statusGroups) {
      const c = g._count._all;
      todayCount += c;
      if      (g.status === "WAITING"   ) waitingCount        = c;
      else if (g.status === "IN_ROOM"   ) inConsultationCount = c;
      else if (g.status === "COMPLETED" ) seenCount           = c;
      else if (g.status === "CANCELLED" ) dnaCount            = c;
    }

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
      roomName: v.room?.name ?? null,
    }));

    const rooms: RoomItem[] = rawRooms.map((room) => {
      const av = room.visits[0] ?? null;
      return {
        id: room.id,
        name: room.name,
        roomNumber: room.roomNumber,
        status: room.status as "FREE" | "OCCUPIED",
        activeVisit: av
          ? {
              id: av.id,
              ticketNumber: av.ticketNumber,
              patientName: av.patient.fullName,
              reason: av.reason,
              calledTime: av.calledTime!.toISOString(),
            }
          : undefined,
      };
    });

    const recentAssignments: RecentAssignment[] = recentRaw.map((v) => ({
      calledTime: v.calledTime!.toISOString(),
      ticketNumber: v.ticketNumber,
      patientName: v.patient.fullName,
      roomName: v.room?.name ?? "Unknown Room",
    }));

    return {
      success: true,
      visits,
      summary: { todayCount, waitingCount, inConsultationCount, seenCount, dnaCount },
      lastUpdated: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
      }),
      rooms,
      recentAssignments,
    };
  } catch (err: any) {
    console.error("Error in getWorkstationDataAction:", err);
    return failed(err?.message ?? "Failed to retrieve workstation data.");
  }
}
