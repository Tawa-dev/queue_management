# Verify: Design system and UI foundation · spec 0003 · updated 2026-08-27
_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Open `/` in browser → verify staff workstation shell renders with fixed Sidebar, HeaderBar featuring Harare Municipal Crest SVG, live date/time, and user profile → AC-3, AC-6
- [x] Inspect `/` component gallery → verify Button variants (primary `#0B2D6B`, secondary, destructive), Input, Select, Status Badges, Alert Banners, and Metric Cards render with exact colors → AC-1, AC-2
- [x] Navigate to `/display/zone-a` → verify Patient Display Board full-screen TV view renders dark navy top header, zone sub-banner, queue table, and now-serving audio icon → AC-4, AC-5
- [x] Test keyboard navigation (Tab / Shift+Tab) on buttons and inputs → verify high-contrast blue focus ring (`#1E4DB7`) appears around focused elements → AC-6

## Commands
- [x] `npx tsc --noEmit` → typecheck passes cleanly with 0 errors → AC-2, AC-5
- [x] `npm run build` → Next.js production build succeeds with static and dynamic routes compiled → AC-1, AC-5

## Acceptance-criteria coverage
- AC-1: Covered by Tailwind CSS 4 `@theme` tokens in `app/globals.css` and build command verification
- AC-2: Covered by atomic UI primitives in `src/components/ui/` and typecheck verification
- AC-3: Covered by `src/components/layout/WorkstationLayout.tsx` and manual browser check on `/`
- AC-4: Covered by `src/components/layout/DisplayLayout.tsx` and manual browser check on `/display/zone-a`
- AC-5: Covered by App Router Route Groups `(workstation)` and `(display)` and production build route listing
- AC-6: Covered by keyboard focus ring styling and ARIA attributes across all components
