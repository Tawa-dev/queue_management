# Spec 0010 — Reports Dashboard

## Status
Ready for implementation

## Context

The reports page (`app/(workstation)/reports/page.tsx`) and its server action
(`src/server/actions/getReports.ts`) were built earlier in the project. The
core functionality is complete: 4 metric cards, a per-hour SVG bar chart,
30-second polling, and loading skeletons.

This spec closes the remaining gaps:

1. **No SSR initial data** — the page is fully `"use client"`, so every visit
   starts with skeletons. Apply the same server-component wrapper pattern used
   by the queue and rooms pages.
2. **Missing DNA/Cancelled count** — `CANCELLED` visits are tracked in the
   schema and shown on the queue metrics bar, but not surfaced in reports.
3. **Two hydration issues** — `new Date()` rendered server-side in the page
   header, and `Math.random()` used for skeleton heights in `ChartSkeleton`.
4. **No zone scoping** — `getReports` queries all visits without a `zoneId`
   filter. For a single-clinic system this is harmless today, but it is
   inconsistent with every other action in the codebase. Scope it.

AGENTS.md scope for reports: *"average wait time, patients seen today,
per-hour volume"* — all three are already implemented. This spec adds the DNA
count and hardens the existing implementation.

---

## What stays unchanged

- The SVG bar chart (`HourlyVolumeChart`) — correct and working.
- The 4 existing metric cards — correct and working.
- The 30-second poll interval — appropriate for reports.
- The "Live · [time]" indicator.
- The admin-only middleware gate — already enforced.

---

## Files to Create / Modify

### 1. `src/server/actions/getReports.ts` — add DNA count + zone scoping

Add `dnaToday` (cancelled visits today) to the return shape.
Add `zoneId` parameter scoping consistent with the other actions.

```ts
export interface ReportData {
  success: boolean;
  seenToday: number;
  waitingNow: number;
  inConsultationNow: number;
  dnaToday: number;          // NEW — did not attend / cancelled
  avgWaitMinutes: number | null;
  hourlyVolume: HourlyBucket[];
  error?: string;
}
```

Query changes:
- Add `zoneId` parameter (optional, falls back to Zone A via JWT — same
  pattern as `getWorkstationData`).
- Merge the active-status `groupBy` to also count `COMPLETED` and `CANCELLED`
  today in a single pass, eliminating the separate `completedVisits` fetch for
  count purposes. Keep the `findMany` for avg-wait calculation only.
- Replace the two separate queries (active counts + completed visits) with a
  single `groupBy` scoped to today, then a targeted `findMany` for avg-wait
  fields only.

### 2. `src/components/reports/ReportsClient.tsx` — extract client component

Pull all the interactive logic out of `app/(workstation)/reports/page.tsx`
into a new client component. Receives `initialData: ReportData` as a prop.
Applies the same pattern as `WorkstationClient` and `RoomsClient`.

Key changes from the current page:
- Add a 5th metric card for **Did Not Attend** (DNA/Cancelled count).
- Fix `ChartSkeleton` — replace `Math.random()` heights with fixed deterministic
  heights (e.g. alternating pattern) to avoid hydration mismatch.
- Fix the date header — move `new Date().toLocaleDateString(...)` into a
  `useEffect` so it only runs client-side.
- Accept `initialData` prop and seed `useState` with it (no skeleton on first
  render).

### 3. `app/(workstation)/reports/page.tsx` — convert to server component

Thin server component that fetches initial data and passes it to
`ReportsClient`. Same pattern as queue and rooms pages.

```tsx
import { getReportsDataAction } from "@/server/actions/getReports";
import { ReportsClient } from "@/components/reports/ReportsClient";

export default async function ReportsPage() {
  const initialData = await getReportsDataAction();
  return <ReportsClient initialData={initialData} />;
}
```

---

## Data Model — fields used

| Field | Source | Used for |
|-------|--------|----------|
| `Visit.status` | groupBy | All metric counts |
| `Visit.checkInTime` | findMany (completed today) | Avg wait numerator, hourly bucket |
| `Visit.calledTime` | findMany (completed today) | Avg wait numerator |
| `Visit.completedTime` | groupBy filter | Scoping to today |
| `Visit.zoneId` | where clause | Zone scoping |

No new DB fields needed. No schema changes.

---

## DNA metric card spec

| Property | Value |
|----------|-------|
| Label | "Did Not Attend" |
| Value | `dnaToday` count |
| Icon | `XCircle` (already imported in `WorkstationClient`) |
| Icon bg | `bg-neutral-slate-100` |
| Icon color | `text-neutral-slate-500` |
| Value color | `text-neutral-slate-700` |
| Subtext | "cancelled today" |

---

## Acceptance Criteria

- [ ] Navigating to `/reports` renders metric cards immediately with no skeleton
      flash (server-side initial data).
- [ ] All 5 metric cards render: Seen Today, Waiting, In Consultation, Did Not
      Attend, Avg. Wait Time.
- [ ] The hourly bar chart renders immediately with server-side data.
- [ ] No hydration errors in the browser console.
- [ ] The page auto-refreshes every 30 seconds; "Live · [time]" updates.
- [ ] Navigating to `/reports` as a non-admin redirects to `/queue` (middleware
      already handles this — verify it still works).
- [ ] DNA count matches the CANCELLED visit count shown in the queue metrics bar
      on the same day.
