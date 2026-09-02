"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Hourglass,
  UserCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { MetricBar } from "@/components/ui";
import { CheckInStrip } from "@/components/queue/CheckInStrip";
import { QueueTable } from "@/components/queue/QueueTable";
import { RoomAssignPanel } from "@/components/queue/RoomAssignPanel";
import {
  getWorkstationDataAction,
} from "@/server/actions/getWorkstationData";
import type { QueueVisitItem, QueueSummaryMetrics } from "@/server/actions/getQueue";
import type { RoomItem, RecentAssignment } from "@/server/actions/getRooms";

export interface WorkstationClientProps {
  /** Initial data fetched server-side so the page renders with real data immediately */
  initialVisits: QueueVisitItem[];
  initialSummary: QueueSummaryMetrics;
  initialLastUpdated: string;
  initialRooms: RoomItem[];
  initialRecentAssignments: RecentAssignment[];
}

export function WorkstationClient({
  initialVisits,
  initialSummary,
  initialLastUpdated,
  initialRooms,
  initialRecentAssignments,
}: WorkstationClientProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const [visits, setVisits] = useState<QueueVisitItem[]>(initialVisits);
  const [summary, setSummary] = useState<QueueSummaryMetrics>(initialSummary);
  const [lastUpdated, setLastUpdated] = useState<string>(initialLastUpdated);
  // Initial data came from the server — don't show loading skeleton on first render
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [rooms, setRooms] = useState<RoomItem[]>(initialRooms);
  const [recentAssignments, setRecentAssignments] = useState<RecentAssignment[]>(
    initialRecentAssignments
  );

  const fetchAll = useCallback(async () => {
    try {
      const res = await getWorkstationDataAction();
      if (res.success) {
        setVisits(res.visits);
        setSummary(res.summary);
        setLastUpdated(res.lastUpdated);
        setRooms(res.rooms);
        setRecentAssignments(res.recentAssignments);
      }
    } catch (err) {
      console.error("Failed to fetch workstation data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll every 5 seconds — no immediate fetch on mount since we have server-side initial data
  useEffect(() => {
    const intervalId = setInterval(fetchAll, 5000);
    return () => clearInterval(intervalId);
  }, [fetchAll]);

  const summaryMetrics = [
    {
      id: "today",
      label: "TODAY",
      value: summary.todayCount,
      subtext: "Total checked in",
      icon: <Users className="w-5 h-5" strokeWidth={1.75} />,
      iconColor: "text-primary-navy",
      valueColor: "text-primary-navy",
    },
    {
      id: "waiting",
      label: "WAITING",
      value: summary.waitingCount,
      icon: <Hourglass className="w-5 h-5" strokeWidth={1.75} />,
      iconColor: "text-status-waiting-text",
      valueColor: "text-status-waiting-text",
    },
    {
      id: "consulting",
      label: "IN CONSULTATION",
      value: summary.inConsultationCount,
      icon: <UserCheck className="w-5 h-5" strokeWidth={1.75} />,
      iconColor: "text-primary-navy",
      valueColor: "text-primary-navy",
    },
    {
      id: "seen",
      label: "SEEN",
      value: summary.seenCount,
      icon: <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />,
      iconColor: "text-status-seen-text",
      valueColor: "text-status-seen-text",
    },
    {
      id: "dna",
      label: "DID NOT ATTEND",
      value: summary.dnaCount,
      icon: <XCircle className="w-5 h-5" strokeWidth={1.75} />,
      iconColor: "text-primary-navy",
      valueColor: "text-primary-navy",
    },
  ];

  const nextPatient = visits.length > 0 ? visits[0] : null;

  return (
    <div className="pb-4">
      <h1 className="sr-only">Outpatient Queue Workstation — Mabvuku Polyclinic</h1>

      {/* Two-column layout: left main (stats + check-in + queue) | right rail (next patient + rooms) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
        {/* Left column */}
        <div className="space-y-3 min-w-0">
          <section aria-labelledby="metrics-heading">
            <h2 id="metrics-heading" className="sr-only">
              Queue Summary Metrics
            </h2>
            <MetricBar metrics={summaryMetrics} />
          </section>

          <CheckInStrip onCheckInSuccess={fetchAll} />

          <QueueTable
            visits={visits}
            lastUpdated={lastUpdated}
            isLoading={isLoading}
            onRefresh={fetchAll}
          />
        </div>

        {/* Right column — starts at top, aligned with stats row */}
        <div className="space-y-3 min-w-0">
          <div className="bg-next-patient rounded-lg border border-[#F3E4C8] p-4 shadow-clinic-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-status-waiting-text">
              Next Patient
            </p>
            {nextPatient ? (
              <NextPatientCard visit={nextPatient} />
            ) : (
              <p className="mt-3 text-xs text-neutral-slate-500">
                No patients currently waiting for consultation.
              </p>
            )}
          </div>

          <RoomAssignPanel
            rooms={rooms}
            recentAssignments={recentAssignments}
            onActionSuccess={fetchAll}
            onRefresh={fetchAll}
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Next Patient card
// ---------------------------------------------------------------------------
function NextPatientCard({ visit }: { visit: QueueVisitItem }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const waitMins = now
    ? Math.max(0, Math.floor((now.getTime() - new Date(visit.checkInTime).getTime()) / 60000))
    : 0;
  const waitColor =
    waitMins >= 15
      ? "text-status-urgent-text font-bold"
      : waitMins >= 10
      ? "text-status-waiting-text font-bold"
      : "text-neutral-slate-700 font-semibold";

  return (
    <div className="mt-2">
      <div className="flex items-start gap-3">
        <span className="text-[32px] font-extrabold text-status-waiting-text leading-none">
          #{visit.ticketNumber}
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-[14px] font-bold text-primary-navy uppercase truncate">
            {visit.patientName}
          </p>
          <p className="text-[13px] text-primary-navy truncate">{visit.reason}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[13px]">
        <Hourglass className="w-4 h-4 text-status-waiting-text shrink-0" strokeWidth={1.75} />
        <span className="text-primary-navy">Waiting</span>
        <span className={waitColor}>{waitMins} min</span>
      </div>
      {visit.isUrgent && (
        <div className="mt-2">
          <UrgentBadge />
        </div>
      )}
    </div>
  );
}

function UrgentBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]/40">
      URGENT / PRIORITY
    </span>
  );
}
