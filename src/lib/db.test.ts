import { describe, it, expect } from "vitest";
import { db } from "./db";
import { Role, RoomStatus, VisitStatus } from "@prisma/client";

describe("Core Data Model & Database Client (Spec 0002)", () => {
  it("exports a valid Prisma Client instance (covers: AC-3)", () => {
    expect(db).toBeDefined();
    expect(typeof db).toBe("object");
  });

  it("contains correct Role enum definitions (covers: AC-1)", () => {
    expect(Role.RECEPTIONIST).toBe("RECEPTIONIST");
    expect(Role.DOCTOR).toBe("DOCTOR");
    expect(Role.ADMIN).toBe("ADMIN");
  });

  it("contains correct RoomStatus enum definitions (covers: AC-1)", () => {
    expect(RoomStatus.FREE).toBe("FREE");
    expect(RoomStatus.OCCUPIED).toBe("OCCUPIED");
  });

  it("contains correct VisitStatus enum definitions (covers: AC-1)", () => {
    expect(VisitStatus.WAITING).toBe("WAITING");
    expect(VisitStatus.IN_ROOM).toBe("IN_ROOM");
    expect(VisitStatus.COMPLETED).toBe("COMPLETED");
    expect(VisitStatus.CANCELLED).toBe("CANCELLED");
  });
});
