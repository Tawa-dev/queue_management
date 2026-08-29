# Scope: Mabvuku Polyclinic Queue Management System

A queue management workstation for Mabvuku Polyclinic (City of Harare, single outpatient clinic) that replaces paper-based queuing. Reception staff check patients in, a live display shows the waiting queue per zone, and staff assign patients to consultation rooms. Three roles: Receptionist, Doctor/Nurse, Admin.

**Build approach:** Tracer Bullet (prove every layer connects end to end before building any part of it fully).
**Workflow:** Beta (after /develop, run /check verify then /test. No fresh-model review by default).

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack and architecture | Foundation | in-progress |
| 2 | Coding standards and tooling | Foundation | in-progress |
| 3 | Core data model | Foundation | done |
| 4 | Design system and UI foundation | Foundation | in-progress |
| 5 | Auth and roles | Foundation | in-progress |
| 6 | Patient check-in and queue core | Slice 1 | in-progress |
| 7 | Queue view (staff workstation) | Slice 1 | in-progress |
| 8 | Room assignment and status | Slice 1 | in-progress |
| 9 | On-screen display board | Slice 2 | planned |
| 10 | PWA offline cache | Slice 3 | planned |
| 11 | Admin dashboard and reporting | Deferred | planned |
| 12 | Patients list and history | Deferred | planned |
| 13 | Settings | Deferred | planned |

## Foundations

### 1. Stack and architecture · in-progress
spec [0001](../specs/0001-stack-architecture/index.md)

Next.js 16 App Router, TypeScript, Tailwind CSS 4, Prisma 6 with Supabase Postgres, NextAuth v5 (self-hosted), and Serwist for PWA. The scaffold exists (`app/page.tsx` is the default placeholder). No real routes, auth, or database models are in place yet.

**Done when:** the scaffold runs, the database connection is confirmed via `DATABASE_URL`, Prisma client generates without errors, a `next build` and `next dev` pass, and the stack choices are recorded in a spec so later features can build on a known foundation.

- [x] Decide and record the stack (spec): `/architect stack and architecture`

### 2. Coding standards and tooling · in-progress

ESLint is configured and Tailwind is installed. No audit has run yet to capture project conventions, path aliases, or import discipline.

**Done when:** root `AGENTS.md` reflects the real stack and conventions, ESLint runs clean on `npm run lint`, and TypeScript strict mode passes.

- [ ] Capture conventions: `/audit`
- [ ] Install and verify tooling: `/develop coding standards and tooling`

### 3. Core data model · done
spec [0002](../specs/0002-core-data-model/index.md) · code in `src/lib/db.ts`, `prisma/schema.prisma`

Patient, Visit, Room, Zone, and User entities as specified in `AGENTS.md`. Prisma schema currently has no models; the database is empty.

**Done when:** the Prisma schema defines all core entities with relationships, a migration runs clean against the Supabase Postgres instance, and `prisma generate` produces the typed client.

- [x] Design it (spec): `/architect core data model`
- [x] Build it: `/develop core data model`
  - [x] Update `prisma/schema.prisma` with core entities, enums, and indexes (satisfies AC-1, AC-5)
  - [x] Create Prisma Client singleton helper at `src/lib/db.ts` (satisfies AC-3)
  - [ ] Execute `prisma migrate dev` against Supabase Postgres (satisfies AC-2)
  - [x] Create `prisma/seed.ts` with initial zones, rooms, and test staff accounts (satisfies AC-4)
- [x] Verify it: `/check verify core data model`
- [x] Test it: `/test core data model`

### 4. Design system and UI foundation · in-progress
spec [0003](../specs/0003-design-system-ui-foundation/index.md) · code in `src/components/ui`, `src/components/layout`, `app/globals.css`

Tailwind is installed but no design system is defined. The UI reference screenshot (in `design/`) shows the queue workstation layout: left sidebar navigation, header bar, table style, and button conventions. All pages must draw from the same design tokens and components.

**Done when:** color palette, typography, spacing rhythm, sidebar, header, table, and button component patterns are captured in a spec (`design.md`), and a base layout component renders the sidebar and header without errors.

- [x] Design it (spec): `/architect design system and UI foundation`
- [x] Build it: `/develop design system and UI foundation`
  - [x] Configure Tailwind CSS 4 design tokens, Inter font, and install `lucide-react` (satisfies AC-1)
  - [x] Build typed atomic UI primitives in `src/components/ui/` (Button, Input, Select, Badge, AlertBanner, MetricCard) (satisfies AC-2, AC-6)
  - [x] Build Workstation Shell layout components (Sidebar, HeaderBar, WorkstationLayout) (satisfies AC-3, AC-6)
  - [x] Build Patient Display Board layout shell in `src/components/layout/DisplayLayout.tsx` (satisfies AC-4, AC-6)
  - [x] Setup Next.js Route Groups `(workstation)` and `(display)` with a component showcase page (satisfies AC-5, AC-2)
