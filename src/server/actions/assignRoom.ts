"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface AssignRoomResult {
  success: boolean;
  visitId?: string;
  ticketNumber?: string;
  patientName?: string;
  roomName?: string;
  error?: string;
}

export async function assignRoomAction(
  roomId: string
): Promise<AssignRoomResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Authentication required." };
    }

    // Role gate — only DOCTOR and ADMIN may assign
    if (session.user.role === "RECEPTIONIST") {
      return {
        success: false,
        error: "Insufficient permissions. Room assignment requires Doctor or Admin role.",
      };
    }

    if (!roomId) {
      return { success: false, error: "Room ID is required." };
    }

    // ── Step 1: read-only queries OUTSIDE the transaction.
    // Fetching room and next visit does not need to be atomic — we just need
    // the IDs. The transaction only runs the two write operations.
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true, name: true, zoneId: true, status: true },
    });
    if (!room) {
      return { success: false, error: "Room not found." };
    }
    if (room.status === "OCCUPIED") {
      return { success: false, error: "Room is already occupied." };
    }

    const nextVisit = await db.visit.findFirst({
      where: { zoneId: room.zoneId, status: "WAITING" },
      orderBy: [{ isUrgent: "desc" }, { checkInTime: "asc" }],
      select: {
        id: true,
        ticketNumber: true,
        patient: { select: { fullName: true } },
      },
    });
    if (!nextVisit) {
      return { success: false, error: "No patients currently waiting in this zone." };
    }

    // ── Step 2: atomic writes only — 2 queries, no sequential async inside tx.
    const now = new Date();
    await db.$transaction(
      [
        db.visit.update({
          where: { id: nextVisit.id },
          data: { status: "IN_ROOM", roomId: room.id, calledTime: now },
        }),
        db.room.update({
          where: { id: room.id },
          data: { status: "OCCUPIED" },
        }),
      ]
    );

    revalidatePath("/queue");
    revalidatePath("/rooms");

    return {
      success: true,
      visitId: nextVisit.id,
      ticketNumber: nextVisit.ticketNumber,
      patientName: nextVisit.patient.fullName,
      roomName: room.name,
    };
  } catch (err: any) {
    console.error("Error in assignRoomAction:", err);
    return {
      success: false,
      error: err?.message ?? "An unexpected error occurred during room assignment.",
    };
  }
}
