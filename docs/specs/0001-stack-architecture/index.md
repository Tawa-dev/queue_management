# 0001. Stack and architecture

**Date**: 2026-08-26
**Status**: Accepted

## Summary

We are building a Next.js 16 web app (App Router, TypeScript, Tailwind CSS 4) backed by Supabase Postgres accessed through Prisma 6, with NextAuth v5 for staff authentication, Serwist for PWA offline support, and Vercel for hosting. The stack is already partially installed; this spec confirms every layer and pins the open configuration choices so all later features build on a known, consistent foundation. The key tradeoff is choosing serverless Vercel hosting over a container, accepting cold start latency in exchange for zero operational overhead at capstone scale.

## Decision

**Chosen option**: Option 1: Next.js monolith on Vercel with Supabase Postgres

Adopt the stack already chosen and partially installed in `AGENTS.md`: Next.js 16 App Router with TypeScript, Tailwind CSS 4, Prisma 6 over Supabase Postgres (pooled connection + direct URL for migrations), NextAuth v5 with credentials provider and JWT sessions, Serwist (`@serwist/next`) for PWA, and Vercel free tier for hosting. Data mutations go through Server Actions; queue polling runs every 5 seconds via client side `setInterval`; the project layout is `src/` with `src/app/`, `src/lib/`, `src/components/`, `src/server/`; the import alias is `@/*` pointing at the project root.

**Implementation skills**: `prisma-cli` (`.agents/skills/prisma-cli/`) · `prisma-client-api` (`.agents/skills/prisma-client-api/`) · `prisma-database-setup` (`.agents/skills/prisma-database-setup/`) · `supabase` (`.agents/skills/supabase/`) · `supabase-postgres-best-practices` (`.agents/skills/supabase-postgres-best-practices/`)

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript 5 (strict mode) | Type safety across the full stack; already configured in tsconfig.json |
| Framework | Next.js 16 App Router | Chosen in AGENTS.md; App Router gives server components, Server Actions, and streaming out of the box |
| Styling | Tailwind CSS 4 | Chosen in AGENTS.md; utility first, fast iteration, consistent design tokens |
| Primary DB | Supabase Postgres (accessed via Prisma 6) | Relational model fits the Visit/Room/Patient domain; free tier is sufficient at capstone scale; Prisma gives typed queries and safe migrations |
| DB connection | Pooled (`DATABASE_URL` via PgBouncer) + direct (`DIRECT_URL` for migrations) | Vercel serverless functions open many short lived connections; the pooler keeps Postgres within its connection limit |
| ORM | Prisma Client JS (standard, not edge) | `@prisma/client` 6.19.3 already installed; works in Vercel Node.js runtime; generates fully typed client |
| Auth | NextAuth v5 beta, credentials provider, JWT sessions | Chosen in AGENTS.md (no Supabase Auth, no Clerk); credentials provider is right for a staff only intranet tool; JWT sessions require no session table |
| PWA | Serwist (`@serwist/next`) | Already installed; wraps Workbox for Next.js; add `withSerwist` in `next.config.ts` and a service worker entry point |
| Queue refresh | Client side polling every 5 seconds | No WebSocket infra needed on Vercel free tier; works offline (returns cached state when the network drops); simpler than Supabase Realtime |
| Mutations | Next.js Server Actions | App Router native; co-located with server components; no extra API route files per mutation |
| Hosting | Vercel free tier | Chosen in AGENTS.md; zero ops at capstone scale; pairs naturally with Next.js |
| Observability | Vercel Analytics + structured `console.error` logging | Free, no setup; errors surface in Vercel dashboard; add an error boundary per page |
| Path alias | `@/*` pointing at project root | Already in `tsconfig.json`; use `@/lib`, `@/components`, `@/server`, `@/app` |
| Project layout | `src/` root with `src/app/`, `src/lib/`, `src/components/`, `src/server/` | Clean separation; standard Next.js convention; keeps shared code out of `app/` |

## Consequences

**Positive**:
- Zero new packages needed: the entire stack is already installed or bundled with Next.js.
- Vercel free tier covers build and hosting with no card required.
- Prisma typed client eliminates a whole class of query bugs at compile time.
- JWT sessions mean no sessions table to manage.
- Polling is trivially offline tolerant: the display board keeps rendering from cached data when the network drops.

**Negative / tradeoffs**:
- Vercel serverless has cold start latency (typically 200 to 800 ms on the first request after inactivity). Staff will notice this on first load after idle. Not a problem for a capstone; would matter on a production rollout.
- NextAuth v5 is still in beta. The credentials provider API is stable but minor breaking changes before GA are possible.
- 5 second polling means queue state is up to 5 seconds stale. A "Live · Updated [time]" label makes the lag transparent to staff.
- Supabase free tier pauses the database after 1 week of inactivity. The first request after a pause takes several seconds to resume. This is a demo concern, not a production one.
- Server Actions return validation errors explicitly; they are not automatic.

**Neutral**:
- Moving `app/` into `src/app/` requires creating the `src/` directory. The coding standards feature (scope feature 2) covers this reorganization.
- Serwist requires a service worker entry point file (`src/app/sw.ts`). Its caching strategy is specified in the PWA offline spec (feature 10).

## Follow-up

- [ ] The `prisma-cli`, `prisma-client-api`, `prisma-database-setup`, `supabase`, and `supabase-postgres-best-practices` skills are installed but not referenced in root `AGENTS.md`. These govern every database and Prisma task; add them to root `AGENTS.md` before any database work begins.
- [ ] Verify `DATABASE_URL` and `DIRECT_URL` are correctly set in `.env` for the Supabase Postgres instance before running the first migration.
- [ ] NextAuth v5 requires an `AUTH_SECRET` env var. Generate one (`openssl rand -base64 32`) and add it to `.env` before auth is implemented.
- [ ] The `src/` layout reorganization is a coding standards task (scope feature 2). Do it before any feature code is written to avoid churn.

## Rationale

Reasoning and options: see [rationale.md](rationale.md)
