"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Button, Badge, AlertBanner } from "@/components/ui";
import { RoomItem, RecentAssignment } from "@/server/actions/getRooms";
import { assignRoomAction } from "@/server/actions/assignRoom";
import { completeVisitAction } from "@/server/actions/completeVisit";

export interface RoomAssignPanelProps {
  rooms: RoomItem[];
  recentAssignments: RecentAssignment[];
  /** Called after a successful assign or complete so the parent can re-fetch */
  onActionSuccess: () => void;
  className?: string;
}

function formatCalledTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function elapsedMins(isoString: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
  );
}

export function RoomAssignPanel({
  rooms,
  recentAssignments,
  onActionSuccess,
  className = "",
}: RoomAssignPanelProps) {
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const [loadingVisitId, setLoadingVisitId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleAssign = async (roomId: string) => {
    setLoadingRoomId(roomId);
    setAlert(null);
    try {
      const res = await assignRoomAction(roomId);
      if (res.success) {
        setAlert({
          type: "success",
          message: `Ticket #${res.ticketNumber} — ${res.patientName} assigned to ${res.roomName}.`,
        });
        onActionSuccess();
      } else {
        setAlert({ type: "error", message: res.error ?? "Assignment failed." });
      }
    } catch {
      setAlert({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoadingRoomId(null);
    }
  };

  const handleComplete = async (visitId: string) => {
    setLoadingVisitId(visitId);
    setAlert(null);
    try {
      const res = await completeVisitAction(visitId);
      if (res.success) {
        setAlert({
          type: "success",
          message: `Consultation in ${res.roomName} marked complete. Room is now free.`,
        });
        onActionSuccess();
      } else {
        setAlert({ type: "error", message: res.error ?? "Could not complete visit." });
      }
    } catch {
      setAlert({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoadingVisitId(null);
    }
  };

  const isAnyActionRunning = loadingRoomId !== null || loadingVisitId !== null;

  return (
    <div
      className={`bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm overflow-hidden ${className}`}
    >
      <div className="p-4 space-y-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary-navy">
          Assign to Available Room
        </h3>

        {alert && (
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onDismiss={() => setAlert(null)}
          />
        )}

        {rooms.length === 0 ? (
          <p className="text-xs text-neutral-slate-500 py-2">
            No rooms configured for this zone.
          </p>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => {
              const isFree = room.status === "FREE";
              const isAssigning = loadingRoomId === room.id;
              const isCompleting =
                !isFree &&
                room.activeVisit != null &&
                loadingVisitId === room.activeVisit.id;

              return (
                <div
                  key={room.id}
                  className={`px-3 py-2.5 rounded-md border bg-white flex items-center justify-between gap-2 ${
                    isFree
                      ? "border-neutral-slate-200"
                      : "border-status-in-consultation-border bg-[#F8FAFF]"
                  }`}
                >
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-primary-navy leading-tight">
                      {room.name}
                    </h4>
                    {!isFree && room.activeVisit ? (
                      <p className="text-[11px] text-primary-navy/70 truncate">
                        <span className="font-semibold">
                          #{room.activeVisit.ticketNumber}
                        </span>{" "}
                        {room.activeVisit.patientName} ·{" "}
                        <span className="text-status-in-consultation-text">
                          {elapsedMins(room.activeVisit.calledTime)} min in
                        </span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-neutral-slate-400">
                        Room {room.roomNumber}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={isFree ? "available" : "busy"}
                      size="sm"
                      showDefaultIcon={false}
                    />

                    {isFree ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAssign(room.id)}
                        isLoading={isAssigning}
                        disabled={isAnyActionRunning}
                        className="uppercase tracking-wide font-semibold"
                        aria-label={`Assign next patient to ${room.name}`}
                      >
                        Assign
                      </Button>
                    ) : room.activeVisit ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleComplete(room.activeVisit!.id)}
                        isLoading={isCompleting}
                        disabled={isAnyActionRunning}
                        icon={
                          !isCompleting ? (
                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                          ) : undefined
                        }
                        className="text-status-seen-text border-status-seen-text/40 hover:bg-[#ECFDF5]"
                        aria-label={`Complete consultation in ${room.name}`}
                      >
                        Complete
                      </Button>
                    ) : (
                      <span className="text-sm text-neutral-slate-400 px-3">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Assignments */}
      <div className="border-t border-neutral-slate-200 px-4 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary-navy">
            Recent Assignments
          </h3>
        </div>

        {recentAssignments.length === 0 ? (
          <p className="text-[11px] text-neutral-slate-400 py-1">
            No assignments recorded yet today.
          </p>
        ) : (
          <div className="space-y-2">
            {recentAssignments.map((assignment, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 text-[11px] text-primary-navy"
              >
                <Clock
                  className="w-3 h-3 text-neutral-slate-400 shrink-0"
                  strokeWidth={1.75}
                />
                <span className="w-[60px] shrink-0 text-neutral-slate-500">
                  {formatCalledTime(assignment.calledTime)}
                </span>
                <span className="font-bold shrink-0">
                  #{assignment.ticketNumber}
                </span>
                <span className="font-semibold truncate uppercase">
                  {assignment.patientName}
                </span>
                <ArrowRight className="w-3 h-3 text-neutral-slate-400 shrink-0" />
                <span className="truncate text-neutral-slate-600">
                  {assignment.roomName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
