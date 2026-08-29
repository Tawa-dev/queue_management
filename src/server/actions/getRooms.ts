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

    // Resolve zone — prefer explicit arg, then session user zone, then default Block A
    let zoneId = targetZoneId || session.user.zoneId;
    if (!zoneId) {
      const defaultZone = await db.zone.findFirst({ where: { code: "A" } });
      if (!defaultZone) {
        return {
          success: false,
          rooms: [],
          recentAssignments: [],
          error: "No active clinic zone found.",
        };
      }
      zoneId = defaultZone.id;
    }

    // Fetch all rooms for zone, including any active IN_ROOM visit
    const rawRooms = await db.room.findMany({
      where: { zoneId },
      orderBy: [{ roomNumber: "asc" }],
      include: {
        visits: {
          where: { status: "IN_ROOM" },
          orderBy: { calledTime: "desc" },
          take: 1,
          include: { patient: true },
        },
      },
    });

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

    // Fetch recent assignments (last 5 visits that moved to IN_ROOM or COMPLETED today)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const recentRaw = await db.visit.findMany({
      where: {
        zoneId,
        status: { in: ["IN_ROOM", "COMPLETED"] },
        calledTime: { gte: startOfDay },
        roomId: { not: null },
      },
      orderBy: { calledTime: "desc" },
      take: 5,
      include: {
        patient: true,
        room: true,
      },
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
