# 0004. Auth and roles

**Date**: 2026-08-27
**Status**: In Progress

## Summary

This specification defines the authentication and role based access control system for Mabvuku Polyclinic Queue Management System. It configures NextAuth v5 credentials authentication backed by the PostgreSQL User model and bcryptjs password hashing. Next.js Middleware protects workstation routes according to staff roles (Receptionist, Doctor/Nurse, Admin) with 12 hour JWT session tokens, guaranteeing secure shift operations without external auth dependencies.

## Requirements

**User stories**:
- As a clinic receptionist, doctor, or administrator, I want to sign in securely with my staff email and password so that I can access my workstation tools.
- As a clinic administrator, I want staff accounts gated by role so that receptionists cannot alter admin settings and doctors are directed to room management.
- As an unauthenticated user, I want attempts to reach private workstation pages redirected to the sign in page so that clinic patient queue data is kept private.

**Acceptance criteria**:
- **AC-1**: NextAuth v5 is configured in `src/lib/auth.ts` using the Credentials provider, validating email and password against the Prisma `User` model using `bcryptjs` password hashing.
- **AC-2**: Successful authentication issues a encrypted 12 hour JWT session containing user `id`, `email`, `name`, `role` (`RECEPTIONIST`, `DOCTOR`, `ADMIN`), and optional `zoneId`.
- **AC-3**: A branded clinic sign in page is built at `app/(auth)/login/page.tsx` using the design system primitives, rendering email and password fields, error messaging for invalid credentials, and a loading state.
- **AC-4**: Next.js Middleware in `middleware.ts` intercepts requests to `/queue`, `/rooms`, `/patients`, `/reports`, and `/settings`, redirecting unauthenticated requests to `/login`.
- **AC-5**: Role authorization rules enforce page access: `/queue` is accessible to all staff roles; `/rooms` is accessible to Doctor, Nurse, and Admin roles; `/patients`, `/reports`, and `/settings` are restricted to Admin role. Unauthorized role attempts redirect to `/queue` with an error alert banner.
- **AC-6**: HeaderBar profile menu includes a functional Sign Out button that invalidates the NextAuth session cookie and redirects the browser back to `/login`.

## Decision

**Chosen option**: Option 1: NextAuth v5 credentials provider with JWT session tokens and Next.js Middleware route gating

We will configure NextAuth v5 in `src/lib/auth.ts`, write credential verification with `bcryptjs`, enforce route protection in `middleware.ts`, build the sign in page in `app/(auth)/login/page.tsx`, and wire session state into `HeaderBar`.

**Implementation skills**: `supabase` (`.agents/skills/supabase/`) · `prisma-client-api` (`.agents/skills/prisma-client-api/`)

## Feature design

**Data model sketch**:
Uses the existing `User` model in `prisma/schema.prisma`:
- `id`: String (cuid primary key)
- `email`: String (unique)
- `passwordHash`: String (bcrypt hash)
- `name`: String
- `role`: Role enum (`RECEPTIONIST`, `DOCTOR`, `ADMIN`)
- `zoneId`: String (optional foreign key to Zone)

**State transitions**:
- Unauthenticated -> Submitting Credentials -> Authenticated (JWT Issued) -> Redirected to `/queue`
- Authenticated -> Accessing Restricted Route -> Authorized (Access Granted) OR Unauthorized (Redirected to `/queue` with error)
- Authenticated -> Press Sign Out -> Session Cleared -> Redirected to `/login`

**API surface**:
| Endpoint / Action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | Credentials payload | JWT Cookie, Session object | Public / Session | 401 Unauthorized |
| `authenticateCredentials` | Server Action | `email`, `password` | `{ success: boolean, error?: string }` | Public | 400 Bad Request, 401 Invalid Credentials |
| `signOutAction` | Server Action | None | Redirects to `/login` | Authenticated | 500 Internal Error |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Sign In | User identity & JWT token | Email & password inputs matched against `User` table in DB |
| HeaderBar Profile | Display name & role badge | NextAuth session object (`session.user.name`, `session.user.role`) |
| Route Middleware | Authorization decision | NextAuth JWT token `token.role` compared against route permission map |

**Key invariants**:
- Passwords are never stored or logged in plain text; all stored hashes use bcrypt with cost factor 10.
- Session JWT tokens expire after 12 hours (matching standard clinic shift duration).
- Unauthenticated users cannot reach any route under `/queue`, `/rooms`, `/patients`, `/reports`, or `/settings`.

**Security model**:
- Self hosted NextAuth v5 credentials provider.
- HTTP only, Secure, SameSite cookies for JWT session storage.
- Admin role required for `/patients`, `/reports`, and `/settings`.
- Public routes: `/login`, `/display/[zone]`.

**Configuration required**:
- `AUTH_SECRET`: Secret key used to sign and encrypt NextAuth JWT tokens (generate via `openssl rand -base64 32`).
- `NEXTAUTH_URL`: Canonical application URL (defaults to `http://localhost:3000` in development).

**Critical test scenarios**:
- Happy path: Receptionist logs in with valid email and password, receives JWT session, and lands on `/queue`, verifies **AC-1**, **AC-2**, **AC-3**
- Invalid credentials: User enters wrong password, receives inline error alert banner without redirect, verifies **AC-3**
- Unauthenticated redirect: Unauthenticated browser attempts to visit `/queue`, redirected to `/login`, verifies **AC-4**
- Role restriction: Receptionist attempts to navigate to `/settings`, redirected to `/queue` with permission alert, verifies **AC-5**
- Sign out: Authenticated user clicks Sign Out in HeaderBar, cookie is cleared and user lands on `/login`, verifies **AC-6**

## Build plan

1. [x] Ensure `bcryptjs` and `@types/bcryptjs` are installed, and configure NextAuth v5 handlers in `src/lib/auth.ts`, satisfies **AC-1**, **AC-2**
2. [x] Create Next.js Middleware in `middleware.ts` for route authentication and role authorization checks, satisfies **AC-4**, **AC-5**
3. [x] Create NextAuth API route handler at `app/api/auth/[...nextauth]/route.ts`, satisfies **AC-1**
4. [x] Build the branded clinic sign in page at `app/(auth)/login/page.tsx` using design system primitives, satisfies **AC-3**
5. [x] Connect NextAuth `SessionProvider` in root layout and update `HeaderBar` with live session data and Sign Out action, satisfies **AC-6**
6. [x] Update database seed script `prisma/seed.ts` to generate initial hashed staff accounts (`receptionist@mabvuku.co.zw`, `doctor@mabvuku.co.zw`, `admin@mabvuku.co.zw`), satisfies **AC-1**

## Consequences

**Positive**:
- 100% self hosted auth with zero third party service dependency or user count costs.
- Integrates seamlessly with existing Prisma `User` schema and `Role` enum.
- Fast, low overhead JWT session checks in Next.js Middleware.

**Negative / tradeoffs**:
- NextAuth v5 is in beta release; configuration uses standard v5 patterns.
- Requires managing an `AUTH_SECRET` environment variable across environments.

**Neutral**:
- Display board routes (`/display/[zone]`) remain public so waiting room TVs do not require staff sign in.

## Follow-up

- [ ] Add `AUTH_SECRET` to local `.env` file before executing build tasks.
- [ ] Document initial seed credentials in repository README for development testing.

## Rationale

Reasoning and options: see [rationale.md](rationale.md)
