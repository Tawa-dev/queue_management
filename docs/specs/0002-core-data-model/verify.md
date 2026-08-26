# Verify: Core data model · spec 0002 · updated 2026-08-26
_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## Commands
- [x] `npx prisma validate` → Schema is valid without errors → AC-1
- [x] `npx prisma generate` → Typed Prisma Client generated at node_modules/@prisma/client → AC-3
- [x] `npx tsc --noEmit` → TypeScript typecheck passes with 0 errors → AC-3
- [ ] `npx prisma db seed` → Seeding succeeds and logs seeded zones, rooms, and staff users (requires DB password) → AC-4

## Acceptance-criteria coverage
- AC-1: Prisma schema models User, Zone, Room, Patient, Visit, Enums, and indexes
- AC-2: Database migration executed against Supabase Postgres
- AC-3: Prisma client generated and typed access verified via `src/lib/db.ts`
- AC-4: Seed script seeds default zones (Block A, Block B), rooms, and staff accounts
- AC-5: Index definitions on `Visit` table verified in schema
