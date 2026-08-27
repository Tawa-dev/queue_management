# 0003. Design system and UI foundation

**Date**: 2026-08-27
**Status**: In Progress

## Summary

This specification establishes the official design system, design tokens, atomic component primitives, and application shell layouts for Mabvuku Polyclinic Queue Management System. It translates the verified visual reference sheets into precise Tailwind CSS 4 theme variables and reusable React TypeScript components. Building these shared foundations first prevents visual divergence across workstation workflows and patient display boards.

## Requirements

**User stories**:
- As a clinic receptionist, doctor, or administrator, I want a consistent, responsive workstation shell with clear navigation and high contrast text so that I can manage queues without eye fatigue or confusion.
- As a patient waiting in the clinic lobby, I want a legible, large scale display board layout with distinct status indicators and audio announcement cues so that I know when my turn has arrived.
- As a developer building clinic features, I want a unified library of typed UI primitives (buttons, inputs, status badges, alert banners, metric cards, and layout shells) so that every screen matches the approved design system without ad hoc styling.

**Acceptance criteria**:
- **AC-1**: Tailwind CSS 4 is configured with the exact design tokens from `design/design system.png`, including the primary navy palette (`#0B2D6B`, `#1E4DB7`, `#EFF6FF`), neutral slate scale, semantic status colors (waiting `#F97316`, in consultation `#1D4ED8`, seen `#16A34A`, did not attend `#475569`, urgent `#DC2626`), Inter typography scale, 4px spacing rhythm, border radii, and custom soft shadows.
- **AC-2**: Core atomic UI primitives are built in `src/components/ui/` (`Button`, `Input`, `Select`, `Badge`, `AlertBanner`, `MetricCard`) with full TypeScript typing, accessible focus states, disabled states, and hover micro animations matching the design specification.
- **AC-3**: The staff workstation layout shell is built in `src/components/layout/` (comprising `Sidebar`, `HeaderBar`, and `WorkstationLayout`), rendering the Harare municipal clinic branding, live date and time, online status indicator, user role profile badge, and sidebar navigation (Queue, Rooms, Patients, Reports, Settings).
- **AC-4**: The public display layout shell is built in `src/components/layout/DisplayLayout.tsx`, rendering the TV header banner with the municipal crest, live clock, zone title strip, high contrast queue rows, and audio announcement cue styling.
- **AC-5**: The Next.js routing architecture uses route groups `(workstation)` and `(display)` to isolate the staff workstation shell from the full screen display board without pathname coupling or layout thrashing.
- **AC-6**: All interactive elements satisfy WCAG 2.1 AA accessibility contrast standards, support keyboard navigation with distinct blue focus outlines (`#1E4DB7`), and include appropriate ARIA attributes.

## Decision

**Chosen option**: Option 1: Centralized Tailwind CSS 4 theme tokens with typed React atomic components and route group layout shells

We will configure Tailwind CSS 4 custom theme variables in `app/globals.css`, install `lucide-react` for standard clinic icons, implement reusable typed components under `src/components/ui/`, and construct isolated layout shells for the staff workstation and TV display board under `src/components/layout/`.

## Standard definition

**Canonical token configuration** (`app/globals.css`):
```css
@import "tailwindcss";

@theme {
  --color-primary-navy: #0B2D6B;
  --color-primary-blue: #1E4DB7;
  --color-primary-tint: #EFF6FF;

  --color-neutral-slate-900: #0F172A;
  --color-neutral-slate-700: #334155;
  --color-neutral-slate-500: #64748B;
  --color-neutral-slate-400: #94A3B8;
  --color-neutral-slate-300: #CBD5E1;
  --color-neutral-slate-200: #E2E8F0;
  --color-neutral-slate-100: #F1F5F9;
  --color-neutral-slate-50: #F8FAFC;
  --color-neutral-white: #FFFFFF;

  --color-status-waiting-bg: #FFF4E5;
  --color-status-waiting-text: #F97316;
  --color-status-consult-bg: #EFF6FF;
  --color-status-consult-text: #1D4ED8;
  --color-status-seen-bg: #ECFDF5;
  --color-status-seen-text: #16A34A;
  --color-status-dna-bg: #F1F5F9;
  --color-status-dna-text: #475569;
  --color-status-busy-bg: #FFF7ED;
  --color-status-busy-text: #EA580C;
  --color-status-urgent-bg: #FEF2F2;
  --color-status-urgent-text: #DC2626;

  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;

  --shadow-clinic-sm: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
  --shadow-clinic-md: 0 4px 12px -2px rgba(15, 23, 42, 0.08);
  --shadow-clinic-lg: 0 12px 24px -4px rgba(15, 23, 42, 0.10);
  --shadow-clinic-xl: 0 20px 40px -8px rgba(15, 23, 42, 0.12);

  --radius-clinic-xs: 4px;
  --radius-clinic-sm: 8px;
  --radius-clinic-md: 12px;
  --radius-clinic-lg: 16px;
}
```

