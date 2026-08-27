# 0005. Patient check in and queue core: rationale

## Context

Mabvuku Polyclinic outpatient reception processes high volumes of walk-in patients daily. In the manual paper-based workflow, receptionists wrote patient names on paper registers and handed out paper numbers, leading to lost tickets, unreadable names, and zero visibility for consulting doctors.

The digital queue management system replaces paper registers with an immediate check in strip embedded directly at the top of the staff workstation. The design prioritizes speed: receptionists capture patient name, reason for visit, and priority status in seconds, automatically issuing sequential ticket numbers for on-screen waiting room displays.

## Options considered

### Option 1: Embedded check in strip with Next.js Server Action and daily zone-scoped sequential ticket numbers

Integrate a compact check in form strip directly at the top of the main workstation screen. Submissions invoke a Next.js Server Action (`checkInPatientAction`) that performs atomic patient upsert, ticket sequence calculation, and visit creation in PostgreSQL.

**Pros**:
- Zero context switching: receptionists check in patients without leaving the queue workstation page.
- Zone-scoped sequential numbers (#1, #2, #23) are clean and easy for patients to read on waiting room TVs.
- Server Actions provide server-side validation and atomic database writes.

**Cons**:
- Requires handling daily sequence resets per clinic zone.

### Option 2: Dedicated multi-step check in page (/check-in)

Navigate receptionists to a separate full-page form to register arriving patients.

**Pros**:
- Allows collecting extensive demographic and medical history fields.

**Cons**:
- Violates explicit `AGENTS.md` directive ("Check-in strip is always visible at the top of Queue, so there's no separate Check-In nav item or page").
- Slows intake throughput during morning peak hours.

## Rationale

Option 1 is selected because it matches the exact operational workflow specified in the clinic reference designs and `AGENTS.md` guidelines. Embeding the check in strip at the top of the workstation ensures receptionists can register arriving patients in seconds while maintaining full view of the waiting queue.
