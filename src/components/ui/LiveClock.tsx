"use client";

import React, { memo, useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";

interface LiveClockProps {
  /** Visual variant — "header" for the dark staff header, "display" for the TV board */
  variant: "header" | "display";
}

/**
 * Isolated clock component — only this component re-renders every second.
 * Keeping the ticking state here prevents HeaderBar and DisplayLayout from
 * re-rendering their entire subtrees on every tick.
 */
export const LiveClock = memo(function LiveClock({ variant }: LiveClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (variant === "header") {
    const formattedDate = now
      ? now.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Loading...";

    const formattedTime = now
      ? now.toLocaleTimeString("en-GB", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "";

    return (
      <div className="hidden md:flex items-center justify-center gap-8 px-4">
        <div className="flex items-center gap-2 text-[13px] text-white">
          <Calendar className="w-4 h-4 text-white" strokeWidth={1.75} aria-hidden="true" />
          <span className="font-medium whitespace-nowrap">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-white">
          <Clock className="w-4 h-4 text-white" strokeWidth={1.75} aria-hidden="true" />
          <span className="font-medium tracking-wide whitespace-nowrap">{formattedTime}</span>
        </div>
      </div>
    );
  }

  // variant === "display"
  const formattedDate = now
    ? now.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Loading...";

  const formattedTime = now
    ? now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  return (
    <div className="flex items-center gap-6 text-lg lg:text-xl font-semibold">
      <div className="flex items-center gap-2 text-white">
        <Clock className="w-6 h-6 text-[#93C5FD]" aria-hidden="true" />
        <span>{formattedTime}</span>
      </div>
      <div className="h-6 w-px bg-[#1E4DB7]" aria-hidden="true" />
      <div className="flex items-center gap-2 text-[#CBD5E1]">
        <Calendar className="w-6 h-6 text-[#93C5FD]" aria-hidden="true" />
        <span>{formattedDate}</span>
      </div>
    </div>
  );
});
