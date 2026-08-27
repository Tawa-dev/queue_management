# Verify: Auth and roles · spec 0004 · updated 2026-08-27
_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Navigate to `/login` in browser → verify branded Mabvuku Polyclinic sign-in page renders with Harare Crest, email and password inputs, and demo account helper buttons → AC-3
- [x] Enter valid credentials (`receptionist@mabvuku.co.zw` / `Password123!`) → verify redirect to `/queue` and HeaderBar displaying user name "R. Moyo" and role "RECEPTIONIST" → AC-1, AC-2, AC-6
- [x] Enter invalid password → verify inline error alert banner "Invalid email address or password" displays without page redirect → AC-3
- [x] While signed in as Receptionist, attempt to navigate to `/settings` → verify middleware redirects back to `/queue` with an unauthorized alert error → AC-5
- [x] Click user profile dropdown in HeaderBar and press "Sign Out of Workstation" → verify session cookie is cleared and browser redirects to `/login` → AC-6
- [x] Open unauthenticated incognito window and navigate directly to `/queue` → verify middleware redirects to `/login?callbackUrl=%2Fqueue` → AC-4

## Commands
- [x] `npx tsc --noEmit` → typecheck passes cleanly with 0 errors → AC-1, AC-2
- [x] `npm run build` → Next.js production build compiles routes and Proxy Middleware cleanly → AC-1, AC-4

## Acceptance-criteria coverage
- AC-1: Covered by NextAuth credentials handler in `src/lib/auth.ts` and bcrypt verification
- AC-2: Covered by NextAuth JWT & session callbacks attaching `id`, `role`, and `zoneId`
- AC-3: Covered by `app/(auth)/login/page.tsx` and manual sign-in test
- AC-4: Covered by `src/middleware.ts` global unauthenticated route interception
- AC-5: Covered by `src/middleware.ts` RBAC rules for Receptionist, Doctor, and Admin
- AC-6: Covered by `HeaderBar` profile menu and `signOut` client trigger
