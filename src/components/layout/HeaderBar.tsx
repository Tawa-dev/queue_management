"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Calendar, Clock, ChevronDown, LogOut, ShieldCheck } from "lucide-react";

export interface HeaderBarProps {
  userName?: string;
  userRole?: string;
  userInitials?: string;
  isOnline?: boolean;
  clinicName?: string;
  subtitle?: string;
}

export function HeaderBar({
  userName: fallbackName = "Staff Member",
  userRole: fallbackRole = "Staff",
  userInitials: fallbackInitials = "ST",
  clinicName = "MABVUKU POLYCLINIC",
  subtitle = "Outpatient Queue Management",
}: HeaderBarProps) {
  const { data: session } = useSession();
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeName = session?.user?.name || fallbackName;
  const rawRole = session?.user?.role || fallbackRole;
  const activeRole =
    rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();

  const activeInitials = activeName
    ? activeName
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : fallbackInitials;

  useEffect(() => {
    const tick = () => setCurrentDateTime(new Date());
    const timeoutId = setTimeout(tick, 0);
    const intervalId = setInterval(tick, 1000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  // Real network status — replaces the static isOnline prop
  useEffect(() => {
    const up   = () => setNetworkOnline(true);
    const down = () => setNetworkOnline(false);
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    setNetworkOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online",  up);
      window.removeEventListener("offline", down);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedDate = currentDateTime
    ? currentDateTime.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Loading...";

  const formattedTime = currentDateTime
    ? currentDateTime.toLocaleTimeString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "10:00 AM";

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="w-full bg-header-navy text-white h-[88px] px-5 sm:px-6 grid grid-cols-[1fr_auto_1fr] items-center shadow-clinic-sm shrink-0 select-none relative z-50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
          <Image
            src="/images/harare-crest.svg"
            alt="City of Harare Official Crest"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm sm:text-[15px] font-bold tracking-[0.04em] leading-tight text-white truncate">
            {clinicName}
          </span>
          <span className="text-[12px] text-white/90 font-normal mt-0.5 leading-tight truncate">
            {subtitle}
          </span>
        </div>
      </div>

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

      <div className="flex items-center justify-end gap-4 sm:gap-5">
        <div className="hidden sm:flex items-center gap-2 text-[13px] text-white">
          <span
            className={`w-2 h-2 rounded-full ${
              networkOnline ? "bg-[#22C55E]" : "bg-[#EF4444]"
            }`}
            aria-hidden="true"
          />
          <span className="font-medium whitespace-nowrap">
            {networkOnline ? "System Online" : "Offline (Cached)"}
          </span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded py-1 cursor-pointer"
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <div
              className="w-9 h-9 rounded-full bg-primary-blue text-white flex items-center justify-center text-xs font-bold shrink-0"
              aria-hidden="true"
            >
              {activeInitials}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-[13px] font-semibold text-white leading-tight">
                {activeName}
              </span>
              <span className="text-[11px] text-white/80 leading-tight">
                {activeRole}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-white" strokeWidth={1.75} aria-hidden="true" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-lg py-2 text-neutral-slate-900 text-xs">
              <div className="px-3.5 py-2 border-b border-neutral-slate-100 bg-neutral-slate-50">
                <p className="font-bold text-sm text-primary-navy truncate">{activeName}</p>
                <div className="flex items-center gap-1.5 mt-1 text-neutral-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-status-seen-text" />
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    Role: {activeRole}
                  </span>
                </div>
              </div>

              <div className="p-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-medium text-status-urgent-text hover:bg-status-urgent-bg rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Workstation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
