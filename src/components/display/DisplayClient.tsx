"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { DisplayLayout } from "@/components/layout";
import {
  getDisplayDataAction,
  type DisplayData,
} from "@/server/actions/getDisplay";

const POLL_INTERVAL_MS = 5_000;

export interface DisplayClientProps {
  zoneCode: string;
  initialData: DisplayData;
}

export function DisplayClient({ zoneCode, initialData }: DisplayClientProps) {
  // Lazy initializer: attempt to seed from localStorage on first render.
  // This avoids a post-mount setState (which the lint rule flags) while still
  // letting the offline cache override the SSR snapshot when fresher.
  const [data, setData] = useState<DisplayData>(() => {
    if (typeof window === "undefined") return initialData;
    try {
      const raw = localStorage.getItem(`display_cache_${zoneCode}`);
      if (raw) {
        const { data: cached, cachedAt } = JSON.parse(raw) as {
          data: DisplayData;
          cachedAt: number;
        };
        if (cachedAt > Date.now() - POLL_INTERVAL_MS * 2) {
          return cached;
        }
      }
    } catch {
      // Corrupt cache — ignore
    }
    return initialData;
  });

  // Track NOW SERVING tickets so we only announce each one once
  const prevServingTicketsRef = useRef<Set<string>>(new Set());

  const announce = useCallback((ticketNumber: string, roomName: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(
      new SpeechSynthesisUtterance(
        `Ticket ${ticketNumber}, please proceed to ${roomName}.`
      )
    );
  }, []);

  const poll = useCallback(async () => {
    try {
      const result = await getDisplayDataAction(zoneCode);
      if (!result.success) return;

      const currentServingTickets = new Set<string>(
        result.rooms
          .filter((r) => r.status === "OCCUPIED" && r.activeVisit)
          .map((r) => r.activeVisit!.ticketNumber)
      );

      result.rooms.forEach((room) => {
        if (
          room.status === "OCCUPIED" &&
          room.activeVisit &&
          !prevServingTicketsRef.current.has(room.activeVisit.ticketNumber)
        ) {
          announce(room.activeVisit.ticketNumber, room.name);
        }
      });

      prevServingTicketsRef.current = currentServingTickets;
      setData(result);

      try {
        localStorage.setItem(
          `display_cache_${zoneCode}`,
          JSON.stringify({ data: result, cachedAt: Date.now() })
        );
      } catch {
        // localStorage quota exceeded — swallow
      }
    } catch {
      // Network error — keep last good data on screen
    }
  }, [zoneCode, announce]);

  // If the server returned valid data, skip the immediate poll — the interval
  // will fire at the next 5s mark. If server data failed (zone not found, etc.)
  // poll immediately so the board tries to recover straight away.
  useEffect(() => {
    if (!initialData.success) void poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll, initialData.success]);

  const nowServing = data.rooms.filter(
    (r) => r.status === "OCCUPIED" && r.activeVisit
  );

  const displayZoneName = data.zoneName || zoneCode.toUpperCase();

  return (
    <DisplayLayout
      zoneName={displayZoneName}
      subNotice="Please listen for your number"
      footerMessage="Thank you for your patience. We will attend to you shortly."
    >
      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4 sm:gap-6">
        {/* ── NOW SERVING ──────────────────────────────────── */}
        <section aria-labelledby="now-serving-heading">
          <div className="bg-[#0B2D6B] text-white grid grid-cols-12 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 font-extrabold text-sm sm:text-xl lg:text-2xl uppercase tracking-wider rounded-t-lg select-none">
            <div
              id="now-serving-heading"
              className="col-span-4 flex items-center gap-2 sm:gap-3"
            >
              NOW SERVING
              {nowServing.length > 0 && (
                <Volume2
                  className="w-6 h-6 text-[#93C5FD] animate-pulse"
                  aria-label="Voice announcements active"
                />
              )}
            </div>
            <div className="col-span-4 text-center">PATIENT</div>
            <div className="col-span-4 text-right">ROOM</div>
          </div>

          <div className="border-2 border-t-0 border-[#0B2D6B] rounded-b-lg overflow-hidden divide-y-2 divide-[#E2E8F0]">
            {nowServing.length === 0 ? (
              <p className="px-8 py-6 text-[#94A3B8] text-xl italic">
                No patients currently being served.
              </p>
            ) : (
              nowServing.map((room) => (
                <div
                  key={room.id}
                  className="grid grid-cols-12 items-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 bg-[#FFF4E5]/40"
                >
                  <div className="col-span-4">
                    <span className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight text-[#F97316]">
                      {room.activeVisit!.ticketNumber}
                    </span>
                  </div>
                  <div className="col-span-4 flex justify-center">
                    <span className="text-sm sm:text-2xl lg:text-3xl font-semibold text-[#0B2D6B] truncate max-w-xs">
                      {room.activeVisit!.patientName}
                    </span>
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="text-sm sm:text-2xl lg:text-4xl font-black text-[#0B2D6B] uppercase tracking-wide">
                      {room.name}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── WAITING ──────────────────────────────────────── */}
        <section aria-labelledby="waiting-heading">
          <div className="bg-[#1E4DB7] text-white grid grid-cols-12 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 font-extrabold text-sm sm:text-xl lg:text-2xl uppercase tracking-wider rounded-t-lg select-none">
            <div id="waiting-heading" className="col-span-3">
              QUEUE NO.
            </div>
            <div className="col-span-5 text-center">PATIENT</div>
            <div className="col-span-4 text-right">STATUS</div>
          </div>

          <div className="border-2 border-t-0 border-[#1E4DB7] rounded-b-lg overflow-hidden divide-y-2 divide-[#E2E8F0]">
            {data.queue.length === 0 ? (
              <p className="px-8 py-6 text-[#94A3B8] text-xl italic">
                No patients waiting.
              </p>
            ) : (
              data.queue.map((item) => (
                <div
                  key={item.ticketNumber}
                  className="grid grid-cols-12 items-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 bg-white hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="col-span-3">
                    <span className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0B2D6B]">
                      {item.ticketNumber}
                    </span>
                  </div>
                  <div className="col-span-5 flex items-center justify-center gap-1 sm:gap-3 min-w-0">
                    <span className="text-sm sm:text-2xl lg:text-3xl font-semibold text-[#0B2D6B] truncate max-w-xs">
                      {item.patientName}
                    </span>
                    {item.isUrgent && (
                      <span className="hidden sm:inline shrink-0 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700 uppercase tracking-wide">
                        URGENT
                      </span>
                    )}
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="text-xs sm:text-xl lg:text-2xl font-semibold text-[#64748B] uppercase tracking-wide">
                      WAITING
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </DisplayLayout>
  );
}
