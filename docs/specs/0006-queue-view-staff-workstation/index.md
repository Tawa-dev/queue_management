# 0006. Queue view (staff workstation)

**Date**: 2026-08-27
**Status**: In Progress

## Summary

This specification defines the waiting queue table and live data pipeline for Mabvuku Polyclinic staff workstation. The queue view prioritizes patient name, reason for visit, and elapsed wait time, automatically sorting urgent cases to the top. Server Action polling fetches live queue state every 5 seconds, updating summary metrics and queue rows while displaying a "Live · Updated [time]" status indicator.

## Requirements

**User stories**:
- As a triage nurse or doctor, I want to view all currently waiting patients in real time so that I know who is waiting and how long they have been waiting.
- As clinic staff, I want long wait times (15+ minutes) visually highlighted so that overdue patients are identified and attended to quickly.
- As a receptionist, I want search and filtering options so that I can find specific patients by name or ticket number instantly.

**Acceptance criteria**:
- **AC-1**: Server Action `getQueueDataAction` retrieves active `WAITING` visits for the user's clinic zone, including patient full name, ticket number, reason for visit, `isUrgent` priority flag, and `checkInTime`.
- **AC-2**: Waiting queue table lists patients with urgent priority cases (`isUrgent: true`) pinned to the top in check-in order, followed by normal priority visits ordered by oldest `checkInTime` first.
- **AC-3**: Elapsed wait time is calculated dynamically relative to current time: 0 to 9 minutes in slate text, 10 to 14 minutes in amber text (#F97316), and 15+ minutes in bold red text (#DC2626) with a warning icon.
- **AC-4**: A search input allows filtering the displayed queue in real time by patient full name or ticket number.
- **AC-5**: Live queue data polls every 5 seconds, updating the waiting queue table and summary metric cards without full page reloads, showing a "Live · Updated [time]" indicator in the section header.
- **AC-6**: Empty queue state renders a clean, friendly notification ("No patients currently waiting in queue") when no patients are in status `WAITING`.

## Decision

**Chosen option**: Option 1: Server Action polling pipeline with dynamic wait time formatting and priority pinned queue table

We will implement `getQueueDataAction` in `src/server/actions/getQueue.ts`, build the reactive queue table in `src/components/queue/QueueTable.tsx`, and connect client polling in `app/(workstation)/page.tsx`.

**Implementation skills**: `prisma-client-api` (`.agents/skills/prisma-client-api/`) · `prisma-database-setup` (`.agents/skills/prisma-database-setup/`)

## Feature design

**Data model sketch**:
Queries `Visit` records from PostgreSQL:
- Filter: `zoneId` matches active zone, `status` == `WAITING`
- Include: `patient` (`fullName`, `phone`)
- Order: `isUrgent` desc, `checkInTime` asc

**State transitions**:
- Initial Load -> `getQueueDataAction` -> Render Queue Table -> Start 5s Interval -> Re-fetch & Update Rows -> Render Live Timestamp

**API surface**:
| Endpoint / Action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `getQueueDataAction` | Server Action | `zoneId` (optional override) | `{ success: boolean, visits: QueueVisit[], summary: QueueSummary, lastUpdated: string, error?: string }` | Authenticated Staff | 401 Unauthorized, 500 Server Error |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Queue Table | Patient Name | `visit.patient.fullName` |
| Queue Table | Ticket Number | `#` + `visit.ticketNumber` |
| Queue Table | Wait Duration | `now` minus `visit.checkInTime` in minutes |
| Section Header | Live timestamp | Current time formatted as `HH:mm:ss` upon poll success |

**Key invariants**:
- Urgent visits are always displayed before non urgent visits regardless of arrival time.
- Wait time color coding transitions at 10 minutes (amber) and 15 minutes (red).
- Polling runs automatically without forcing manual browser refreshes.

**Security model**:
- Requires authenticated staff session.
- Scoped to user's assigned clinic zone.

**Configuration required**:
- None.

**Critical test scenarios**:
- Happy path queue fetch: Server Action returns waiting visits sorted by priority and arrival time, verifies **AC-1**, **AC-2**
- Wait time formatting: 5 min wait renders slate, 12 min wait renders amber, 18 min wait renders red with alert icon, verifies **AC-3**
- Client search filter: Typing "Moyo" filters queue table rows instantly, verifies **AC-4**
- Empty state: When zero patients are waiting, clean empty queue banner displays, verifies **AC-6**

## Build plan

1. [x] Create Server Action `getQueueDataAction` in `src/server/actions/getQueue.ts` querying WAITING visits and summary metrics, satisfies **AC-1**, **AC-2**
2. [x] Build reactive `QueueTable` component in `src/components/queue/QueueTable.tsx` supporting priority sorting, wait time color coding, search filtering, and empty state, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-6**
3. [x] Implement live 5 second polling hook in `app/(workstation)/page.tsx` displaying live status timestamp and updating table state, satisfies **AC-5**
4. [x] Mount real `QueueTable` in `app/(workstation)/page.tsx` replacing mock table data, satisfies **AC-1**, **AC-5**

## Consequences

**Positive**:
- Real time operational visibility for receptionists and medical staff.
- Automatic wait time threshold warnings highlight overdue patients.
- Fast, client side filtering eliminates server roundtrips during search.

**Negative / tradeoffs**:
- Polling every 5 seconds creates light recurring database read queries; indexed on `[zoneId, status, checkInTime]` for sub millisecond execution.

**Neutral**:
- Display updates automatically without manual page reloads.

## Follow-up

- [ ] Connect room assignment actions in Slice 1 Feature 8.

## Rationale

Reasoning and options: see [rationale.md](rationale.md)
