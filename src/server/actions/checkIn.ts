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

    // Resolve target clinic Zone ID (use user's assigned zone or fallback to Block A)
    let zoneId = session.user.zoneId;
    if (!zoneId) {
      const defaultZone = await db.zone.findFirst({
        where: { code: "A" },
      });
      if (!defaultZone) {
        return {
          success: false,
          error: "No active clinic zone found. Please contact administration.",
        };
      }
      zoneId = defaultZone.id;
    }

    // Start of today for ticket sequencing and duplicate checking
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Duplicate check: check if same patient name has an active WAITING visit in this zone today
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
        include: { patient: true },
      });

      if (existingVisit) {
        return {
          success: false,
          warning: `Patient "${fullName}" already has an active waiting ticket (#${existingVisit.ticketNumber}) today. Click "Proceed Check In" to confirm duplicate visit.`,
          requiresConfirmation: true,
        };
      }
    }

    // Transaction for atomic sequence generation and visit creation
    const result = await db.$transaction(async (tx) => {
      // Find or create Patient
      let patient = await tx.patient.findFirst({
        where: {
          fullName: { equals: fullName, mode: "insensitive" },
        },
      });

      if (!patient) {
        patient = await tx.patient.create({
          data: {
            fullName,
            phone,
          },
        });
      } else if (phone && !patient.phone) {
        // Update phone if previously missing
        patient = await tx.patient.update({
          where: { id: patient.id },
          data: { phone },
        });
      }

      // Generate daily sequence ticket number per zone
      const todayVisitsCount = await tx.visit.count({
        where: {
          zoneId,
          checkInTime: { gte: startOfDay },
        },
      });

      const nextSeqNumber = todayVisitsCount + 1;
      const ticketNumber = `${nextSeqNumber}`;

      // Create Visit record with status WAITING
      const visit = await tx.visit.create({
        data: {
          ticketNumber,
          patientId: patient.id,
          zoneId,
          reason,
          isUrgent,
          status: "WAITING",
          createdById: session.user.id,
        },
      });

      return {
        visitId: visit.id,
        ticketNumber: visit.ticketNumber,
        patientName: patient.fullName,
      };
    });

    revalidatePath("/");
    revalidatePath("/queue");

    return {
      success: true,
      visitId: result.visitId,
      ticketNumber: result.ticketNumber,
      patientName: result.patientName,
    };
  } catch (err: any) {
    console.error("Error in checkInPatientAction:", err);
    return {
      success: false,
      error: err?.message || "An unexpected database error occurred during check in.",
    };
  }
}
