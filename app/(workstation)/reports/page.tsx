// Server component — fetches initial report data so the page renders with
// real metrics immediately (no skeleton flash on navigation).
// ReportsClient handles 30-second polling after hydration.

import { getReportsDataAction } from "@/server/actions/getReports";
import { ReportsClient } from "@/components/reports/ReportsClient";

export default async function ReportsPage() {
  const initialData = await getReportsDataAction();
  return <ReportsClient initialData={initialData} />;
}
