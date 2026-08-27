import React from "react";
import { HeaderBar } from "./HeaderBar";
import { Sidebar } from "./Sidebar";
import { Info } from "lucide-react";

export interface WorkstationLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
  footerNote?: string;
}

export function WorkstationLayout({
  children,
  userName = "R. Moyo",
  userRole = "Receptionist",
  footerNote = "Please check patient details before assigning to a room.",
}: WorkstationLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Clinic Header Bar */}
      <HeaderBar userName={userName} userRole={userRole} />

      {/* Main Workstation Body: Sidebar + Dynamic Canvas */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col">
            {children}
          </div>

          {/* Operational Footer Note */}
          {footerNote && (
            <footer className="mt-8 pt-4 border-t border-[#E2E8F0] flex items-center gap-2 text-xs text-[#64748B] select-none">
              <Info className="w-4 h-4 text-[#94A3B8] shrink-0" aria-hidden="true" />
              <span>{footerNote}</span>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
