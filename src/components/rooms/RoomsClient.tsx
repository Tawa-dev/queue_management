"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DoorOpen,
  RefreshCw,
  CheckCircle2,
  Clock,
  Hourglass,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button, Badge, AlertBanner } from "@/components/ui";
import { getRoomsAction, RoomItem, RecentAssignment } from "@/server/actions/getRooms";
import { assignRoomAction } from "@/server/actions/assignRoom";
import { completeVisitAction } from "@/server/actions/completeVisit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function elapsedClass(mins: number): string {
  if (mins >= 30) return "text-status-urgent-text font-bold";
  if (mins >= 20) return "text-[#EA580C] font-semibold";
  return "text-status-in-consultation-text font-semibold";
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface RoomsClientProps {
  initialRooms: RoomItem[];
  initialRecentAssignments: RecentAssignment[];
  initialLastUpdated: string;
}

// ---------------------------------------------------------------------------
// Client component
// ---------------------------------------------------------------------------
export function RoomsClient({
  initialRooms,
  initialRecentAssignments,
  initialLastUpdated,
}: RoomsClientProps) {
  const { data: session } = useSession();
  const canAssign = session?.user?.role !== "RECEPTIONIST";

  const [rooms, setRooms] = useState<RoomItem[]>(initialRooms);
  const [recentAssignments, setRecentAssignments] = useState<RecentAssignment[]>(
    initialRecentAssignments
  );
  // Initial data is from the server — no loading skeleton on first render
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(initialLastUpdated);

  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const [loadingVisitId, setLoadingVisitId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await getRoomsAction();
      if (res.success) {
        setRooms(res.rooms);
        setRecentAssignments(res.recentAssignments);
        setLastUpdated(
          new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
        );
      }
    } catch (err) {
      console.error("Failed to fetch room data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll every 10 s — skip the immediate fetch since server gave us initial data
  useEffect(() => {
    const intervalId = setInterval(fetchRooms, 10000);
    return () => clearInterval(intervalId);
  }, [fetchRooms]);

  const isAnyActionRunning = loadingRoomId !== null || loadingVisitId !== null;

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
        await fetchRooms();
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
        await fetchRooms();
      } else {
        setAlert({ type: "error", message: res.error ?? "Could not complete visit." });
      }
    } catch {
      setAlert({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoadingVisitId(null);
    }
  };

  const freeCount = rooms.filter((r) => r.status === "FREE").length;
  const occupiedCount = rooms.filter((r) => r.status === "OCCUPIED").length;

  return (
    <div className="space-y-4 pb-6">
      <h1 className="sr-only">Rooms — Mabvuku Polyclinic</h1>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold text-primary-navy leading-tight">
            Consultation Rooms
          </h2>
          <p className="text-[13px] text-neutral-slate-500 mt-0.5">
            Assign waiting patients to available rooms and mark consultations complete.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#ECFDF5] text-[#16A34A] border border-[#86EFAC]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              {freeCount} Free
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FDBA74]/40">
              <Clock className="w-3 h-3" />
              {occupiedCount} Occupied
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={fetchRooms}
            disabled={isLoading}
            aria-label="Refresh room status"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Live indicator */}
      <div
        className="flex items-center gap-1.5 text-[11px] text-neutral-slate-500"
        role="status"
        aria-live="polite"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-status-seen-text" />
        <span>Live · {lastUpdated}</span>
      </div>

      {/* Alert banner */}
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onDismiss={() => setAlert(null)}
        />
      )}

      {/* Role notice — from JWT, instant, no server round-trip */}
      {!canAssign && (
        <div className="flex items-center gap-1.5 rounded-md bg-[#FFF7ED] border border-[#FDBA74]/50 px-3 py-2 text-[12px] text-[#92400E]">
          <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            Room assignment is restricted to Doctor and Admin roles. You can view room
            status but cannot assign patients.
          </span>
        </div>
      )}

      {/* Room grid */}
      {rooms.length === 0 ? (
        <RoomsEmptyState />
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          aria-label="Room status grid"
        >
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              isAssigning={loadingRoomId === room.id}
              isCompleting={
                room.activeVisit != null && loadingVisitId === room.activeVisit.id
              }
              isAnyActionRunning={isAnyActionRunning}
              canAssign={canAssign}
              onAssign={handleAssign}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}

      {/* Recent assignments table */}
      {recentAssignments.length > 0 && (
        <section aria-labelledby="recent-assignments-heading">
          <div className="bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-slate-200">
              <h3
                id="recent-assignments-heading"
                className="text-[13px] font-bold text-primary-navy uppercase tracking-[0.06em]"
              >
                Today&apos;s Assignment History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="text-primary-navy text-[11px] uppercase font-semibold tracking-wider border-b border-neutral-slate-200">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Time</th>
                    <th scope="col" className="px-4 py-2.5">Ticket</th>
                    <th scope="col" className="px-4 py-2.5">Patient</th>
                    <th scope="col" className="px-4 py-2.5">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-slate-200 text-primary-navy">
                  {recentAssignments.map((a, idx) => (
                    <tr key={idx} className="bg-white hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-neutral-slate-500 whitespace-nowrap">
                        {formatTime(a.calledTime)}
                      </td>
                      <td className="px-4 py-3 font-bold">#{a.ticketNumber}</td>
                      <td className="px-4 py-3 font-semibold uppercase">{a.patientName}</td>
                      <td className="px-4 py-3 text-neutral-slate-600">{a.roomName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Room Card
// ---------------------------------------------------------------------------
interface RoomCardProps {
  room: RoomItem;
  isAssigning: boolean;
  isCompleting: boolean;
  isAnyActionRunning: boolean;
  canAssign: boolean;
  onAssign: (roomId: string) => void;
  onComplete: (visitId: string) => void;
}

function RoomCard({
  room,
  isAssigning,
  isCompleting,
  isAnyActionRunning,
  canAssign,
  onAssign,
  onComplete,
}: RoomCardProps) {
  const isFree = room.status === "FREE";
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const inRoomMins =
    room.activeVisit && now
      ? Math.max(
          0,
          Math.floor(
            (now.getTime() - new Date(room.activeVisit.calledTime).getTime()) / 60000
          )
        )
      : 0;

  return (
    <article
      className={`rounded-lg border p-4 flex flex-col gap-3 ${
        isFree ? "bg-white border-neutral-slate-200" : "bg-[#F8FAFF] border-[#BFDBFE]"
      }`}
      aria-label={`${room.name} — ${isFree ? "Available" : "Occupied"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <DoorOpen
              className={`w-4 h-4 shrink-0 ${isFree ? "text-[#16A34A]" : "text-[#1D4ED8]"}`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <h3 className="text-[14px] font-bold text-primary-navy leading-tight truncate">
              {room.name}
            </h3>
          </div>
          <p className="text-[11px] text-neutral-slate-400 mt-0.5 pl-6">
            Room {room.roomNumber}
          </p>
        </div>
        <Badge variant={isFree ? "available" : "busy"} size="sm" showDefaultIcon={false} />
      </div>

      <div className="flex-1 min-h-[52px]">
        {!isFree && room.activeVisit ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-extrabold text-primary-blue leading-none">
                #{room.activeVisit.ticketNumber}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-primary-navy uppercase truncate">
                  {room.activeVisit.patientName}
                </p>
                <p className="text-[11px] text-neutral-slate-500 truncate">
                  {room.activeVisit.reason}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[12px]">
              <Clock
                className="w-3.5 h-3.5 text-neutral-slate-400 shrink-0"
                strokeWidth={1.75}
              />
              <span className="text-neutral-slate-500">In room</span>
              <span className={elapsedClass(inRoomMins)}>{inRoomMins} min</span>
              {inRoomMins >= 30 && (
                <AlertTriangle
                  className="w-3.5 h-3.5 text-status-urgent-text"
                  aria-label="Consultation over 30 minutes"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 h-full">
            <Hourglass
              className="w-4 h-4 text-[#16A34A] shrink-0"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <p className="text-[12px] text-[#16A34A] font-medium">Ready for next patient</p>
          </div>
        )}
      </div>

      <div>
        {isFree ? (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => onAssign(room.id)}
            isLoading={isAssigning}
            disabled={isAnyActionRunning || !canAssign}
            className="uppercase tracking-wide font-semibold"
            aria-label={
              canAssign
                ? `Assign next patient to ${room.name}`
                : "Room assignment requires Doctor or Admin role"
            }
            title={!canAssign ? "Requires Doctor or Admin role" : undefined}
          >
            Assign Next Patient
          </Button>
        ) : room.activeVisit ? (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => onComplete(room.activeVisit!.id)}
            isLoading={isCompleting}
            disabled={isAnyActionRunning}
            icon={
              !isCompleting ? (
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
              ) : undefined
            }
            className="text-status-seen-text border-status-seen-text/40 hover:bg-[#ECFDF5]"
            aria-label={`Mark consultation in ${room.name} as complete`}
          >
            Mark Complete
          </Button>
        ) : null}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function RoomsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-neutral-slate-100 flex items-center justify-center">
        <DoorOpen className="w-6 h-6 text-neutral-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-bold text-neutral-slate-700">No rooms configured</h3>
      <p className="text-xs text-neutral-slate-500 max-w-xs">
        No consultation rooms have been set up for this zone yet. Contact an administrator
        to add rooms.
      </p>
    </div>
  );
}
