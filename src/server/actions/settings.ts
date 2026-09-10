"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------
export interface SettingsResult {
  success: boolean;
  error?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "RECEPTIONIST" | "DOCTOR" | "ADMIN";
  zoneName: string | null;
  createdAt: string;
}

export interface ZoneOption {
  id: string;
  name: string;
  code: string;
}

export interface RoomSetting {
  id: string;
  name: string;
  roomNumber: string;
  zoneId: string;
  zoneName: string;
  status: "FREE" | "OCCUPIED";
}

export interface SettingsData {
  staff: StaffMember[];
  rooms: RoomSetting[];
  zones: ZoneOption[];
}

// ---------------------------------------------------------------------------
// Admin gate helper
// ---------------------------------------------------------------------------
async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return { error: "Authentication required." };
  if (session.user.role !== "ADMIN") return { error: "Admin access required." };
  return { session };
}

// ---------------------------------------------------------------------------
// Load all settings data in one call
// ---------------------------------------------------------------------------
export async function getSettingsDataAction(): Promise<SettingsData & { success: boolean; error?: string }> {
  const guard = await requireAdmin();
  if ("error" in guard && guard.error) {
    return { success: false, error: guard.error, staff: [], rooms: [], zones: [] };
  }

  const [rawStaff, rawRooms, rawZones] = await Promise.all([
    db.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        zone: { select: { name: true } },
      },
    }),
    db.room.findMany({
      orderBy: [{ zoneId: "asc" }, { roomNumber: "asc" }],
      select: {
        id: true, name: true, roomNumber: true, zoneId: true, status: true,
        zone: { select: { name: true } },
      },
    }),
    db.zone.findMany({
      orderBy: { code: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  return {
    success: true,
    staff: rawStaff.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      zoneName: u.zone?.name ?? null,
      createdAt: u.createdAt.toISOString(),
    })),
    rooms: rawRooms.map((r) => ({
      id: r.id,
      name: r.name,
      roomNumber: r.roomNumber,
      zoneId: r.zoneId,
      zoneName: r.zone.name,
      status: r.status as "FREE" | "OCCUPIED",
    })),
    zones: rawZones,
  };
}

// ---------------------------------------------------------------------------
// Staff actions
// ---------------------------------------------------------------------------
export async function addStaffAction(input: {
  name: string;
  email: string;
  role: Role;
  zoneId: string | null;
  password: string;
}): Promise<SettingsResult> {
  const guard = await requireAdmin();
  if ("error" in guard && guard.error) return { success: false, error: guard.error };

  const { name, email, role, zoneId, password } = input;

  if (!name.trim() || !email.trim() || !password.trim()) {
    return { success: false, error: "Name, email, and password are required." };
  }
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return { success: false, error: "A staff account with this email already exists." };
  }

  const passwordHash = await hash(password, 10);

  await db.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      zoneId: zoneId || null,
      passwordHash,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function resetPasswordAction(input: {
  userId: string;
  newPassword: string;
}): Promise<SettingsResult> {
  const guard = await requireAdmin();
  if ("error" in guard && guard.error) return { success: false, error: guard.error };

  const { userId, newPassword } = input;

  if (!userId) return { success: false, error: "User ID is required." };
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { success: false, error: "Staff member not found." };

  const passwordHash = await hash(newPassword, 10);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });

  revalidatePath("/settings");
  return { success: true };
}

export async function removeStaffAction(userId: string): Promise<SettingsResult> {
  const guard = await requireAdmin();
  if ("error" in guard && guard.error) return { success: false, error: guard.error };

  if (!userId) return { success: false, error: "User ID is required." };

  // Prevent admin from deleting their own account
  if ("session" in guard && guard.session?.user?.id === userId) {
    return { success: false, error: "You cannot remove your own account." };
  }

  // Check for active IN_ROOM visits created by this user today
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const activeVisits = await db.visit.count({
    where: { createdById: userId, status: "IN_ROOM", checkInTime: { gte: startOfDay } },
  });
  if (activeVisits > 0) {
    return { success: false, error: "Cannot remove a staff member with active consultations today." };
  }

  await db.user.delete({ where: { id: userId } });

  revalidatePath("/settings");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Room actions
// ---------------------------------------------------------------------------
export async function addRoomAction(input: {
  name: string;
  roomNumber: string;
  zoneId: string;
}): Promise<SettingsResult> {
  const guard = await requireAdmin();
  if ("error" in guard && guard.error) return { success: false, error: guard.error };

  const { name, roomNumber, zoneId } = input;

  if (!name.trim() || !roomNumber.trim() || !zoneId) {
    return { success: false, error: "Room name, number, and zone are required." };
  }

  const existing = await db.room.findUnique({
    where: { zoneId_roomNumber: { zoneId, roomNumber: roomNumber.trim() } },
  });
  if (existing) {
    return { success: false, error: `Room number ${roomNumber} already exists in this zone.` };
  }

  await db.room.create({
    data: {
      name: name.trim(),
      roomNumber: roomNumber.trim(),
      zoneId,
      status: "FREE",
    },
  });

  revalidatePath("/settings");
  revalidatePath("/rooms");
  revalidatePath("/queue");
  return { success: true };
}

export async function removeRoomAction(roomId: string): Promise<SettingsResult> {
  const guard = await requireAdmin();
  if ("error" in guard && guard.error) return { success: false, error: guard.error };

  if (!roomId) return { success: false, error: "Room ID is required." };

  const room = await db.room.findUnique({
    where: { id: roomId },
    select: { id: true, status: true, name: true },
  });
  if (!room) return { success: false, error: "Room not found." };
  if (room.status === "OCCUPIED") {
    return { success: false, error: `${room.name} is currently occupied and cannot be removed.` };
  }

  await db.room.delete({ where: { id: roomId } });

  revalidatePath("/settings");
  revalidatePath("/rooms");
  revalidatePath("/queue");
  return { success: true };
}
