// Server component — fetches initial queue + rooms data so the page renders
// with real content immediately (no loading flash on first visit).
// Client-side polling in WorkstationClient takes over after hydration.

import { getQueueDataAction } from "@/server/actions/getQueue";
import { getRoomsAction } from "@/server/actions/getRooms";
import { WorkstationClient } from "@/components/queue/WorkstationClient";

export default async function WorkstationHomePage() {
  // Fetch both in parallel — runs on the server before the page is sent to the browser
  const [queueRes, roomsRes] = await Promise.all([
    getQueueDataAction(),
    getRoomsAction(),
  ]);

  return (
    <WorkstationClient
      initialVisits={queueRes.success ? queueRes.visits : []}
      initialSummary={
        queueRes.success
          ? queueRes.summary
          : {
              todayCount: 0,
              waitingCount: 0,
              inConsultationCount: 0,
              seenCount: 0,
              dnaCount: 0,
            }
      }
      initialLastUpdated={
        queueRes.success ? queueRes.lastUpdated : new Date().toLocaleTimeString("en-GB")
      }
      initialRooms={roomsRes.success ? roomsRes.rooms : []}
      initialRecentAssignments={roomsRes.success ? roomsRes.recentAssignments : []}
    />
  );
}
