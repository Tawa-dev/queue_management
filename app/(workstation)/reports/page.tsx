// Server component — fetches initial report data so the page renders with
// real metrics immediately (no skeleton flash on navigation).
// ReportsClient handles 30-second polling after hydration.

export const dynamic = "force-dynamic";

import { getReportsDataAction, get7DayTrendAction } from "@/server/actions/getReports";
import { ReportsClient } from "@/components/reports/ReportsClient";

export default async function ReportsPage() {
  const [initialData, initialTrend] = await Promise.all([
    getReportsDataAction(),
    get7DayTrendAction(),
  ]);

  return <ReportsClient initialData={initialData} initialTrend={initialTrend} />;
}
