# 0006. Queue view (staff workstation): rationale

## Context

In busy municipal outpatient clinics like Mabvuku Polyclinic, staff require immediate visibility into patient queue volume and wait times. Traditional paper queue lists lack real-time elapsed time counters, making it difficult for triage nurses to notice patients who have been waiting in excess of 15 or 30 minutes.

The workstation Queue View serves as the single staff home page. It prioritizes patient name over reason for visit, gives strong visual weight to elapsed wait times with color-coded warning tiers, and automatically updates via background polling so staff always see current queue state without touching a refresh button.

## Options considered

### Option 1: Reactive Queue Table with 5-second polling and color-coded wait time thresholds

Build a client-side polling queue table connected to a Next.js Server Action (`getQueueDataAction`). The table updates every 5 seconds, pins urgent priority cases to the top, formats wait time in color tiers (0-9m slate, 10-14m amber, 15+m red with alert icon), and includes a "Live · Updated [time]" status indicator.

**Pros**:
- Hands-free operation: staff see real-time updates without clicking a refresh button.
- Urgent priority pinning ensures emergency cases receive immediate attention.
- Color-coded wait time thresholds draw instant visual focus to overdue patients.
- Lightweight Server Action queries execute sub-millisecond using indexed database columns.

**Cons**:
- Incurs continuous background queries every 5 seconds per active staff tab.

### Option 2: Manual Refresh Button Only

Require staff to click a "Refresh Queue" button whenever they want to see updated waiting entries.

**Pros**:
- Minimizes background database queries.

**Cons**:
- Violates explicit `AGENTS.md` directive ("Show Live · Updated [time] instead of a manual Refresh Data button wherever underlying data is polled/live").
- Creates stale views where staff miss newly checked-in urgent patients.

## Rationale

Option 1 is selected because it strictly complies with `AGENTS.md` workstation design rules and provides the real-time operational visibility essential for high-throughput outpatient care.
