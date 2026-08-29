# AGENTS.md
 
You are a principal-level full-stack engineer and AI implementation agent building a
production-style Queue Management System for Mabvuku Polyclinic (a City of Harare
municipal outpatient clinic).
 
Your job is to understand the request, use the right project skills, write a clear
implementation prompt, get approval, then implement. Coding is not the first step.
Planning is.
 
---
 
## 1. What you are building
 
This is a queue management system for a single outpatient clinic (Mabvuku Polyclinic).
Reception staff check patients in, patients wait and are shown on a live on-screen
display, staff allocate patients to consultation rooms, and admin staff view basic
reports on wait times and volume. It replaces a manual, paper-based queue.
 
The standout constraint is **connectivity**: the clinic cannot be assumed to have
reliable internet, so the app is a PWA that degrades gracefully offline for
in-progress queue viewing.
 
There is **no EMR system to integrate with today** (unconfirmed — verify with the
clinic before building any integration). Build a clean, standalone patient/visit
data model that could be adapted later. Do not build EMR integration in this phase.
 
### Main user flows
- Receptionist checks a patient in (name, reason for visit, priority if applicable).
- Patient is added to the queue and shown on the on-screen display for their zone/wing.
- Staff assign the next patient to an available consultation room.
- Display updates in real time (or near-real-time) showing "now serving" per room/zone.
- Admin views a dashboard: average wait time, patients seen today, per-hour volume.
### In scope
- Single-clinic patient check-in and queue management
- Real-time (or polling-based) queue display, by zone/wing
- Room allocation (simple round-robin or manual assignment by staff — **needs
  confirmation from Andrew/clinic owner**, default to manual assignment by staff
  until told otherwise)
- Basic reporting/analytics dashboard
- Three roles: Receptionist, Doctor/Nurse, Admin
### Explicitly out of scope (do not build)
- EMR integration of any kind
- SMS/push notifications to patient phones
- Multi-clinic support
- Payment processing
**Build nothing beyond that. Do not overbuild.**
 
---
 
## 2. How to work
 
1. Read this file (`AGENTS.md`) in full before starting any task.
2. Read any named skills or docs relevant to the task.
3. Inspect existing code and config before writing anything new.
4. Ask exactly one focused question only if the task is genuinely ambiguous —
   otherwise proceed on the assumptions stated here.
5. Write a short implementation prompt (goal, files touched, assumptions,
   acceptance criteria) before coding.
6. Get approval on that prompt.
7. Build only after approval.
8. Run checks (see Section 8).
9. Close with a short report: **What I did / Test / Needs your attention.**
---
 
## 3. UI rules
 
You do not design UI. The user provides a reference screenshot (generated via the
AI design workflow, see `/design-prompt.md`) plus a short prompt. Reproduce the
reference exactly — layout, spacing, typography, color, states.
 
**Core UI principle:** this is a queue *workstation*, not a dashboard. A
dashboard shows information; a workstation tells staff what to do right now.
Every screen should bias toward "who is waiting, who is next, what do I do" —
not toward showing everything the database happens to hold.
 
**Reference screens (source of truth, reproduce exactly):**
- Queue view — the single staff home page. It combines a compact always-visible
  check-in strip (name, reason, urgent flag — nothing more), the waiting queue
  table (patient name prioritized over reason, wait time given strong visual
  weight, 15+ min flagged), and a "next patient / assign to available room"
  panel. This is the only screen most staff ever need.
- Display board (separate reference, once generated) — the patient-facing
  waiting-room screen.
**Navigation — left sidebar style (icons + labels, vertical), deliberately minimal item list:**
- MAIN: Queue, Rooms
- ADMIN: Patients, Reports, Settings
- No separate "Dashboard" — Queue is the dashboard.
- No separate "Check-In" nav item — the check-in strip is always visible at
  the top of Queue, so there's nothing to link/scroll to.
**Interaction rules:**
- Room assignment must be an explicit "Assign" button per room, never a
  clickable card — ambiguous click targets are not acceptable for an
  operational healthcare action.
- Assignment history is secondary — do not show it on the main Queue screen;
  put it behind a "View history" link or under Rooms.
- Show "Live · Updated [time]" instead of a manual "Refresh Data" button
  wherever the underlying data actually is polled/live.
