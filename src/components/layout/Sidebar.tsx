"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  LayoutGrid,
  UsersRound,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: "main" | "admin";
}

const NAV_ITEMS: NavItem[] = [
  { name: "Queue", href: "/queue", icon: Users, section: "main" },
  { name: "Rooms", href: "/rooms", icon: LayoutGrid, section: "main" },
  { name: "Patients", href: "/patients", icon: UsersRound, section: "admin" },
  { name: "Reports", href: "/reports", icon: BarChart3, section: "admin" },
  { name: "Settings", href: "/settings", icon: Settings, section: "admin" },
];

export interface SidebarProps {
  queueId?: string;
  version?: string;
  className?: string;
}

export function Sidebar({
  queueId = "MPOLY-22AUG-001",
  version = "1.0.0",
  className = "",
}: SidebarProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/queue" && (pathname === "/" || pathname === "/queue")) {
      return true;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`w-56 sm:w-60 bg-white border-r border-[#E2E8F0] flex flex-col justify-between shrink-0 select-none ${className}`}
      aria-label="Sidebar navigation"
    >
      {/* Top: Nav Links */}
      <div className="p-3 sm:p-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-[#EFF6FF] text-[#0B2D6B] font-semibold border border-[#93C5FD]/40 shadow-xs"
                  : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  active ? "text-[#0B2D6B]" : "text-[#64748B]"
                }`}
                aria-hidden="true"
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom: Clinic Help & App Metadata */}
      <div className="p-4 border-t border-[#F1F5F9] flex flex-col gap-2">
        <button
          type="button"
          className="flex items-center gap-2 text-xs font-medium text-[#1E4DB7] hover:text-[#0B2D6B] transition-colors cursor-pointer text-left"
        >
          <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Need help?</span>
        </button>

        <div className="mt-2 flex flex-col text-[11px] text-[#94A3B8] font-mono leading-relaxed">
          <span>Queue ID: {queueId}</span>
          <span>Version: {version}</span>
        </div>
      </div>
    </aside>
  );
}
