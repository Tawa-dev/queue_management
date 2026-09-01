"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CompleteVisitResult {
  success: boolean;
  visitId?: string;
  roomName?: string;
  error?: string;
}

export async function completeVisitAction(
  visitId: string
): Promise<CompleteVisitResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Authentication required." };
    }

    // Role gate — only DOCTOR and ADMIN may complete a visit
    if (session.user.role === "RECEPTIONIST") {
      return {
        success: false,
        error: "Insufficient permissions. Completing a visit requires Doctor or Admin role.",
      };
    }

    if (!visitId) {
      return { success: false, error: "Visit ID is required." };
    }

    // Read visit outside the transaction — only the writes need to be atomic
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      select: {
        id: true,
        status: true,
        roomId: true,
        room: { select: { name: true } },
      },
    });

    if (!visit) {
      return { success: false, error: "Visit not found." };
    }
    if (visit.status !== "IN_ROOM") {
      return { success: false, error: "Visit is not currently in room and cannot be completed." };
    }
    if (!visit.roomId) {
      return { success: false, error: "Visit has no assigned room." };
    }

    const now = new Date();

    // Batch transaction — 2 writes, single network round-trip, no timeout risk
    await db.$transaction([
      db.visit.update({
        where: { id: visit.id },
        data: { status: "COMPLETED", completedTime: now },
      }),
      db.room.update({
        where: { id: visit.roomId },
        data: { status: "FREE" },
      }),
    ]);

    revalidatePath("/queue");
    revalidatePath("/rooms");

    return {
      success: true,
      visitId: visit.id,
      roomName: visit.room?.name ?? "Unknown Room",
    };
  } catch (err: any) {
    console.error("Error in completeVisitAction:", err);
    return {
      success: false,
      error: err?.message ?? "An unexpected error occurred while completing the visit.",
    };
  }
}