**Canonical component patterns**:
```tsx
// Reusable status badge component
import React from "react";

export type StatusVariant = 
  | "waiting" 
  | "in_consultation" 
  | "seen" 
  | "did_not_attend" 
  | "available" 
  | "busy" 
  | "urgent";

interface BadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, icon, className = "" }: BadgeProps) {
  const styles: Record<StatusVariant, string> = {
    waiting: "bg-[#FFF4E5] text-[#F97316] border border-[#FDBA74]/30",
    in_consultation: "bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]/30",
    seen: "bg-[#ECFDF5] text-[#16A34A] border border-[#86EFAC]/30",
    did_not_attend: "bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]/40",
    available: "bg-[#ECFDF5] text-[#16A34A] border border-[#86EFAC]/30",
    busy: "bg-[#FFF7ED] text-[#EA580C] border border-[#FDBA74]/30",
    urgent: "bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]/30 font-semibold",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium uppercase tracking-wider ${styles[variant]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}
```

**Replaces**:
- Arbitrary inline color hex codes scattered across individual JSX files
- Default unstyled HTML buttons and form elements
- Inconsistent spacing and random shadow utilities

**Enforcement**:
- TypeScript interface props for component variants
- Strict ESLint JSX formatting and Tailwind class consistency
- Reusable UI exports in `src/components/ui/index.ts`

**Rollout**:
- Applied immediately to all newly created pages and components.

**Exceptions**:
- None. All workstation views and display layouts must use these standardized tokens and components.

## Build plan

1. [x] Install `lucide-react` and configure Tailwind CSS 4 design tokens, Inter font import, and custom utilities in `app/globals.css`, satisfies **AC-1**
2. [x] Build atomic UI primitives in `src/components/ui/` (`Button.tsx`, `Input.tsx`, `Select.tsx`, `Badge.tsx`, `AlertBanner.tsx`, `MetricCard.tsx`) with comprehensive story props and exports, satisfies **AC-2**, **AC-6**
3. [x] Create the Workstation Shell components in `src/components/layout/` (`HeaderBar.tsx`, `Sidebar.tsx`, `WorkstationLayout.tsx`) with Harare municipal crest, live time display, connection status chip, and navigation links, satisfies **AC-3**, **AC-6**
4. [x] Create the Patient Display Board shell component in `src/components/layout/DisplayLayout.tsx` with high contrast TV headers, zone sub banner, and live announcement styling, satisfies **AC-4**, **AC-6**
5. [x] Setup Next.js Route Groups `app/(workstation)/layout.tsx` and `app/(display)/layout.tsx` to mount the respective layout shells cleanly, satisfies **AC-5**
6. [x] Implement a design system showcase page or update `app/(workstation)/page.tsx` demonstrating all components, variants, and responsive states, satisfies **AC-2**, **AC-3**

## Consequences

**Positive**:
- Guarantees 100% visual fidelity to the provided reference designs (`design/design system.png`, `design/webapp design.png`, `design/waiting area.png`).
- Eliminates code duplication across queue management, rooms, reports, and display screens.
- Standardizes accessible colors, focus states, and typography out of the box.

**Negative / tradeoffs**:
- Requires adding `lucide-react` dependency (about 25kB gzipped bundle impact, tree shaken by Next.js compiler).
- Developers must import and use standard UI components rather than writing ad hoc raw HTML tags.

**Neutral**:
- Font loading uses Next.js `next/font/google` for Inter to ensure zero layout shift and offline font caching in PWA mode.

## Follow-up

- [ ] Place Harare City crest asset into `public/images/harare-crest.png` for header and display board rendering.
- [ ] Add `@/components/ui` and `@/components/layout` path alias usage across upcoming Slice 1 features.

## Rationale

Reasoning and options: see [rationale.md](rationale.md)
