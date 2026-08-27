# 0003. Design system and UI foundation: rationale

## Context

Mabvuku Polyclinic requires a clinic queue management system that operates across two primary form factors: a high density desktop workstation for receptionists, nurses, and doctors, and a large format on screen waiting room display for patients. The visual reference materials (`design/design system.png`, `design/webapp design.png`, `design/waiting area.png`) define an authoritative visual identity for the City of Harare outpatient service.

Without a standardized UI foundation and design token system, individual feature implementations (check-in, queue tables, room assignment panels, and display boards) will accumulate styling inconsistencies, ad hoc inline CSS values, mismatched font sizing, and broken focus states. Establishing the token scale, atomic UI components, and layout shells upfront guarantees visual harmony, accessibility compliance, and rapid feature development.

## Options considered

### Option 1: Centralized Tailwind CSS 4 theme tokens with typed React atomic components and route group layout shells

Define custom design tokens via Tailwind CSS 4 `@theme` in `app/globals.css`, build typed React atomic components in `src/components/ui/`, and implement layout shells in `src/components/layout/` using Next.js App Router route groups `(workstation)` and `(display)`.

**Pros**:
- Exactly replicates the verified design system tokens (colors, typography, radii, shadows).
- Enforces strict consistency and type safety across all future feature slices.
- Isolates workstation chrome (sidebar, header) from TV waiting area displays cleanly.

**Cons**:
- Requires upfront investment before building specific business logic features.

### Option 2: Inline Tailwind utility styling built ad hoc within each page

Skip shared design tokens and atomic component abstractions, allowing each page (Queue, Rooms, Display) to write arbitrary Tailwind classes directly in JSX.

**Pros**:
- Starts faster with no initial component scaffolding.

**Cons**:
- High risk of visual drift, divergent color codes, and broken spacing across views.
- Duplicates button, input, and badge code across multiple feature files.
- Makes global design updates difficult and error prone.

## Rationale

Option 1 is selected because Mabvuku Polyclinic is an operational healthcare system where visual clarity, clear affordances, and unmistakable status states are essential to prevent staff confusion. Building centralized tokens and atomic components directly from the reference specification sheet guarantees complete fidelity to the approved designs and accelerates all subsequent feature development.
