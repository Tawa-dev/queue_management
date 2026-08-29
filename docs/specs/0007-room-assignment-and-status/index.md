# 0007. Room assignment and status

**Date**: 2026-08-29
**Status**: Accepted

## Summary

This specification defines room assignment, room status management, and the dedicated Rooms page for Mabvuku Polyclinic. Staff explicitly press an **Assign** button on an available room to call the next waiting patient to that room. The visit status moves from `WAITING` to `IN_ROOM`, the room flips from `FREE` to `OCCUPIED`, and both changes are reflected in the next queue poll. Staff can mark a consultation complete, which sets the visit to `COMPLETED` and releases the room back to `FREE`. A dedicated `/rooms` page provides a full room-status overview. The quick-assign panel on the workstation home page is wired to the same actions, replacing the current mock data.

## Requirements

**User stories**:
- As a doctor or nurse, I want to press Assign on an available room to call the next waiting patient to that room, so I do not have to use a separate tool or shout across the waiting area.
- As a doctor or nurse, I want to mark a consultation complete so the room immediately becomes available for the next patient.
- As a doctor or nurse, I want to view all rooms with their current status and occupant at a glance so that I know which rooms are free before I assign.
- As a receptionist, I want to see the quick-assign panel on the main queue page update in real time alongside the queue table so that the entire workstation reflects live state.

**Acceptance criteria**:
- **AC-1**: `assignRoomAction` atomically sets `Visit.status = IN_ROOM`, `Visit.roomId`, `Visit.calledTime = now()`, and `Room.status = OCCUPIED` in a single Prisma transaction. It picks the first-in-queue patient (highest urgency, then oldest `checkInTime`) with status `WAITING` in the same zone as the room.
- **AC-2**: `completeVisitAction` atomically sets `Visit.status = COMPLETED`, `Visit.completedTime = now()`, and `Room.status = FREE` in a single Prisma transaction. It accepts a `visitId` and validates the visit is currently `IN_ROOM` before committing.
- **AC-3**: Both server actions are authenticated (any signed-in staff) and zone-scoped; a `RECEPTIONIST` role may not call `assignRoomAction` or `completeVisitAction` — the action returns `{ success: false, error: "Insufficient permissions" }` without touching the database.
- **AC-4**: `getRoomsAction` returns all rooms for the active zone including their current status (`FREE` / `OCCUPIED`) and, for `OCCUPIED` rooms, the active visit's ticket number, patient name, reason, and elapsed in-room time (`calledTime` to now).
- **AC-5**: The Rooms page at `/rooms` renders a full room grid using real data from `getRoomsAction`, polling every 10 seconds. Each card shows room name, status badge, and for occupied rooms the patient name, ticket number, and elapsed time. Available rooms show an Assign button; occupied rooms show a Complete button.
- **AC-6**: The quick-assign sidebar panel on the workstation home page (`app/(workstation)/page.tsx`) is replaced with a live `RoomAssignPanel` component wired to real room data, sharing the same 5-second poll cycle already in place on that page. Recent Assignments show real assignment history from today's `IN_ROOM` and `COMPLETED` visits ordered by `calledTime` desc (last 5 entries).
- **AC-7**: After a successful assign or complete action, `revalidatePath` is called for `/` and `/rooms`, and the client component triggers an immediate re-fetch so the UI reflects the change without waiting for the next poll interval.

## Decision

**Chosen option**: Option 1 — Two atomic Server Actions (`assignRoomAction`, `completeVisitAction`) plus a read action (`getRoomsAction`), consumed by a new `RoomAssignPanel` component on the workstation home page and a full Rooms page.

We considered embedding assignment logic inside `getQueueDataAction` but that conflates read and write concerns and makes the action non-idempotent. Separate, clearly-named actions are easier to test and reason about.

We considered a dedicated API route instead of Server Actions. Server Actions keep the pattern consistent with Feature 6 (`checkInPatientAction`) and Feature 7 (`getQueueDataAction`), avoiding an extra layer.

**Implementation skills**: `prisma-client-api` · role-checked Server Actions · Tailwind CSS 4 design tokens

## Feature design

**Data model sketch** (no schema changes required):

