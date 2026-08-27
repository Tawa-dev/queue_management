# Verify: Patient check in and queue core · spec 0005 · updated 2026-08-27
_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Open `/` workstation home while authenticated → verify `CheckInStrip` component renders at top of main workstation grid taking Patient Full Name, Reason for Visit, and Urgent priority checkbox → AC-1
- [x] Fill Patient Name "Tendai Chikore", Reason "Severe Headache", check Urgent, and click "Check In" → verify Server Action executes, issues sequential ticket number (e.g. #1), and displays success alert banner → AC-1, AC-2, AC-3, AC-6
- [x] Enter the exact same patient name ("Tendai Chikore") again today → verify warning alert "Patient already has an active waiting ticket today" displays with a "Proceed Check-In" confirmation button → AC-4
- [x] Click "Proceed Check-In" → verify second ticket is issued (e.g. #2) → AC-4
- [x] Attempt to submit check-in form with empty patient name or empty reason → verify inline field error validation messages display without firing network request → AC-5

## Commands
- [x] `npx tsc --noEmit` → typecheck passes cleanly with 0 errors → AC-1, AC-2
- [x] `npm run build` → Next.js production build compiles Server Actions and page routes cleanly → AC-2, AC-3

## Acceptance-criteria coverage
- AC-1: Covered by `CheckInStrip` layout in `src/components/queue/CheckInStrip.tsx` and workstation mounting
- AC-2: Covered by `checkInPatientAction` daily sequence calculation in `src/server/actions/checkIn.ts`
- AC-3: Covered by `Visit` record creation with status `WAITING` and `createdById` session link
- AC-4: Covered by `checkInPatientAction` duplicate check and confirmation override
- AC-5: Covered by client-side field validation and inline error rendering
- AC-6: Covered by form state reset and success alert banner trigger
