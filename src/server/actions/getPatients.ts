"use server";

import { db } from "@/lib/db";

export interface PatientListItem {
  id: string;
  fullName: string;
  phone: string | null;
  totalVisits: number;
  lastVisit: {
    id: string;
    ticketNumber: string;
    status: "WAITING" | "IN_ROOM" | "COMPLETED" | "CANCELLED";
    reason: string;
    checkInTime: string; // ISO string
    zoneName: string;
  } | null;
  createdAt: string; // ISO string
}

export interface PatientListResult {
  success: boolean;
  patients: PatientListItem[];
  total: number;
  error?: string;
}

/**
 * Returns all patients ordered by most recently registered.
 * Includes their most recent visit for inline status display.
 * No pagination for now — clinic scale is hundreds, not millions.
 */
export async function getPatientsAction(): Promise<PatientListResult> {
  try {
    const patients = await db.patient.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        visits: {
          orderBy: { checkInTime: "desc" },
          take: 1,
          include: { zone: { select: { name: true } } },
        },
        _count: { select: { visits: true } },
      },
    });

    const items: PatientListItem[] = patients.map((p) => {
      const lastRaw = p.visits[0] ?? null;
      return {
        id: p.id,
        fullName: p.fullName,
        phone: p.phone,
        totalVisits: p._count.visits,
        lastVisit: lastRaw
          ? {
              id: lastRaw.id,
              ticketNumber: lastRaw.ticketNumber,
              status: lastRaw.status as "WAITING" | "IN_ROOM" | "COMPLETED" | "CANCELLED",
              reason: lastRaw.reason,
              checkInTime: lastRaw.checkInTime.toISOString(),
              zoneName: lastRaw.zone.name,
            }
          : null,
        createdAt: p.createdAt.toISOString(),
      };
    });

    return { success: true, patients: items, total: items.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("getPatientsAction error:", message);
    return { success: false, patients: [], total: 0, error: message };
  }
}
