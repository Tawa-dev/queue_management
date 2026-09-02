import React from "react";
import { HeaderBar } from "./HeaderBar";
import { Sidebar } from "./Sidebar";

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
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {/* Header — fixed height, never scrolls */}
      <HeaderBar userName={userName} userRole={userRole} />

      {/* Body — fills remaining height, sidebar + main side by side */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar — full body height, never scrolls */}
        <Sidebar />

        {/* Main content — only this area scrolls */}
        <main className="flex-1 flex flex-col overflow-y-auto px-4 pt-3 pb-4 sm:px-5">
          <div className="flex-1 w-full flex flex-col">{children}</div>

          {footerNote && (
            <footer className="mt-3 pt-2 text-[12px] text-neutral-slate-500 select-none">
              {footerNote}
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
