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
  userName: fallbackName = "R. Moyo",
  userRole: fallbackRole = "Receptionist",
  userInitials: fallbackInitials = "RM",
  isOnline = true,
  clinicName = "MABVUKU POLYCLINIC",
  subtitle = "Outpatient Queue Management",
}: HeaderBarProps) {
  const { data: session } = useSession();
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeName = session?.user?.name || fallbackName;
  const activeRole = session?.user?.role || fallbackRole;

  const activeInitials = activeName
    ? activeName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : fallbackInitials;

  useEffect(() => {
    setCurrentDateTime(new Date());
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="w-full bg-[#0B2D6B] text-white h-16 px-4 sm:px-6 flex items-center justify-between border-b border-[#1E4DB7]/40 shadow-md shrink-0 select-none relative z-50">
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

        {/* User Role Profile Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 pl-2 border-l border-[#1E4DB7]/50 focus:outline-none cursor-pointer rounded py-1 hover:bg-[#1E4DB7]/30 transition-colors"
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
          >
            <div
              className="w-8 h-8 rounded-full bg-[#1E4DB7] text-white flex items-center justify-center text-xs font-bold border border-[#93C5FD]/40 shrink-0"
              aria-hidden="true"
            >
              {activeInitials}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">
                {activeName}
              </span>
              <span className="text-[10px] text-[#93C5FD] leading-tight">
                {activeRole}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#CBD5E1]" aria-hidden="true" />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-[#E2E8F0] shadow-xl py-2 text-[#0F172A] text-xs">
              <div className="px-3.5 py-2 border-b border-[#F1F5F9] bg-[#F8FAFC]">
                <p className="font-bold text-sm text-[#0B2D6B] truncate">{activeName}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[#64748B]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    Role: {activeRole}
                  </span>
                </div>
              </div>

              <div className="p-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-medium text-[#DC2626] hover:bg-[#FEF2F2] rounded transition-colors cursor-pointer"
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
