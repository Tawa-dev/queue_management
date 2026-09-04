"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { LiveClock } from "@/components/ui/LiveClock";

export interface HeaderBarProps {
  userName?: string;
  userRole?: string;
  userInitials?: string;
  isOnline?: boolean;
  clinicName?: string;
  subtitle?: string;
  isMobileNavigationOpen?: boolean;
  onMobileNavigationToggle?: () => void;
}

export function HeaderBar({
  clinicName = "MABVUKU POLYCLINIC",
  subtitle = "Outpatient Queue Management",
  isMobileNavigationOpen = false,
  onMobileNavigationToggle,
}: HeaderBarProps) {
  const { data: session, status } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only use session data once it has fully resolved — avoids the flash where
  // the previous user's name briefly appears while the new session loads.
  const sessionReady = status === "authenticated";
  const activeName     = sessionReady ? (session?.user?.name ?? "") : "";
  const rawRole        = sessionReady ? (session?.user?.role ?? "") : "";
  const activeRole     = rawRole
    ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()
    : "";
  const activeInitials = activeName
    ? activeName
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="w-full bg-header-navy text-white min-h-[72px] sm:h-[88px] px-3 sm:px-6 grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[1fr_auto_1fr] items-center gap-2 shadow-clinic-sm shrink-0 select-none relative z-50">
      <div className="flex items-center gap-3 min-w-0">
        {onMobileNavigationToggle && (
          <button
            type="button"
            onClick={onMobileNavigationToggle}
            className="md:hidden inline-flex w-11 h-11 items-center justify-center rounded text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label={isMobileNavigationOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileNavigationOpen}
          >
            {isMobileNavigationOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
        {/* Logo — smaller on mobile to give the clinic name more room */}
        <div className="relative w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
          <Image
            src="/images/harare-crest.svg"
            alt="City of Harare Official Crest"
            width={48}
            height={48}
            className="object-contain w-full h-full"
            priority
          />
        </div>
        <div className="flex flex-col min-w-0">
          {/* Clinic name — smaller + no letter-spacing on mobile so it never truncates */}
          <span className="text-[11px] sm:text-[14px] font-bold sm:tracking-[0.04em] leading-tight text-white truncate">
            {clinicName}
          </span>
          <span className="hidden sm:block text-[11px] text-white/90 font-normal mt-0.5 leading-tight truncate">
            {subtitle}
          </span>
        </div>
      </div>

      <div className="hidden sm:block"><LiveClock variant="header" /></div>

      <div className="flex items-center justify-end gap-2 sm:gap-5">
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
            disabled={!sessionReady}
          >
            <div
              className={`w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 ${
                sessionReady ? "bg-primary-blue" : "bg-white/20 animate-pulse"
              }`}
              aria-hidden="true"
            >
              {activeInitials}
            </div>
            <div className="hidden lg:flex flex-col text-left min-w-[80px]">
              {sessionReady ? (
                <>
                  <span className="text-[13px] font-semibold text-white leading-tight">
                    {activeName}
                  </span>
                  <span className="text-[11px] text-white/80 leading-tight">
                    {activeRole}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-3 w-20 bg-white/20 rounded animate-pulse" />
                  <span className="h-2.5 w-14 bg-white/20 rounded animate-pulse mt-1" />
                </>
              )}
            </div>
            <ChevronDown className="hidden sm:block w-4 h-4 text-white" strokeWidth={1.75} aria-hidden="true" />
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
