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

    const result = await db.$transaction(async (tx) => {
      // Fetch the room and validate it exists and is FREE
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room) {
        throw new Error("Room not found.");
      }
      if (room.status === "OCCUPIED") {
        throw new Error("Room is already occupied.");
      }

      // Find the queue head for this zone: urgent first, then oldest check-in
      const nextVisit = await tx.visit.findFirst({
        where: { zoneId: room.zoneId, status: "WAITING" },
        orderBy: [{ isUrgent: "desc" }, { checkInTime: "asc" }],
        include: { patient: true },
      });

      if (!nextVisit) {
        throw new Error("No patients currently waiting in this zone.");
      }

      const now = new Date();

      // Atomically update visit and room together
      const [updatedVisit] = await Promise.all([
        tx.visit.update({
          where: { id: nextVisit.id },
          data: {
            status: "IN_ROOM",
            roomId: room.id,
            calledTime: now,
          },
        }),
        tx.room.update({
          where: { id: room.id },
          data: { status: "OCCUPIED" },
        }),
      ]);

      return {
        visitId: updatedVisit.id,
        ticketNumber: updatedVisit.ticketNumber,
        patientName: nextVisit.patient.fullName,
        roomName: room.name,
      };
    });

    revalidatePath("/");
    revalidatePath("/queue");
    revalidatePath("/rooms");

    return { success: true, ...result };
  } catch (err: any) {
    console.error("Error in assignRoomAction:", err);
    return {
      success: false,
      error: err?.message ?? "An unexpected error occurred during room assignment.",
    };
  }
}
