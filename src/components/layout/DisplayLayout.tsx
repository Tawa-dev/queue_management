"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Users } from "lucide-react";
import { LiveClock } from "@/components/ui/LiveClock";

export interface DisplayLayoutProps {
  zoneName?: string;
  subNotice?: string;
  footerMessage?: string;
  children: React.ReactNode;
}

export function DisplayLayout({
  zoneName = "CONSULT ZONE A",
  subNotice = "Please listen for your number",
  footerMessage = "Thank you for your patience. We will attend to you shortly.",
  children,
}: DisplayLayoutProps) {
  // Lazy initializer reads navigator.onLine synchronously on the client —
  // avoids calling setState inside the effect body (lint rule violation).
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // Track real network status for the offline banner
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F172A] select-none font-sans">
      {/* 1. TV Top Header Bar */}
      <header className="bg-[#0B2D6B] text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 shadow-lg shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <Image
              src="/images/harare-crest.svg"
              alt="City of Harare Crest"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-wide text-white leading-none truncate">
              MABVUKU POLYCLINIC
            </h1>
            <p className="hidden sm:block text-sm lg:text-base text-[#93C5FD] font-medium mt-1 leading-none">
              Outpatient Service
            </p>
          </div>
        </div>

        {/* Live Clock & Date */}
          <LiveClock variant="display" />
      </header>

      {/* 2. Zone Title Banner */}
      <div className="bg-[#E9F0FF] border-b-2 border-[#1E4DB7] px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 shadow-xs shrink-0">
        <h2 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-[#0B2D6B] tracking-wider uppercase">
          {zoneName}
        </h2>
        <span className="text-sm sm:text-base lg:text-xl font-semibold text-[#1E4DB7] tracking-wide">
          {subNotice}
        </span>
      </div>

      {/* 3. Main Live Queue Display Content */}
      <main className="flex-1 flex flex-col p-3 sm:p-6 lg:p-8 bg-white">
        {children}
      </main>

      {/* 4. High-Visibility TV Footer Banner */}
      <footer
        className={`px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg lg:text-xl text-center font-medium shadow-inner shrink-0 transition-colors ${
          isOnline ? "bg-[#0B2D6B] text-white" : "bg-amber-600 text-white"
        }`}
        role="status"
        aria-live="polite"
      >
        {isOnline ? (
          <>
            <Users className="w-5 h-5 sm:w-7 sm:h-7 text-[#93C5FD] shrink-0" aria-hidden="true" />
            <span>{footerMessage}</span>
          </>
        ) : (
          <>
            <span className="text-2xl" aria-hidden="true">⚠</span>
            <span>Offline — showing last known queue state</span>
          </>
        )}
      </footer>
    </div>
  );
}
