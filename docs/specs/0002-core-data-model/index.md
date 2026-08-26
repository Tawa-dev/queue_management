# 0002. Core data model

**Date**: 2026-08-26
**Status**: In Progress

## Summary

We are defining the core relational database schema for Mabvuku Polyclinic Queue Management System using Prisma 6 and Supabase Postgres. The schema models five primary entities: Zone, Room, User (Staff), Patient, and Visit, supported by three Enums: Role, RoomStatus, and VisitStatus. This schema establishes a clean, standalone operational model for queue management without EMR coupling, enabling daily ticket generation, live queue filtering per zone, and staff room allocation.

## Decision

**Chosen option**: Option 1: Standalone Relational Schema with CUID Keys

Implement the relational schema in `prisma/schema.prisma` with 5 entities (`User`, `Zone`, `Room`, `Patient`, `Visit`) and 3 enums (`Role`, `RoomStatus`, `VisitStatus`).

**Implementation skills**: `prisma-cli` (`.agents/skills/prisma-cli/`) · `prisma-client-api` (`.agents/skills/prisma-client-api/`) · `prisma-database-setup` (`.agents/skills/prisma-database-setup/`) · `supabase-postgres-best-practices` (`.agents/skills/supabase-postgres-best-practices/`)

## Requirements

**User stories**:
- As a Receptionist, I want patient check-in records to save cleanly so patients immediately appear in the waiting queue with a daily ticket number.
- As a Doctor/Nurse, I want to see which room is assigned to which active visit so I can call and complete consultations.
- As an Admin, I want staff user accounts tied to specific roles (Receptionist, Doctor/Nurse, Admin) so system access is properly gated.

**Acceptance criteria**:
- **AC-1**: Prisma schema defines `User`, `Zone`, `Room`, `Patient`, and `Visit` entities with proper foreign keys, unique constraints, and enums (`Role`, `RoomStatus`, `VisitStatus`).
- **AC-2**: Database migration runs cleanly against Supabase Postgres (`DATABASE_URL` / `DIRECT_URL`).
- **AC-3**: `prisma generate` produces typed Prisma Client accessible via `@/lib/db`.
- **AC-4**: A seed script (`prisma/seed.ts`) populates initial default Zones (Block A, Block B), sample Rooms, and test staff accounts.
- **AC-5**: Database indexes exist on `Visit(zoneId, status, checkInTime)` and `Visit(status, isUrgent)` for fast polling queries.

## Feature design

**Data model sketch**:

```prisma
enum Role {
  RECEPTIONIST
  DOCTOR
  ADMIN
}

enum RoomStatus {
  FREE
  OCCUPIED
}

enum VisitStatus {
  WAITING
  IN_ROOM
  COMPLETED
  CANCELLED
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role
  zoneId       String?
  zone         Zone?    @relation(fields: [zoneId], references: [id])
  visits       Visit[]  @relation("CreatedVisits")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Zone {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique
  description String?
  rooms       Room[]
  users       User[]
  visits      Visit[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Room {
  id         String     @id @default(cuid())
  name       String
  roomNumber String
  zoneId     String
  zone       Zone       @relation(fields: [zoneId], references: [id])
  status     RoomStatus @default(FREE)
  visits     Visit[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  @@unique([zoneId, roomNumber])
}

model Patient {
  id        String   @id @default(cuid())
  fullName  String
  phone     String?
  visits    Visit[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Visit {
  id            String      @id @default(cuid())
  ticketNumber  String
  patientId     String
  patient       Patient     @relation(fields: [patientId], references: [id])
  zoneId        String
  zone          Zone        @relation(fields: [zoneId], references: [id])
  roomId        String?
  room          Room?       @relation(fields: [roomId], references: [id])
  reason        String
  isUrgent      Boolean     @default(false)
  status        VisitStatus @default(WAITING)
  checkInTime   DateTime    @default(now())
  calledTime    DateTime?
  completedTime DateTime?
  createdById   String
  createdBy     User        @relation("CreatedVisits", fields: [createdById], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([zoneId, status, checkInTime])
  @@index([status, isUrgent])
}
```

## Build plan

1. Update `prisma/schema.prisma` with core entities, enums, relations, and indexes, satisfies **AC-1**, **AC-5**
2. Create singleton Prisma Client instance helper at `src/lib/db.ts`, satisfies **AC-3**
3. Run `npx prisma migrate dev --name init_core_schema` to apply schema to Supabase Postgres, satisfies **AC-2**
4. Create seed script `prisma/seed.ts` with default zones, rooms, and test staff accounts, satisfies **AC-4**

## Consequences

**Positive**:
- Clean separation between Patients, Visits, Rooms, and Staff Users.
- Targeted indexes ensure polling queries for waiting patients execute in under 5ms.
- Scalable foundation for NextAuth and Server Actions.

**Negative / tradeoffs**:
- Ticket number generation requires atomic transaction or lock per zone to avoid duplicate ticket numbers during high-concurrency check-in.

## Follow-up

- [ ] Add seed execution script `prisma` field in `package.json` (`"prisma": { "seed": "npx tsx prisma/seed.ts" }`).

## Rationale

Reasoning and options: see [rationale.md](rationale.md)
