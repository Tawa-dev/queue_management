# 0004. Auth and roles: rationale

## Context

Mabvuku Polyclinic requires a secure staff authentication mechanism to protect patient privacy and control workstation capabilities. Staff members have distinct operational roles: Receptionists manage patient check-in and queue entries; Doctors and Nurses call patients and manage consultation room status; Administrators oversee reports, patient records, and clinic settings.

Because the polyclinic operates in an environment with unpredictable internet connectivity, auth must not rely on external cloud auth providers (such as Clerk, Auth0, or Supabase Auth) that fail when connection drops. A self-hosted, lightweight credentials system using NextAuth v5 with JWT session cookies provides local reliability, zero operational costs, and complete compatibility with the offline PWA architecture.

## Options considered

### Option 1: NextAuth v5 credentials provider with JWT session tokens and Next.js Middleware route gating

Self-host authentication using NextAuth v5 with credentials provider, validating against the PostgreSQL `User` table via Prisma and `bcryptjs`. Session data is stored in encrypted 12-hour JWT cookies and enforced globally via Next.js Middleware.

**Pros**:
- Zero external service dependencies or usage billing.
- Operates offline once initial session JWT is stored.
- Directly leverages the existing Prisma `User` schema and `Role` enum.
- Next.js Middleware checks happen edge/server-side before page rendering.

**Cons**:
- Requires custom password reset / account creation flows if added later.

### Option 2: Hosted Auth Service (Clerk / Supabase Auth)

Use a third-party managed authentication platform.

**Pros**:
- Provides pre-built UI components and managed user administration dashboard.

**Cons**:
- Violates explicit project constraint (`AGENTS.md` rules forbid Clerk / Supabase Auth).
- Requires active internet connection to validate sessions or refresh tokens, breaking offline PWA capabilities.
- Introduces external user count licensing costs.

## Rationale

Option 1 is selected because it strictly satisfies the clinic's offline resilience requirements and zero-cost capstone constraint. Using NextAuth v5 credentials auth backed by the local Prisma `User` table ensures staff can authenticate reliably within the clinic intranet, while Next.js Middleware provides robust Role-Based Access Control across all workstation routes.
