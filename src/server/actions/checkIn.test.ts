import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth module
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock db module
vi.mock("@/lib/db", () => ({
  db: {
    zone: {
      findFirst: vi.fn(),
    },
    patient: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    visit: {
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(db)),
  },
}));

import { checkInPatientAction } from "./checkIn";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

describe("checkInPatientAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns authentication error when staff is not signed in (covers: AC-1)", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const result = await checkInPatientAction({
      fullName: "Tendai Chikore",
      reason: "Severe Headache",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Authentication required");
  });

  it("returns validation error when fullName or reason is empty (covers: AC-5)", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "reception@mabvuku.co.zw", name: "R. Moyo", role: "RECEPTIONIST", zoneId: "zone-a" },
    } as any);

    const result = await checkInPatientAction({
      fullName: "   ",
      reason: "",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("required");
  });

  it("successfully checks in a new patient and generates sequential ticket #1 (covers: AC-2, AC-3)", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "reception@mabvuku.co.zw", name: "R. Moyo", role: "RECEPTIONIST", zoneId: "zone-a" },
    } as any);

    vi.mocked(db.visit.findFirst).mockResolvedValue(null);
    vi.mocked(db.patient.findFirst).mockResolvedValue(null);
    vi.mocked(db.patient.create).mockResolvedValue({
      id: "patient-1",
      fullName: "Tendai Chikore",
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.visit.count).mockResolvedValue(0);
    vi.mocked(db.visit.create).mockResolvedValue({
      id: "visit-1",
      ticketNumber: "1",
      patientId: "patient-1",
      zoneId: "zone-a",
      roomId: null,
      reason: "Severe Headache",
      isUrgent: true,
      status: "WAITING",
      checkInTime: new Date(),
      calledTime: null,
      completedTime: null,
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await checkInPatientAction({
      fullName: "Tendai Chikore",
      reason: "Severe Headache",
      isUrgent: true,
    });

    expect(result.success).toBe(true);
    expect(result.ticketNumber).toBe("1");
    expect(result.patientName).toBe("Tendai Chikore");
  });

  it("detects existing WAITING visit for same patient today and raises warning (covers: AC-4)", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "reception@mabvuku.co.zw", name: "R. Moyo", role: "RECEPTIONIST", zoneId: "zone-a" },
    } as any);

    vi.mocked(db.visit.findFirst).mockResolvedValue({
      id: "visit-existing",
      ticketNumber: "5",
      patientId: "patient-1",
      zoneId: "zone-a",
      status: "WAITING",
      patient: { fullName: "Tendai Chikore" },
    } as any);

    const result = await checkInPatientAction({
      fullName: "Tendai Chikore",
      reason: "Fever",
    });

    expect(result.success).toBe(false);
    expect(result.requiresConfirmation).toBe(true);
    expect(result.warning).toContain("already has an active waiting ticket");
  });

  it("proceeds with duplicate check-in when bypassDuplicateWarning is true (covers: AC-4)", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "reception@mabvuku.co.zw", name: "R. Moyo", role: "RECEPTIONIST", zoneId: "zone-a" },
    } as any);

    vi.mocked(db.patient.findFirst).mockResolvedValue({
      id: "patient-1",
      fullName: "Tendai Chikore",
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.visit.count).mockResolvedValue(1);
    vi.mocked(db.visit.create).mockResolvedValue({
      id: "visit-2",
      ticketNumber: "2",
      patientId: "patient-1",
      zoneId: "zone-a",
      roomId: null,
      reason: "Fever",
      isUrgent: false,
      status: "WAITING",
      checkInTime: new Date(),
      calledTime: null,
      completedTime: null,
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await checkInPatientAction({
      fullName: "Tendai Chikore",
      reason: "Fever",
      bypassDuplicateWarning: true,
    });

    expect(result.success).toBe(true);
    expect(result.ticketNumber).toBe("2");
  });
});
