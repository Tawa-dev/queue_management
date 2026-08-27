"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Calendar, Clock, ChevronDown, User } from "lucide-react";

export interface HeaderBarProps {
  userName?: string;
  userRole?: string;
  userInitials?: string;
  isOnline?: boolean;
  clinicName?: string;
  subtitle?: string;
}

export function HeaderBar({
  userName = "R. Moyo",
  userRole = "Receptionist",
  userInitials = "RM",
  isOnline = true,
  clinicName = "MABVUKU POLYCLINIC",
  subtitle = "Outpatient Queue Management",
}: HeaderBarProps) {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDateTime(new Date());
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = currentDateTime
    ? currentDateTime.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Loading...";

  const formattedTime = currentDateTime
    ? currentDateTime.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "10:00:00 AM";

  return (
    <header className="w-full bg-[#0B2D6B] text-white h-16 px-4 sm:px-6 flex items-center justify-between border-b border-[#1E4DB7]/40 shadow-md shrink-0 select-none">
      {/* Left: Harare Crest Logo & Clinic Title */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
          <Image
            src="/images/harare-crest.svg"
            alt="City of Harare Official Crest"
            width={40}
            height={40}
            className="object-contain drop-shadow-sm"
            priority
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-bold tracking-wide leading-none text-white">
            {clinicName}
          </span>
          <span className="text-[11px] text-[#CBD5E1] tracking-normal font-normal mt-1 leading-none">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Right: Date, Time, Status, and User Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Live Date */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[#CBD5E1]">
          <Calendar className="w-4 h-4 text-[#93C5FD]" aria-hidden="true" />
          <span className="font-medium text-white">{formattedDate}</span>
        </div>

        {/* Live Time */}
        <div className="flex items-center gap-2 text-xs text-[#CBD5E1]">
          <Clock className="w-4 h-4 text-[#93C5FD]" aria-hidden="true" />
          <span className="font-semibold text-white tracking-wider">{formattedTime}</span>
        </div>

        {/* Connectivity Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#081F4D]/70 border border-[#1E4DB7]/50 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? "bg-[#22C55E] animate-pulse" : "bg-[#EF4444]"
            }`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-medium text-[#E2E8F0]">
            {isOnline ? "System Online" : "Offline (Cached)"}
          </span>
        </div>

        {/* User Role Profile Chip */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#1E4DB7]/50">
          <div
            className="w-8 h-8 rounded-full bg-[#1E4DB7] text-white flex items-center justify-center text-xs font-bold border border-[#93C5FD]/40"
            aria-hidden="true"
          >
            {userInitials}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-white leading-tight">
              {userName}
            </span>
            <span className="text-[10px] text-[#93C5FD] leading-tight">
              {userRole}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#CBD5E1]" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
