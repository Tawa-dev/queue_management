# Design System: Mabvuku Polyclinic Queue Management System

**Source**: `design/design system.png`, `design/webapp design.png`, `design/waiting area.png`
**Version**: 1.0 (Aug 2026)
**Character**: Clean, authoritative, highly legible clinical workstation and large format waiting room display. Designed for speed, high contrast visual hierarchy, and zero operational ambiguity under high outpatient volumes.

## Build Mandate

1. **Workstation Philosophy**: This is a queue workstation, not an abstract analytics dashboard. Every screen prioritizes "who is waiting, who is next, and what room to assign".
2. **Visual Hierarchy**: Patient names and queue sequence numbers carry prominent visual weight. Wait times are given high visibility, with 15+ minutes waiting highlighted in bold red/amber.
3. **Explicit Actions**: Operational decisions (such as calling a patient or assigning a consultation room) use explicit secondary and primary buttons rather than ambiguous card clicks.
4. **Accessible Semantics**: All color pairings conform to WCAG 2.1 AA standards. Semantic status badges use both color and text/icon indicators to assist color blind users.
5. **Token Source of Truth**: CSS variables and Tailwind CSS `@theme` tokens in `app/globals.css`.

## Token Reference

- **Primary Colors**:
  - Primary Navy: `#0B2D6B` (Clinic header bar, brand titles, primary action buttons)
  - Interactive Royal Blue: `#1E4DB7` (Hover states, focus rings, interactive accents)
  - Soft Blue Tint: `#EFF6FF` / `#E9F0FF` (Active navigation pill, in-consultation badge)
- **Neutral Palette**:
  - Text Primary: `#0F172A`
  - Text Secondary: `#334155`
  - Text Muted: `#64748B`
  - Border Subdued: `#E2E8F0` / `#CBD5E1`
  - Surface Background: `#FFFFFF`
  - Canvas Background: `#F8FAFC`
- **Semantic Statuses**:
  - Waiting: `#FFF4E5` bg, `#F97316` text/icon
  - In Consultation: `#EFF6FF` bg, `#1D4ED8` text/icon
  - Seen / Completed: `#ECFDF5` bg, `#16A34A` text/icon
  - Did Not Attend: `#F1F5F9` bg, `#475569` text/icon
  - Available (Room): `#ECFDF5` bg, `#16A34A` text
  - Busy (Room): `#FFF7ED` bg, `#EA580C` text
  - Urgent / Overdue: `#FEF2F2` bg, `#DC2626` text/icon
- **Typography Scale** (Inter):
  - Display 1: `32px` / `40px` (Weight 700)
  - Display 2: `24px` / `32px` (Weight 600)
  - Heading 1: `20px` / `28px` (Weight 600)
  - Heading 2: `16px` / `24px` (Weight 600)
  - Body Large: `16px` / `24px` (Weight 400)
  - Body: `14px` / `20px` (Weight 400)
  - Small: `12px` / `16px` (Weight 400)
  - Caption: `11px` / `16px` (Weight 400)
- **Spacing Rhythm**: 4px base (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`)
- **Border Radii**: `4px` (xs), `8px` (sm), `12px` (md), `16px` (lg), `9999px` (full)
- **Shadows**:
  - sm: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`
  - md: `0 4px 12px -2px rgba(15, 23, 42, 0.08)`
  - lg: `0 12px 24px -4px rgba(15, 23, 42, 0.10)`
  - xl: `0 20px 40px -8px rgba(15, 23, 42, 0.12)`
