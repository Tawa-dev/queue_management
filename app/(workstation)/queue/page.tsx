// Canonical queue workstation URL (/queue).
// Standalone copy — not a re-export — to avoid Next.js client-reference-manifest
// build errors caused by the same module being both a route and a re-export target.
export const dynamic = "force-dynamic";

import { getWorkstationDataAction } from "@/server/actions/getWorkstationData";
import { WorkstationClient } from "@/components/queue/WorkstationClient";

export default async function QueuePage() {
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
