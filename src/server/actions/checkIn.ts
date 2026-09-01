"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CheckInInput {
  fullName: string;
  reason: string;
  isUrgent?: boolean;
  phone?: string;
  bypassDuplicateWarning?: boolean;
}

export interface CheckInResult {
  success: boolean;
  visitId?: string;
  ticketNumber?: string;
  patientName?: string;
  warning?: string;
  requiresConfirmation?: boolean;
  error?: string;
}

export async function checkInPatientAction(
  input: CheckInInput
): Promise<CheckInResult> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return {
        success: false,
        error: "Authentication required to check in patients. Please sign in.",
      };
    }

    const fullName = input.fullName?.trim();
    const reason = input.reason?.trim();
    const phone = input.phone?.trim() || null;
    const isUrgent = !!input.isUrgent;

    if (!fullName || !reason) {
      return {
        success: false,
        error: "Both patient full name and reason for visit are required.",
      };
    }

    // Start of today — computed once, reused for both duplicate check and ticket count
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // zoneId is always present in the JWT — resolved at login time for all roles
    let zoneId = session.user.zoneId;
    if (!zoneId) {
      return {
        success: false,
        error: "No active clinic zone found. Please sign out and sign in again.",
      };
    }

    // Duplicate check: join-free — query visits directly on patientName via patient relation.
    // Runs before the transaction so we can bail early without holding a DB connection.
    if (!input.bypassDuplicateWarning) {
      const existingVisit = await db.visit.findFirst({
        where: {
          zoneId,
          status: "WAITING",
          checkInTime: { gte: startOfDay },
          patient: {
            fullName: { equals: fullName, mode: "insensitive" },
          },
        },
        select: { ticketNumber: true },   // only need the ticket number for the warning
      });

      if (existingVisit) {
        return {
          success: false,
          warning: `Patient "${fullName}" already has an active waiting ticket (#${existingVisit.ticketNumber}) today. Click "Proceed Check In" to confirm duplicate visit.`,
          requiresConfirmation: true,
        };
      }
    }

    // ── Step 1: resolve or create the patient record OUTSIDE the transaction.
    // Patient find/create does not need to be atomic with visit creation.
    // Keeping it outside means the transaction only ever runs 2 fast queries.
    let patient = await db.patient.findFirst({
      where: { fullName: { equals: fullName, mode: "insensitive" } },
      select: { id: true, fullName: true, phone: true },
    });

    if (!patient) {
      patient = await db.patient.create({
        data: { fullName, phone },
        select: { id: true, fullName: true, phone: true },
      });
    } else if (phone && !patient.phone) {
      patient = await db.patient.update({
        where: { id: patient.id },
        data: { phone },
        select: { id: true, fullName: true, phone: true },
      });
    }

    // ── Step 2: atomically count today's visits and create the new visit.
    // Only these two queries need a transaction (for sequential ticket numbering).
    // With patient already resolved, this is just 2 round-trips inside the tx.
    const patientId = patient.id;
    const patientName = patient.fullName;

    const result = await db.$transaction(
      async (tx) => {
        const todayCount = await tx.visit.count({
          where: { zoneId: zoneId!, checkInTime: { gte: startOfDay } },
        });

        const visit = await tx.visit.create({
          data: {
            ticketNumber: `${todayCount + 1}`,
            patientId,
            zoneId: zoneId!,
            reason,
            isUrgent,
            status: "WAITING",
            createdById: session.user.id,
          },
          select: { id: true, ticketNumber: true },
        });

        return { visitId: visit.id, ticketNumber: visit.ticketNumber };
      },
      { timeout: 15_000 } // generous ceiling; 2 queries should complete in <2 s
    );

    revalidatePath("/queue");

    return {
      success: true,
      visitId: result.visitId,
      ticketNumber: result.ticketNumber,
      patientName,
    };
  } catch (err: any) {
    console.error("Error in checkInPatientAction:", err);
    return {
      success: false,
      error: err?.message || "An unexpected database error occurred during check in.",
    };
  }
}