```
Room        Visit
─────       ───────────────────────────────────────────
id          id
name        roomId  ──────────────────────── FK → Room
roomNumber  status  WAITING | IN_ROOM | COMPLETED | CANCELLED
zoneId      calledTime   (set on assign)
status      completedTime (set on complete)
FREE|OCCUPIED
```

The schema already has `Room.status (FREE/OCCUPIED)`, `Visit.roomId`, `Visit.calledTime`, and `Visit.completedTime`. No migration is needed.

**State machine — Visit × Room**:

```
                    assignRoomAction
WAITING  ──────────────────────────────────►  IN_ROOM
Room: FREE                                    Room: OCCUPIED

                    completeVisitAction
IN_ROOM  ──────────────────────────────────►  COMPLETED
Room: OCCUPIED                                Room: FREE
```

Edge cases handled at the action level:
- Room is already `OCCUPIED` → `assignRoomAction` returns `{ success: false, error: "Room is already occupied" }`.
- No `WAITING` patients in zone → returns `{ success: false, error: "No patients currently waiting" }`.
- Visit is not `IN_ROOM` when completing → returns `{ success: false, error: "Visit is not currently in room" }`.
- Room belongs to a different zone → action validates zone match before executing.

**API surface**:

| Action | Key inputs | Key outputs | Auth | Role gate |
|---|---|---|---|---|
| `assignRoomAction(roomId)` | `roomId: string` | `{ success, visitId?, ticketNumber?, patientName?, roomName?, error? }` | Authenticated | DOCTOR, ADMIN |
| `completeVisitAction(visitId)` | `visitId: string` | `{ success, visitId?, roomName?, error? }` | Authenticated | DOCTOR, ADMIN |
| `getRoomsAction(zoneId?)` | `zoneId?: string` | `{ success, rooms: RoomItem[], error? }` | Authenticated | Any |

**`RoomItem` shape** (returned by `getRoomsAction`):
```ts
interface RoomItem {
  id: string;
  name: string;
  roomNumber: string;
  status: "FREE" | "OCCUPIED";
  // Present only when OCCUPIED
  activeVisit?: {
    id: string;
    ticketNumber: string;
    patientName: string;
    reason: string;
    calledTime: string; // ISO string
  };
}
```

**Recent assignment entry shape** (derived from `getRoomsAction` extended response or a small separate query):
```ts
interface RecentAssignment {
  calledTime: string;   // ISO string
  ticketNumber: string;
  patientName: string;
  roomName: string;
}
```

**Key invariants**:
- Assignment always picks the **first** `WAITING` patient in the zone by urgency then arrival time — staff do not choose which patient to assign from the sidebar panel. The Rooms page uses the same rule.
- Both actions execute inside a Prisma `$transaction` — a partial failure (e.g., room update succeeds but visit update fails) is impossible.
- Role check happens before any DB read, not after.
- Zone scoping is derived from the room's own `zoneId` field, not the session user's `zoneId`, so an admin covering multiple zones can still assign.

**Security model**:
- All three actions require an authenticated session (`auth()` check; return error if no session).
- `assignRoomAction` and `completeVisitAction` reject `RECEPTIONIST` role with a permission error.
- `getRoomsAction` is readable by all authenticated roles.
- Room IDs and Visit IDs are validated as belonging to the resolved zone before any mutation.

**Configuration required**:
- None. Schema already supports all required fields.

**Critical test scenarios**:
- Happy path assign: `assignRoomAction` with a free room and a waiting patient → Visit becomes `IN_ROOM`, Room becomes `OCCUPIED`, returned ticket number and patient name match queue head. Verifies **AC-1**.
- Happy path complete: `completeVisitAction` with an in-room visit → Visit becomes `COMPLETED`, Room becomes `FREE`. Verifies **AC-2**.
- Receptionist blocked: calling `assignRoomAction` with a `RECEPTIONIST` session → returns permission error, no DB change. Verifies **AC-3**.
- Occupied room guard: `assignRoomAction` on an `OCCUPIED` room → returns error, queue unchanged. Verifies **AC-1** edge case.
- Empty queue guard: `assignRoomAction` when no `WAITING` visits exist → returns "no patients waiting" error. Verifies **AC-1** edge case.
- Rooms page renders real data: `getRoomsAction` returns FREE and OCCUPIED rooms; occupied room shows elapsed time. Verifies **AC-4**, **AC-5**.
- UI re-fetches after action: after `assignRoomAction` succeeds, `onAssignSuccess` triggers immediate re-fetch on the workstation page. Verifies **AC-7**.

