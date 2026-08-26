# 0001. Stack and architecture: rationale

## Context

Mabvuku Polyclinic is a single outpatient clinic replacing a paper based queue with a web app. The user base is small (fewer than 20 concurrent staff), the budget is zero (capstone project), and the connectivity is unreliable (the clinic may have intermittent internet). The app must work as a PWA so the queue display board keeps rendering when the network drops.

The scaffold was started before this spec existed. Next.js 16, TypeScript, Tailwind CSS 4, Prisma 6, `@serwist/next`, `next-auth`, and `@prisma/client` are already installed in `package.json`. The Prisma schema already declares `DATABASE_URL` and `DIRECT_URL` pointing at a Supabase Postgres instance. The core stack is settled; the open decisions are how each layer is configured and how they connect.

The key forces are: zero infrastructure budget, offline tolerance, a small team (one or two developers), and the need for a clean standalone data model that does not touch an EMR system. Health adjacent data warrants care: store only what check in requires, treat patient records conservatively even without formal HIPAA scope.

## Options considered

### Option 1: Next.js monolith on Vercel with Supabase Postgres (chosen)

The already installed stack, confirmed and configured. Next.js App Router handles the full stack: server components for data fetching, Server Actions for mutations, and Route Handlers for any polling endpoints. Supabase Postgres is accessed through Prisma only (no Supabase JS client, no Supabase Auth). NextAuth v5 runs entirely self hosted. Serwist caches the queue display for offline viewing.

**Pros**:
- All packages already installed; no new dependencies.
- App Router Server Actions simplify the mutation path: no separate API layer, no `fetch` wiring.
- Vercel is free at this scale and deploys from git push.
- Prisma typed client catches schema mismatch bugs at compile time.

**Cons**:
- Vercel serverless cold starts (200 to 800 ms) after idle. Acceptable for a capstone; a concern for a production rollout.
- NextAuth v5 beta means the API may shift slightly before GA.

### Option 2: Next.js with Supabase Realtime for live queue updates

Same stack but replace 5 second polling with Supabase Realtime WebSockets. Supabase Realtime pushes row level changes to subscribed clients.

**Pros**:
- True real time updates; no polling lag.

**Cons**:
- Requires the Supabase JS client on the frontend, adding a dependency the project explicitly avoids (AGENTS.md: use Supabase for the DB only, not its auth or storage features).
- WebSocket connections are stateful; harder to cache offline.
- Adds complexity with no meaningful benefit at this scale (5 second polling is imperceptible in a clinic context).

### Option 3: Separate Express backend + Next.js frontend

Keep the Next.js frontend but move all data logic to a standalone Express (or Hono) API service deployed on a container (Railway, Render).

**Pros**:
- Clean API/UI separation; easier to replace one side independently.

**Cons**:
- Two deployable units, two sets of env vars, two CI pipelines. Adds operational overhead AGENTS.md explicitly prohibits ("do not add a separate backend framework").
- No benefit at single clinic capstone scale.
- Container hosting is not free at the same tier as Vercel for a Next.js app.

## Rationale

Option 1 is the correct choice. The other options either add a dependency AGENTS.md prohibits (Supabase Realtime, Supabase JS client) or add operational complexity with no benefit at this scale (separate backend service). The entire stack is already installed; confirming it and pinning the configuration choices is all this spec needs to do. The one real tradeoff is Vercel cold starts, which are acceptable for a capstone and acknowledged in Consequences.

Polling at 5 seconds was chosen over Supabase Realtime because it is simpler, works with the existing Prisma only Supabase access pattern, and degrades cleanly offline: the display board renders from cached state and resumes polling when connectivity returns. A queue management tool in a clinic does not need sub second latency; 5 seconds is operationally indistinguishable from real time for the staff workflow.

Server Actions were chosen over Route Handlers for mutations because they reduce boilerplate significantly on App Router. Route Handlers remain available for the polling fetch endpoint (where a GET returning JSON is the natural interface), but check in, room assignment, and visit completion are all Server Actions.
