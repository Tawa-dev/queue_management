// Server component — fetches initial rooms data so the page renders with real
// content immediately (no skeleton flash on navigation).
// Client-side polling in RoomsClient takes over after hydration.

export const dynamic = "force-dynamic";

import { getRoomsAction } from "@/server/actions/getRooms";
import { RoomsClient } from "@/components/rooms/RoomsClient";

export default async function RoomsPage() {
  const res = await getRoomsAction();

  return (
    <RoomsClient
      initialRooms={res.success ? res.rooms : []}
      initialRecentAssignments={res.success ? res.recentAssignments : []}
      initialLastUpdated={new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })}
    />
  );
}