## Build plan

1. [ ] Create `getRoomsAction` in `src/server/actions/getRooms.ts` — queries all rooms for the active zone including active `IN_ROOM` visit via Prisma `include`; returns `RoomItem[]`. Satisfies **AC-4**.
2. [ ] Create `assignRoomAction` in `src/server/actions/assignRoom.ts` — authenticated, role-gated (`DOCTOR`, `ADMIN`), transactional: finds queue head, sets `Visit.status = IN_ROOM` + `calledTime`, sets `Room.status = OCCUPIED`, calls `revalidatePath`. Satisfies **AC-1**, **AC-3**, **AC-7**.
3. [ ] Create `completeVisitAction` in `src/server/actions/completeVisit.ts` — authenticated, role-gated, transactional: validates visit is `IN_ROOM`, sets `Visit.status = COMPLETED` + `completedTime`, sets `Room.status = FREE`, calls `revalidatePath`. Satisfies **AC-2**, **AC-3**, **AC-7**.
4. [ ] Build `RoomAssignPanel` component in `src/components/queue/RoomAssignPanel.tsx` — replaces the mock rooms panel in `app/(workstation)/page.tsx`; accepts `rooms: RoomItem[]`, `nextPatient`, callbacks `onAssign(roomId)` and `onComplete(visitId)`; renders available/occupied room cards with Assign/Complete buttons and recent assignments list. Satisfies **AC-6**.
5. [ ] Wire `RoomAssignPanel` into `app/(workstation)/page.tsx` — replace mock `ROOMS` / `MOCK_RECENT_ASSIGNMENTS` constants with `getRoomsAction` call in the existing `fetchQueueData` callback; pass live room data and action callbacks to `RoomAssignPanel`; trigger immediate re-fetch on success. Satisfies **AC-6**, **AC-7**.
6. [ ] Create Rooms page at `app/(workstation)/rooms/page.tsx` — server-component shell with client `RoomsPageClient` child; 10-second poll; full room grid with Assign and Complete actions; empty state when no rooms configured. Satisfies **AC-5**.

## Consequences

**Positive**:
- Closes the tracer bullet: every layer (auth → server action → DB transaction → live UI) is real for the full patient journey (check-in → assign → complete).
- No schema changes needed — all required fields are already present.
- Consistent Server Action pattern with Features 6 and 7.

**Negative / tradeoffs**:
- Assignment always picks the queue head — there is no way for staff to manually choose a different patient from the sidebar panel. This matches the clinical requirement (first-come first-served with urgency override) but means any deviation requires going to the full queue table.
- Polling the rooms endpoint separately from the queue adds a small extra DB read on the Rooms page, mitigated by the index on `[zoneId, status, checkInTime]`.

**Neutral**:
- `RoomAssignPanel` shares the same 5-second poll cycle already running on the workstation home page, so no new interval is introduced on that page.

## Rationale

**Why two separate actions instead of one `updateVisitStatusAction`?**
A generic status-update action would require the caller to pass both the target status and any associated side effects (which field to timestamp, whether to update the room). Keeping assign and complete as named, purpose-built actions makes the intent explicit, prevents callers from passing arbitrary status transitions, and makes each action independently testable.

**Why pick the queue head automatically rather than letting staff choose?**
The scope document and clinic workflow both describe assignment as "call the next patient to a room". Manual patient selection introduces ambiguity and requires the staff member to reason about the queue order themselves. The urgency-then-arrival sort is already established in Feature 7 and is the single source of truth.

**Why no new navigation structure for the Rooms page beyond the existing `/rooms` Sidebar link?**
The Sidebar already includes a Rooms nav item pointing to `/rooms`, and middleware already restricts it to non-`RECEPTIONIST` roles. Adding a nested route hierarchy would be over-engineering for a single-zone, single-purpose page at this scale.
