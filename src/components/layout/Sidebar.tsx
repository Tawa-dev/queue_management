"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Users,
  DoorOpen,
  UsersRound,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  section?: "main" | "admin";
}

const NAV_ITEMS: NavItem[] = [
  { name: "Queue", href: "/queue", icon: Users, section: "main" },
  { name: "Rooms", href: "/rooms", icon: DoorOpen, section: "main" },
  { name: "Patients", href: "/patients", icon: UsersRound, section: "admin" },
  { name: "Reports", href: "/reports", icon: BarChart3, section: "admin" },
  { name: "Settings", href: "/settings", icon: Settings, section: "admin" },
];

export interface SidebarProps {
  queueId?: string;
  version?: string;
  className?: string;
  isMobileOpen?: boolean;
  onMobileNavigate?: () => void;
}

export function Sidebar({
  queueId = "MPOLY-22AUG-001",
  version = "1.0.0",
  className = "",
  isMobileOpen = false,
  onMobileNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "ADMIN";
  const isReceptionist = session?.user?.role === "RECEPTIONIST";

  const visibleItems = NAV_ITEMS.filter((item) => {
    // Admin section — only admins see Patients, Reports, Settings
    if (item.section === "admin" && !isAdmin) return false;
    // Rooms — receptionists have no access, hide it rather than show a broken link
    if (item.href === "/rooms" && isReceptionist) return false;
    return true;
  });

  const isItemActive = (href: string) => {
    if (href === "/queue" && (pathname === "/" || pathname === "/queue")) {
      return true;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[260px] pt-[72px] bg-canvas flex flex-col justify-between shrink-0 select-none shadow-clinic-lg transition-transform duration-200 md:static md:z-auto md:w-[200px] md:pt-0 md:translate-x-0 md:shadow-none ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } ${className}`}
      aria-label="Sidebar navigation"
    >
      <nav className="pt-3 px-3 flex flex-col gap-1" aria-label="Workstation">
        {visibleItems.map((item) => {
          const active = isItemActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onMobileNavigate}
              className={`relative flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-md text-[14px] transition-colors duration-150 ${
                active
                  ? "bg-[#EDF1FA] text-primary-navy font-semibold"
                  : "text-primary-navy font-medium hover:bg-white/70"
              }`}
            >
              {active && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-primary-navy"
                  aria-hidden="true"
                />
              )}
              <Icon
                className="w-[18px] h-[18px] shrink-0 text-primary-navy"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-5 pt-3 flex flex-col gap-3">
        <button
          type="button"
          className="flex items-center gap-2 text-[13px] font-medium text-primary-blue hover:text-primary-navy transition-colors cursor-pointer text-left"
        >
          <HelpCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>Need help?</span>
        </button>

        <div className="flex flex-col text-[11px] text-neutral-slate-400 leading-relaxed">
          <span>Queue ID: {queueId}</span>
          <span>Version: {version}</span>
        </div>
      </div>
    </aside>
  );
}