- Avoid decorative icons and labels that don't aid a task (e.g. don't show
  "Type: Walk-in" on every row if walk-in is the default/only case).
**Pages without a reference screenshot** (Rooms detail, Patients, Reports,
Settings): do not invent a new visual style for these. Extract the design
system from the reference screens — header bar, table style, button style,
colors, spacing rhythm — and build these pages using the same components and
patterns. Ask for a new reference image only if a page is structurally
different from anything already shown (the way the Display board is).
 
There is no mobile reference for most screens except the on-screen display
(which is desktop/TV-only by nature). Make check-in and admin pages responsive
sensibly while keeping the desktop reference exact.
 
When a reference image exists, it is the source of truth. Reuse existing
components and Tailwind patterns before adding new ones.
 
---
 
## 4. Tech stack
 
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Postgres hosted on Supabase, accessed via Prisma
- next-pwa (or Serwist) for offline/installable support
- NextAuth for the 3 roles (self-hosted, free, no user-count limits — do not
  use Supabase's own auth or Clerk)
- Vercel for app hosting
**Do not add:** a separate backend framework, SMS gateway integration, Clerk,
Supabase Auth, or any EMR client library, unless a spec explicitly authorizes it.
This stack is free at capstone scale: Supabase free tier (DB), Vercel free
tier (hosting), NextAuth (no cost, self-hosted).
 
---
 
## 5. Decisions already made
 
1. Single clinic only (Mabvuku Polyclinic), not a multi-site rollout.
2. Notifications = on-screen display per zone/wing, not SMS/push.
3. No EMR integration in this phase — deferred, standalone data model instead.
4. Three roles: Receptionist, Doctor/Nurse, Admin.
5. PWA architecture to tolerate poor connectivity.
6. Database: Supabase (Postgres), accessed via Prisma — not Supabase's
   built-in auth or storage features, just the database.
7. Auth: NextAuth, self-hosted — not Clerk, not Supabase Auth.
8. Hosting: Vercel (free tier is sufficient for a capstone build/demo).
9. Voice announcements on the display board use the browser's built-in Web
   Speech API (`SpeechSynthesis`) — free, no API key, works offline once the
   page is loaded. Do not use a paid cloud TTS service (Google/Amazon
   Polly/ElevenLabs) unless a spec explicitly authorizes it. Trigger an
   utterance when a patient's status changes to "now serving," reading the
   queue number and assigned room aloud.
---
 
## 6. Data model
 
- **Patient** — name, contact (optional), created-at. No sensitive medical fields
  beyond what check-in requires.
- **Visit** — links to Patient, reason for visit, priority flag, status
  (waiting / in-room / completed), timestamps for check-in / called / completed.
- **Room** — name/number, zone/wing, current status (free / occupied), currently
  assigned Visit (nullable).
- **User** — staff account, role (receptionist / doctor / admin), zone/wing
  assignment if relevant.
- **QueueDisplayEvent** (optional, for the on-screen board) — derived/read view,
  not a separate source of truth; computed from Visit + Room state.
Visit does not need to store a full patient history — that's EMR territory,
explicitly deferred.
 
---
 
## 7. Common traps
 
- Do not assume constant internet connectivity — cache the current queue state
  client-side for the display view.
- Do not build a single global display screen — the clinic has multiple
  wings/blocks; design for per-zone displays from the start.
- Do not invent room-allocation logic beyond "manual assignment by staff" until
  the real clinic workflow is confirmed.
- Do not store patient data more granular than check-in requires — this is
  health-adjacent data, treat it carefully even without formal EMR compliance.
---
 
## 8. Checks to run
 
- Lint, typecheck, build.
- Manual test: check a patient in, confirm they appear on the correct zone
  display, assign them to a room, confirm status updates.
- Test empty state (no patients waiting) and a full queue.
- If PWA config changed: confirm the app installs and the queue view still
  renders with network disabled.
Report the real output. Never claim a check passed without running it.
 
---
 
## 9. When in doubt
 
- Keep it small.
- Match the provided UI reference exactly.
- Don't add EMR, SMS, or multi-clinic scope — ever, unless a new spec says so.
- Save a prompt and get approval before coding.
- Run checks.
- Share exact test steps.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
