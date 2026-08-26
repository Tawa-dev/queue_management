# 0002. Core data model: rationale

## Context

The clinic replaces paper-based queuing with an operational workstation. The database must support real-time queue views per zone, room assignment by staff, display board filtering, and basic reporting. Because internet connectivity is intermittent and no EMR system exists today, patient and visit data must remain lightweight and focused strictly on check-in and queue operational needs.

The key forces are:
- Single clinic operations with multiple wings/zones (e.g., Block A General, Block B MCH).
- Rapid check-in by receptionists requiring minimal fields (patient full name, phone, reason, urgent flag).
- High-frequency 5-second polling of queue state requiring targeted database indexes.
- NextAuth credentials provider integration requiring hashed passwords and staff role definitions.

## Options considered

### Option 1: Standalone Relational Schema with CUID Keys (chosen)

Define explicit `Zone`, `Room`, `User`, `Patient`, and `Visit` tables in Prisma using `cuid()` identifiers. Links between `Visit` and `Room` are maintained on the `Visit` table (`roomId`), while `Room.status` reflects current occupancy.

**Pros**:
- Standard relational integrity with clear foreign keys.
- `cuid()` IDs avoid auto-increment integer enumeration while staying URL-friendly.
- Independent of any external EMR system.

**Cons**:
- Requires careful index selection for performance during 5-second polling cycles.

### Option 2: Embedded JSON Patient History inside Patient entity

Store visit history as an array of JSON objects inside a `Patient` document.

**Pros**:
- Single query fetches patient + all past visits.

**Cons**:
- Destroys SQL relational integrity for room assignment, status updates, and reporting queries.
- Poor performance for queue aggregation per zone.

## Rationale

Option 1 is the correct choice. It provides clear relational boundaries between entities without unnecessary complexity. `cuid()` identifiers prevent ID enumeration while maintaining string keys easy to pass through server actions and API routes. Enums (`Role`, `RoomStatus`, `VisitStatus`) ensure state transitions remain strict and valid.
