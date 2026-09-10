// Server component — fetches all settings data server-side so the page
// renders immediately with no skeleton flash.
// SettingsClient handles mutations (add/remove staff and rooms).

export const dynamic = "force-dynamic";

import { getSettingsDataAction } from "@/server/actions/settings";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const data = await getSettingsDataAction();

  return (
    <SettingsClient
      initialStaff={data.success ? data.staff : []}
      initialRooms={data.success ? data.rooms : []}
      initialZones={data.success ? data.zones : []}
    />
  );
}
