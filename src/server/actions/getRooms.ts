"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface ActiveVisitInfo {
  id: string;
  ticketNumber: string;
  patientName: string;
  reason: string;
  calledTime: string; // ISO string
}

export interface RoomItem {
  id: string;
  name: string;
  roomNumber: string;
  status: "FREE" | "OCCUPIED";
  activeVisit?: ActiveVisitInfo;
}

export interface GetRoomsResult {
  success: boolean;
  rooms: RoomItem[];
  recentAssignments: RecentAssignment[];
  error?: string;
}

export interface RecentAssignment {
  calledTime: string; // ISO string
  ticketNumber: string;
  patientName: string;
  roomName: string;
}

export async function getRoomsAction(
  targetZoneId?: string
): Promise<GetRoomsResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        rooms: [],
        recentAssignments: [],
        error: "Authentication required.",
      };
    }

    // zoneId is always present in the JWT — resolved at login time for all roles
    const zoneId = targetZoneId || session.user.zoneId;
    if (!zoneId) {
      return {
        success: false,
        rooms: [],
        recentAssignments: [],
        error: "No active clinic zone found. Please sign out and sign in again.",
      };
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Rooms and recent assignments are independent — run in parallel
    const [rawRooms, recentRaw] = await Promise.all([
      db.room.findMany({
        where: { zoneId },
        orderBy: [{ roomNumber: "asc" }],
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
      db.visit.findMany({
        where: {
          zoneId,
          status: { in: ["IN_ROOM", "COMPLETED"] },
          calledTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
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

    const rooms: RoomItem[] = rawRooms.map((room) => {
      const activeVisitRaw = room.visits[0] ?? null;
      return {
        id: room.id,
        name: room.name,
        roomNumber: room.roomNumber,
        status: room.status as "FREE" | "OCCUPIED",
        activeVisit: activeVisitRaw
          ? {
              id: activeVisitRaw.id,
              ticketNumber: activeVisitRaw.ticketNumber,
              patientName: activeVisitRaw.patient.fullName,
              reason: activeVisitRaw.reason,
              calledTime: activeVisitRaw.calledTime!.toISOString(),
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
      rooms,
      recentAssignments,
    };
  } catch (err: any) {
    console.error("Error in getRoomsAction:", err);
    return {
      success: false,
      rooms: [],
      recentAssignments: [],
      error: err?.message ?? "Failed to retrieve room data.",
    };
  }
}
