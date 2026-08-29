# Verify: Queue view (staff workstation) · spec 0006 · updated 2026-08-27
_Steps derived from spec 0006 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Open `/` workstation home while authenticated → verify `QueueTable` renders real waiting patients from PostgreSQL with patient name, ticket number, reason for visit, arrival time, wait time, and waiting status badge → AC-1, AC-2
- [ ] Verify priority sorting → confirm urgent priority patients (`isUrgent: true`) are pinned to the top of the queue table with a red badge and urgent row highlighting → AC-2
- [ ] Inspect wait duration formatting → verify wait time < 10 mins displays in slate, 10-14 mins in amber (#F97316), and 15+ mins in bold red (#DC2626) with an alert icon → AC-3
- [ ] Enter a search term (e.g. patient name or ticket number) into the table search input → verify displayed rows filter in real time → AC-4
- [ ] Observe section header over 5 seconds → verify "Live · Updated [time]" status chip updates automatically without page reloads → AC-5
- [ ] When no patients are in status `WAITING` → verify clean empty state notification ("No patients currently waiting in queue") renders → AC-6

## Commands
- [ ] `npx tsc --noEmit` → typecheck passes cleanly with 0 errors → AC-1, AC-2
- [ ] `npm run build` → Next.js production build compiles Server Actions and queue workstation pages cleanly → AC-1, AC-5

## Acceptance-criteria coverage
- AC-1: Covered by `getQueueDataAction` in `src/server/actions/getQueue.ts` and `QueueTable` mounting
- AC-2: Covered by Prisma ordering `{ isUrgent: "desc" }, { checkInTime: "asc" }` in `getQueueDataAction`
- AC-3: Covered by `calculateWaitMins` and color-coded threshold classes in `src/components/queue/QueueTable.tsx`
- AC-4: Covered by `filteredVisits` client search in `src/components/queue/QueueTable.tsx`
- AC-5: Covered by 5-second `setInterval` polling in `app/(workstation)/page.tsx` and live timestamp indicator
- AC-6: Covered by empty state banner in `src/components/queue/QueueTable.tsx`
