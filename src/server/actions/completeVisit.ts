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

    const result = await db.$transaction(async (tx) => {
      // Fetch the visit with its room
      const visit = await tx.visit.findUnique({
        where: { id: visitId },
        include: { room: true },
      });

      if (!visit) {
        throw new Error("Visit not found.");
      }
      if (visit.status !== "IN_ROOM") {
        throw new Error("Visit is not currently in room and cannot be completed.");
      }
      if (!visit.roomId) {
        throw new Error("Visit has no assigned room.");
      }

      const now = new Date();

      // Atomically mark visit completed and free the room
      const [updatedVisit] = await Promise.all([
        tx.visit.update({
          where: { id: visit.id },
          data: {
            status: "COMPLETED",
            completedTime: now,
          },
        }),
        tx.room.update({
          where: { id: visit.roomId },
          data: { status: "FREE" },
        }),
      ]);

      return {
        visitId: updatedVisit.id,
        roomName: visit.room?.name ?? "Unknown Room",
      };
    });

    revalidatePath("/");
    revalidatePath("/queue");
    revalidatePath("/rooms");

    return { success: true, ...result };
  } catch (err: any) {
    console.error("Error in completeVisitAction:", err);
    return {
      success: false,
      error: err?.message ?? "An unexpected error occurred while completing the visit.",
    };
  }
}
