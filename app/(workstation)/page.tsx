"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Hourglass,
  UserCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button, Badge, MetricBar } from "@/components/ui";
import { CheckInStrip } from "@/components/queue/CheckInStrip";
import { QueueTable } from "@/components/queue/QueueTable";
import { getQueueDataAction, QueueVisitItem, QueueSummaryMetrics } from "@/server/actions/getQueue";

const MOCK_RECENT_ASSIGNMENTS = [
  { time: "10:21 AM", ticket: "22", name: "R. MAPHOSA", room: "Consult Room 1" },
  { time: "10:18 AM", ticket: "21", name: "L. MANYIKA", room: "Consult Room 2" },
  { time: "10:15 AM", ticket: "20", name: "P. NDLOVU", room: "Treatment Room 1" },
];

const ROOMS = [
  { id: "r1", name: "Consult Room 1", nurse: "N. Chikomo", status: "available" as const },
  { id: "r2", name: "Consult Room 2", nurse: "P. Mutasa", status: "available" as const },
  { id: "r3", name: "Consult Room 3", nurse: "S. Dube", status: "busy" as const },
  { id: "r4", name: "Treatment Room 1", nurse: "L. Moyo", status: "available" as const },
  { id: "r5", name: "Treatment Room 2", nurse: "R. Zvidzai", status: "busy" as const },
];

export default function WorkstationHomePage() {
  const [visits, setVisits] = useState<QueueVisitItem[]>([]);
  const [summary, setSummary] = useState<QueueSummaryMetrics>({
    todayCount: 0,
    waitingCount: 0,
    inConsultationCount: 0,
    seenCount: 0,
    dnaCount: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<string>("Initializing...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [now, setNow] = useState<Date>(new Date());

  const fetchQueueData = useCallback(async () => {
    try {
      const res = await getQueueDataAction();
      if (res.success) {
        setVisits(res.visits);
        setSummary(res.summary);
        setLastUpdated(res.lastUpdated);
      }
    } catch (err) {
      console.error("Failed to fetch live queue data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchQueueData();
    }, 0);
    const intervalId = setInterval(fetchQueueData, 5000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [fetchQueueData]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

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

  const nextPatientWaitMins = nextPatient
    ? Math.max(0, Math.floor((now.getTime() - new Date(nextPatient.checkInTime).getTime()) / 60000))
    : 0;

  const nextWaitColor =
    nextPatientWaitMins >= 12 ? "text-status-urgent-text font-bold" : "text-status-waiting-text font-bold";

  return (
    <div className="space-y-3 pb-4">
      <h1 className="sr-only">Outpatient Queue Workstation — Mabvuku Polyclinic</h1>

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">Queue Summary Metrics</h2>
        <MetricBar metrics={summaryMetrics} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
        <div className="space-y-3 min-w-0">
          <CheckInStrip onCheckInSuccess={fetchQueueData} />
          <QueueTable
            visits={visits}
            lastUpdated={lastUpdated}
            isLoading={isLoading}
            onRefresh={fetchQueueData}
          />
        </div>

        <div className="space-y-3">
          <div className="bg-next-patient rounded-lg border border-[#F3E4C8] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-status-waiting-text">
              Next Patient
            </p>
            {nextPatient ? (
              <div className="mt-2">
                <div className="flex items-start gap-3">
                  <span className="text-[32px] font-extrabold text-status-waiting-text leading-none">
                    #{nextPatient.ticketNumber}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[14px] font-bold text-primary-navy uppercase truncate">
                      {nextPatient.patientName}
                    </p>
                    <p className="text-[13px] text-primary-navy truncate">{nextPatient.reason}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[13px]">
                  <Clock className="w-4 h-4 text-status-waiting-text shrink-0" strokeWidth={1.75} />
                  <span className="text-primary-navy">Waiting</span>
                  <span className={nextWaitColor}>{nextPatientWaitMins} min</span>
                </div>
                {nextPatient.isUrgent && (
                  <div className="mt-2">
                    <Badge variant="urgent" size="sm" showDefaultIcon={false} />
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs text-neutral-slate-500">
                No patients currently waiting for consultation.
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm overflow-hidden">
            <div className="p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary-navy mb-3">
                Assign to Available Room
              </h3>
              <div className="space-y-2">
                {ROOMS.map((room) => (
                  <div
                    key={room.id}
                    className="px-3 py-2.5 rounded-md border border-neutral-slate-200 bg-white flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-bold text-primary-navy leading-tight">{room.name}</h4>
                      <p className="text-[11px] text-primary-navy/70">Nurse: {room.nurse}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={room.status === "available" ? "available" : "busy"}
                        size="sm"
                        showDefaultIcon={false}
                      />
                      {room.status === "available" ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => alert(`Assign next patient to ${room.name}`)}
                          className="uppercase tracking-wide font-semibold"
                        >
                          Assign
                        </Button>
                      ) : (
                        <span className="text-sm text-neutral-slate-400 px-3">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={fetchQueueData}
                  className="text-primary-navy border-primary-navy/40"
                >
                  Update Room Status
                </Button>
              </div>
            </div>

            <div className="border-t border-neutral-slate-200 px-4 py-3">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary-navy">
                  Recent Assignments
                </h3>
                <button
                  type="button"
                  className="text-[12px] text-primary-navy hover:underline cursor-pointer"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {MOCK_RECENT_ASSIGNMENTS.map((assignment, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-primary-navy">
                    <span className="w-[62px] shrink-0">{assignment.time}</span>
                    <span className="font-bold shrink-0">#{assignment.ticket}</span>
                    <span className="font-semibold truncate">{assignment.name}</span>
                    <ArrowRight className="w-3 h-3 text-neutral-slate-400 shrink-0" />
                    <span className="truncate">{assignment.room}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
