// Server component — fetches initial display data so the board renders
// with real content immediately on load/reload.
// DisplayClient takes over polling and voice announcements after hydration.

import { getDisplayDataAction } from "@/server/actions/getDisplay";
import { DisplayClient } from "@/components/display/DisplayClient";

interface DisplayZonePageProps {
  params: Promise<{ zone: string }>;
}

export default async function DisplayZonePage({ params }: DisplayZonePageProps) {
  const { zone } = await params;
  const zoneCode = zone ?? "general";

  const initialData = await getDisplayDataAction(zoneCode);

  return <DisplayClient zoneCode={zoneCode} initialData={initialData} />;
}
