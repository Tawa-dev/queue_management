"use client";

import React, { use } from "react";
import { DisplayLayout } from "@/components/layout";
import { Volume2 } from "lucide-react";

interface DisplayZonePageProps {
  params: Promise<{
    zone: string;
  }>;
}

export default function DisplayZonePage({ params }: DisplayZonePageProps) {
  const resolvedParams = use(params);
  const zoneKey = resolvedParams.zone || "zone-a";
  const formattedZoneTitle =
    zoneKey.toLowerCase() === "zone-b"
      ? "MATERNAL & CHILD HEALTH (ZONE B)"
      : "CONSULT ZONE A";

  const queueItems = [
    {
      number: "23",
      status: "NOW SERVING",
      room: "CONSULT ROOM 1",
      isServing: true,
    },
    {
      number: "24",
      status: "WAITING",
      room: "",
      isServing: false,
    },
    {
      number: "25",
      status: "WAITING",
      room: "",
      isServing: false,
    },
    {
      number: "26",
      status: "WAITING",
      room: "",
      isServing: false,
    },
    {
      number: "27",
      status: "WAITING",
      room: "",
      isServing: false,
    },
  ];

  return (
    <DisplayLayout
      zoneName={formattedZoneTitle}
      subNotice="Please listen for your number"
      footerMessage="Thank you for your patience. We will attend to you shortly."
    >
      <div className="w-full h-full flex flex-col justify-between">
        {/* Large Format TV Queue Table */}
        <div className="w-full border-2 border-[#0B2D6B] rounded-lg overflow-hidden shadow-md flex-1 flex flex-col bg-white">
          {/* Table Header Bar */}
          <div className="bg-[#0B2D6B] text-white grid grid-cols-12 px-8 py-4 font-extrabold text-xl lg:text-2xl uppercase tracking-wider shrink-0 select-none">
            <div className="col-span-3">QUEUE NO.</div>
            <div className="col-span-5 text-center">STATUS</div>
            <div className="col-span-4 text-right">ROOM</div>
          </div>

          {/* Queue Rows */}
          <div className="divide-y-2 divide-[#E2E8F0] flex-1 flex flex-col justify-around">
            {queueItems.map((item) => (
              <div
                key={item.number}
                className={`grid grid-cols-12 items-center px-8 py-4 lg:py-6 transition-colors ${
                  item.isServing
                    ? "bg-[#FFF4E5]/40"
                    : "bg-white hover:bg-[#F8FAFC]"
                }`}
              >
                {/* 1. Queue Sequence Number */}
                <div className="col-span-3">
                  <span
                    className={`text-5xl lg:text-7xl font-black tracking-tight ${
                      item.isServing ? "text-[#F97316]" : "text-[#0B2D6B]"
                    }`}
                  >
                    {item.number}
                  </span>
                </div>

                {/* 2. Status / Audio Announcement Cue */}
                <div className="col-span-5 flex items-center justify-center gap-3">
                  <span
                    className={`text-2xl lg:text-4xl font-extrabold uppercase tracking-wide ${
                      item.isServing ? "text-[#F97316]" : "text-[#0B2D6B]"
                    }`}
                  >
                    {item.status}
                  </span>
                  {item.isServing && (
                    <Volume2
                      className="w-8 h-8 lg:w-10 lg:h-10 text-[#F97316] animate-pulse shrink-0"
                      aria-label="Voice Announcement Active"
                    />
                  )}
                </div>

                {/* 3. Assigned Room */}
                <div className="col-span-4 text-right">
                  {item.room ? (
                    <span className="text-2xl lg:text-4xl font-black text-[#0B2D6B] uppercase tracking-wide">
                      {item.room}
                    </span>
                  ) : (
                    <span className="text-xl text-[#94A3B8] font-medium">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DisplayLayout>
  );
}
