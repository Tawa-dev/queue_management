"use server";

import { db } from "@/lib/db";

export interface DisplayRoomItem {
  id: string;
  name: string;
  roomNumber: string;
  status: "FREE" | "OCCUPIED";
  activeVisit?: {
    id: string;
    ticketNumber: string;
    patientName: string;
  };
}

export interface DisplayQueueItem {
  position: number;
  ticketNumber: string;
  patientName: string;
  isUrgent: boolean;
}

export interface DisplayData {
  success: boolean;
  zoneName: string;
  rooms: DisplayRoomItem[];
  queue: DisplayQueueItem[];
  error?: string;
}

/**
 * Public server action — no auth required.
 * Resolves zone by URL code param, returns rooms + queue in one call.
 */
export async function getDisplayDataAction(
  zoneCode: string
): Promise<DisplayData> {
  try {
    const normalizedCode = zoneCode.trim().toUpperCase();

    const zone = await db.zone.findUnique({
      where: { code: normalizedCode },
      select: { id: true, name: true },
    });

    if (!zone) {
      return {
        success: false,
        zoneName: "",
        rooms: [],
        queue: [],
        error: `Zone '${zoneCode}' not found`,
      };
    }

    // Rooms and queue are independent once we have the zone ID — run in parallel
    const [rawRooms, rawQueue] = await Promise.all([
      db.room.findMany({
        where: { zoneId: zone.id },
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
              patient: { select: { fullName: true } },
            },
          },
        },
      }),
      db.visit.findMany({
        where: { zoneId: zone.id, status: "WAITING" },
        orderBy: [{ isUrgent: "desc" }, { checkInTime: "asc" }],
        take: 10,
        select: {
          ticketNumber: true,
          isUrgent: true,
          patient: { select: { fullName: true } },
        },
      }),
    ]);

    const rooms: DisplayRoomItem[] = rawRooms.map((room) => {
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
            }
          : undefined,
      };
    });

    const queue: DisplayQueueItem[] = rawQueue.map((v, idx) => ({
      position: idx + 1,
      ticketNumber: v.ticketNumber,
      patientName: v.patient.fullName,
      isUrgent: v.isUrgent,
    }));

    return {
      success: true,
      zoneName: zone.name,
      rooms,
      queue,
    };
  } catch (err: any) {
    console.error("Error in getDisplayDataAction:", err);
    return {
      success: false,
      zoneName: "",
      rooms: [],
      queue: [],
      error: err?.message ?? "Failed to retrieve display data.",
    };
  }
}