- [x] Verify it: `/check verify design system and UI foundation`
- [ ] Test it: `/test design system and UI foundation`

### 5. Auth and roles · in-progress
spec [0004](../specs/0004-auth-and-roles/index.md) · code in `src/lib/auth.ts`, `src/middleware.ts`, `app/(auth)/login/page.tsx`

NextAuth v5 is installed but has no config. Three roles: Receptionist, Doctor/Nurse, Admin. Role gates control which pages and actions each user can reach (no receptionist on the Admin pages, no doctor on check-in management actions).

**Done when:** sign-in page works, sessions persist, role is readable in middleware and server components, and an unauthenticated request redirects to sign-in.

- [x] Design it (spec): `/architect auth and roles`
- [x] Build it: `/develop auth and roles`
  - [x] Install bcryptjs and configure NextAuth v5 credentials auth in `src/lib/auth.ts` (satisfies AC-1, AC-2)
  - [x] Create Next.js Middleware in `middleware.ts` for RBAC route protection (satisfies AC-4, AC-5)
  - [x] Create NextAuth route handler at `app/api/auth/[...nextauth]/route.ts` (satisfies AC-1)
  - [x] Build branded clinic sign in page at `app/(auth)/login/page.tsx` (satisfies AC-3)
  - [x] Connect SessionProvider and update HeaderBar with live user session and logout action (satisfies AC-6)
  - [x] Update `prisma/seed.ts` with hashed test staff accounts (satisfies AC-1)
- [x] Verify it: `/check verify auth and roles`
- [ ] Test it: `/test auth and roles`

## Slice 1: Thin operational thread

The tracer bullet: one real path that touches every layer. A receptionist signs in, checks in a patient, that patient appears in the staff queue view, and a staff member assigns them to a room. Everything is real: real auth, real DB write, real UI. No display board yet, no voice announcements, no reporting.

### 6. Patient check-in and queue core · in-progress
spec [0005](../specs/0005-patient-check-in-and-queue-core/index.md) · code in `src/server/actions/checkIn.ts`, `src/components/queue/CheckInStrip.tsx`

Check-in form strip at the top of the Queue page. Staff enters patient name, reason for visit, and optional urgent flag. Submitting creates a Patient (if new) and a Visit row (status: `WAITING`) with a sequential ticket number.

**Done when:** submitting the check-in strip creates a Visit row in DB with status `WAITING` and auto-generated ticket number, and clears the form.

- [x] Design it (spec): `/architect patient check-in and queue core`
- [x] Build it: `/develop patient check-in and queue core`
  - [x] Create Server Action `checkInPatientAction` in `src/server/actions/checkIn.ts` (satisfies AC-2, AC-3, AC-4)
  - [x] Build `CheckInStrip` component in `src/components/queue/CheckInStrip.tsx` (satisfies AC-1, AC-5)
  - [x] Wire client form state, validation, duplicate check warnings, and reset logic (satisfies AC-4, AC-5, AC-6)
  - [x] Mount `CheckInStrip` at the top of `app/(workstation)/page.tsx` (satisfies AC-1, AC-6)
- [x] Verify it: `/check verify patient check-in and queue core`
- [x] Test it: `/test patient check-in and queue core`

### 7. Queue view (staff workstation) · in-progress
spec [0006](../specs/0006-queue-view-staff-workstation/index.md) · code in `src/server/actions/getQueue.ts`, `src/components/queue/QueueTable.tsx`

Main staff view. Shows patients waiting by zone, priority flag, check-in time, and elapsed wait time. Includes search/filter inputs and live polling updates.

**Done when:** the staff queue table renders real waiting visits from DB, updates live every 5s, flags urgent cases at the top, and displays wait time warning thresholds.

- [x] Design it (spec): `/architect queue view (staff workstation)`
- [x] Build it: `/develop queue view (staff workstation)`
  - [x] Create Server Action `getQueueDataAction` in `src/server/actions/getQueue.ts` (satisfies AC-1, AC-2)
  - [x] Build `QueueTable` component in `src/components/queue/QueueTable.tsx` with priority sorting, wait time thresholds, search filtering, and empty states (satisfies AC-2, AC-3, AC-4, AC-6)
  - [x] Implement live 5s polling hook and Live status indicator in `app/(workstation)/page.tsx` (satisfies AC-5)
  - [x] Mount `QueueTable` in `app/(workstation)/page.tsx` replacing mock table data (satisfies AC-1, AC-5)
