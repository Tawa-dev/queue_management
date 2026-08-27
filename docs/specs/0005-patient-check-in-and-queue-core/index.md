# 0005. Patient check in and queue core

**Date**: 2026-08-27
**Status**: In Progress

## Summary

This specification defines the patient check in mechanism and core queue state management for Mabvuku Polyclinic. Reception staff enter patient name, reason for visit, and an optional urgent priority flag directly from the compact check in strip at the top of the workstation. Next.js Server Actions process check ins, auto generate zone scoped daily ticket numbers, create or link patient records, and insert visit entries into PostgreSQL with status waiting.

## Requirements

**User stories**:
- As a clinic receptionist, I want to check in arriving patients quickly using a compact always visible form strip so that patients are queued immediately without changing pages.
- As a triage nurse or doctor, I want urgent priority cases visually flagged at the top of the waiting queue so that emergency patients receive immediate care.
- As a waiting patient, I want a legible daily ticket number issued at check in so that I can track my position on the waiting room display.

**Acceptance criteria**:
- **AC-1**: Patient check in form is integrated into the workstation header strip, taking `fullName`, `reason`, and `isUrgent` priority flag.
- **AC-2**: Server Action `checkInPatientAction` validates inputs, looks up or creates the `Patient` record by full name, and generates a zone scoped daily ticket number (e.g. #1, #2, #23) resetting each morning per zone.
- **AC-3**: Check in creates a `Visit` record in PostgreSQL with status `WAITING`, assigned to the receptionist's `zoneId` and authenticated user ID as `createdById`.
- **AC-4**: Active check ins detect existing `WAITING` visits for the exact same patient name in the same zone today, displaying an inline warning banner while permitting check in if confirmed.
- **AC-5**: Form validation enforces required fields (`fullName` non empty, `reason` non empty), rendering clear inline field error messages on failure.
- **AC-6**: Successful check in clears form fields, triggers a subtle success alert banner, and triggers queue data revalidation so the new patient appears immediately in the waiting table.

## Decision

**Chosen option**: Option 1: Next.js Server Action check in pipeline with daily zone scoped sequential ticket numbers and Prisma ORM persistence

We will implement the check in form component in `src/components/queue/CheckInStrip.tsx`, write the backend Server Action in `src/server/actions/checkIn.ts`, generate daily ticket sequences, and persist `Patient` and `Visit` records via Prisma.

**Implementation skills**: `prisma-client-api` (`.agents/skills/prisma-client-api/`) · `prisma-database-setup` (`.agents/skills/prisma-database-setup/`)

## Feature design

**Data model sketch**:
- `Patient`: `id` (cuid), `fullName` (string), `phone` (optional string), `createdAt`, `updatedAt`
- `Visit`: `id` (cuid), `ticketNumber` (string, e.g. "23"), `patientId` (FK), `zoneId` (FK), `reason` (string), `isUrgent` (boolean), `status` (`WAITING`), `checkInTime` (DateTime), `createdById` (FK User)

**State transitions**:
- Patient Arrives -> Form Submitted -> `checkInPatientAction` -> `Patient` Upserted -> `Visit` Created (Status `WAITING`, `checkInTime` = now) -> Form Reset & Queue Refreshed

**API surface**:
| Endpoint / Action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `checkInPatientAction` | Server Action | `fullName`, `reason`, `isUrgent`, `zoneId` | `{ success: boolean, visitId?: string, ticketNumber?: string, warning?: string, error?: string }` | Authenticated Staff | 400 Bad Request, 401 Unauthorized, 500 Server Error |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Check In Submission | Ticket number | Computed count of today's visits for zone + 1 |
| Check In Submission | `createdById` | NextAuth session user ID (`session.user.id`) |
| Check In Submission | `zoneId` | NextAuth session user zone ID or active zone selector |
| Duplicate Check | Existing visit warning | Query `Visit` where `patient.fullName` matches, `zoneId` matches, `status` is `WAITING`, `checkInTime` is today |

**Key invariants**:
- Daily ticket numbers are zone scoped and start at #1 every midnight.
- A visit is always created with status `WAITING` and `isUrgent` boolean.
- Walk-in is the default mode (no redundant type tags).

**Security model**:
- Requires authenticated staff session (Receptionist, Doctor, Nurse, or Admin).
- Form submission validates and sanitizes strings on the server.

**Configuration required**:
- None. Uses existing database connection and NextAuth session.

**Critical test scenarios**:
- Happy path check in: Receptionist enters patient name and reason, presses Check In, receives ticket #1, verifies **AC-1**, **AC-2**, **AC-3**
- Urgent priority check in: Checking in with urgent checkbox sets `isUrgent` true and assigns high priority formatting, verifies **AC-1**, **AC-3**
- Duplicate warning: Checking in the same name twice in one day triggers warning alert, verifies **AC-4**
- Validation failure: Submitting empty name or reason triggers inline field error, verifies **AC-5**

## Build plan

1. [x] Create Server Action `checkInPatientAction` in `src/server/actions/checkIn.ts` handling ticket generation, patient lookup, visit creation, and duplicate detection, satisfies **AC-2**, **AC-3**, **AC-4**
2. [x] Build `CheckInStrip` component in `src/components/queue/CheckInStrip.tsx` using design system primitives (`Input`, `Button`, `AlertBanner`), satisfies **AC-1**, **AC-5**
3. [x] Wire client side form state, Server Action invocation, error handling, and form reset on success, satisfies **AC-5**, **AC-6**
4. [x] Mount `CheckInStrip` at the top of `app/(workstation)/page.tsx` above the queue table, satisfies **AC-1**, **AC-6**

## Consequences

**Positive**:
- Extremely fast check in workflow: receptionists check in patients without leaving the main workstation view.
- Zone scoped daily ticket numbers provide simple legibility for waiting room patients.
- Server Actions enforce atomic database writes and server side validation.

**Negative / tradeoffs**:
- Concurrent check ins in the exact same millisecond could result in duplicate ticket numbers if not wrapped in a transaction; Prisma transaction handles race conditions.

**Neutral**:
- Patient phone number remains optional at check in to keep intake friction minimal.

## Follow-up

- [ ] Connect live queue table revalidation when Slice 1 Queue View feature is implemented.

## Rationale

Reasoning and options: see [rationale.md](rationale.md)
