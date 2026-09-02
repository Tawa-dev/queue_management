// Server component — fetches initial workstation data so the page renders
// with real content immediately (no skeleton flash on first visit).
// Client-side polling in WorkstationClient takes over after hydration.

// Force dynamic rendering — this page calls auth() which reads request
// headers and cannot be statically pre-rendered at build time.
export const dynamic = "force-dynamic";

import { getWorkstationDataAction } from "@/server/actions/getWorkstationData";
import { WorkstationClient } from "@/components/queue/WorkstationClient";

export default async function WorkstationHomePage() {
  const res = await getWorkstationDataAction();

  return (
    <WorkstationClient
      initialVisits={res.success ? res.visits : []}
      initialSummary={
        res.success
          ? res.summary
          : {
              todayCount: 0,
              waitingCount: 0,
              inConsultationCount: 0,
              seenCount: 0,
              dnaCount: 0,
            }
      }
      initialLastUpdated={
        res.success ? res.lastUpdated : new Date().toLocaleTimeString("en-GB")
      }
      initialRooms={res.success ? res.rooms : []}
      initialRecentAssignments={res.success ? res.recentAssignments : []}
    />
  );
}