- [ ] Verify it: `/check verify queue view (staff workstation)`
- [ ] Test it: `/test queue view (staff workstation)`

### 8. Room assignment and status · in-progress
spec [0007](../specs/0007-room-assignment-and-status/index.md) · code in `src/server/actions/assignRoom.ts`, `src/server/actions/completeVisit.ts`, `src/server/actions/getRooms.ts`, `src/components/queue/RoomAssignPanel.tsx`, `app/(workstation)/rooms/page.tsx`

Staff explicitly press an "Assign" button per room to call the next patient to that room. The room status flips to `OCCUPIED` and the visit status moves to `IN_ROOM`. Staff can mark a consultation complete to free the room back to `FREE`. Room list lives on its own Rooms page at `/rooms`. The quick-assign panel on the workstation home page is wired to the same real actions. No schema changes required.

**Done when:** an available room shows an Assign button; pressing it assigns the first-in-queue patient to that room and updates both the room and visit status in real time (next poll); the room flips back to free when the visit is marked complete; a Rooms page shows all rooms and their current status.

- [x] Design it (spec): `/architect room assignment and status`
- [ ] Build it: `/develop room assignment and status`
  - [x] Create `getRoomsAction` in `src/server/actions/getRooms.ts` returning `RoomItem[]` with active visit data for occupied rooms (satisfies AC-4)
  - [x] Create `assignRoomAction` in `src/server/actions/assignRoom.ts` — authenticated, role-gated (DOCTOR, ADMIN), transactional assign of queue head to room (satisfies AC-1, AC-3, AC-7)
  - [x] Create `completeVisitAction` in `src/server/actions/completeVisit.ts` — authenticated, role-gated, transactional visit completion and room release (satisfies AC-2, AC-3, AC-7)
  - [x] Build `RoomAssignPanel` component in `src/components/queue/RoomAssignPanel.tsx` replacing mock rooms panel with live data and Assign/Complete callbacks (satisfies AC-6)
  - [x] Wire `RoomAssignPanel` into `app/(workstation)/page.tsx` replacing mock constants with real `getRoomsAction` data and action callbacks (satisfies AC-6, AC-7)
  - [x] Create Rooms page at `app/(workstation)/rooms/page.tsx` with 10-second poll, full room grid, Assign/Complete actions, and empty state (satisfies AC-5)
- [x] Verify it: `/check verify room assignment and status`
- [ ] Test it: `/test room assignment and status`

## Slice 2: On-screen display board

### 9. On-screen display board · needs a decision

A separate, TV-sized, read-only page for each clinic zone (two zones in the demo: Block A General and Block B Maternal and Child Health). Shows who is now serving in each room within that zone and the next few patients waiting. Polling keeps it live. Voice announcement via the browser Web Speech API (`SpeechSynthesis`) reads the queue number and assigned room aloud when a patient status changes to `now serving`. Works on a standard browser with no internet connection once the page is loaded (cached queue state for the display view).

> **UI reference**: `design/waiting area.png` — the display board must match this screenshot exactly. Read it before writing any spec or code for this feature.

**Done when:** navigating to `/display/[zone]` renders the correct zone's "now serving" and waiting list; a status change triggers a voice utterance; the page updates on each poll without a manual refresh; and the display still renders with the cached state when the network drops mid-session.

- [ ] Design it (spec): `/architect on-screen display board`

## Slice 3: PWA offline cache

### 10. PWA offline cache · needs a decision

Serwist (`@serwist/next`) is installed. Configure service worker caching so the app installs as a PWA and the queue display view (Slice 2) continues rendering from cached state when the device loses connectivity. Staff-facing operational pages degrade gracefully; write operations (check-in, assignment) queue or fail clearly rather than silently.

**Done when:** the app passes Lighthouse PWA checks, installs on a Chrome desktop, the `/display/[zone]` route renders from cache when the network is disabled, and a failed write shows a clear error rather than a silent failure.

- [ ] Design it (spec): `/architect PWA offline cache`

## Deferred

Out of scope for Pass 1. Kept here so the plan stays honest.

- **Admin dashboard and reporting**: average wait time, patients seen today, per-hour volume. needs a decision
- **Patients list and history**: browse all patients, view past visits. needs a decision
- **Settings**: room management (add/edit rooms and zones), user management, clinic config. needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack and architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | **`/architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /develop <feature>` + **2 to 5 milestones**; the tier closing boxes (`Verify it` Alpha+, `Test it` Beta+); any surfaced follow-up enrolled |
| `in-progress` (building) | `/develop` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | **you, when you decide it is** (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; Beta: after `/test` is the suggested point to call it done |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards and tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` to `in-progress` to `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Workflow** (header line) is the project default: **Beta** = `/check verify` then `/test`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
