"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Clock, Calendar, Users } from "lucide-react";

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
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setCurrentDateTime(new Date());
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track real network status for the offline banner
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    // Set initial value (navigator.onLine is synchronous)
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const formattedDate = currentDateTime
    ? currentDateTime.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Friday, 22 Aug 2026";

  const formattedTime = currentDateTime
    ? currentDateTime.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "10:24 AM";

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F172A] select-none font-sans overflow-hidden">
      {/* 1. TV Top Header Bar */}
      <header className="bg-[#0B2D6B] text-white px-8 py-4 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-4">
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
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-wide text-white leading-none">
              MABVUKU POLYCLINIC
            </h1>
            <p className="text-sm lg:text-base text-[#93C5FD] font-medium mt-1 leading-none">
              Outpatient Service
            </p>
          </div>
        </div>

        {/* Live Clock & Date */}
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
      </header>

      {/* 2. Zone Title Banner */}
      <div className="bg-[#E9F0FF] border-b-2 border-[#1E4DB7] px-8 py-3.5 flex items-center justify-between shadow-xs shrink-0">
        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#0B2D6B] tracking-wider uppercase">
          {zoneName}
        </h2>
        <span className="text-base lg:text-xl font-semibold text-[#1E4DB7] tracking-wide">
          {subNotice}
        </span>
      </div>

      {/* 3. Main Live Queue Display Content */}
      <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-hidden bg-white">
        {children}
      </main>

      {/* 4. High-Visibility TV Footer Banner */}
      <footer
        className={`px-8 py-4 flex items-center justify-center gap-3 text-lg lg:text-xl font-medium shadow-inner shrink-0 transition-colors ${
          isOnline ? "bg-[#0B2D6B] text-white" : "bg-amber-600 text-white"
        }`}
        role="status"
        aria-live="polite"
      >
        {isOnline ? (
          <>
            <Users className="w-7 h-7 text-[#93C5FD]" aria-hidden="true" />
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
