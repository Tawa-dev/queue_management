import React from "react";
import { Settings2, Users, DoorOpen, Layers, ShieldAlert } from "lucide-react";

// ---------------------------------------------------------------------------
// Settings stubs — cards describing what each section will contain
// ---------------------------------------------------------------------------
const SETTINGS_SECTIONS = [
  {
    id: "rooms",
    icon: DoorOpen,
    title: "Room Management",
    description:
      "Add, edit, or deactivate consultation rooms. Assign rooms to zones.",
    status: "Coming soon",
  },
  {
    id: "zones",
    icon: Layers,
    title: "Zone Management",
    description:
      "Create and configure clinic zones (Block A, Block B, etc.) for per-zone display boards.",
    status: "Coming soon",
  },
  {
    id: "users",
    icon: Users,
    title: "User Management",
    description:
      "Create and manage staff accounts. Assign roles (Receptionist, Doctor, Admin).",
    status: "Coming soon",
  },
  {
    id: "access",
    icon: ShieldAlert,
    title: "Access & Security",
    description:
      "Reset passwords and review role-based access permissions for each staff member.",
    status: "Coming soon",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-5 pb-6">
      <h1 className="sr-only">Settings — Mabvuku Polyclinic</h1>

      {/* Page header */}
      <div>
        <h2 className="text-[20px] font-semibold text-primary-navy leading-tight flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-neutral-slate-400" />
          Settings
        </h2>
        <p className="text-[13px] text-neutral-slate-500 mt-0.5">
          Clinic configuration — Admin only
        </p>
      </div>

      {/* Under construction notice */}
      <div className="flex items-start gap-3 rounded-lg bg-[#FFF4E5] border border-[#FDBA74]/50 px-4 py-3.5">
        <ShieldAlert
          className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <div>
          <p className="text-[13px] font-semibold text-[#92400E]">
            Settings are not yet configurable from this interface
          </p>
          <p className="text-[12px] text-[#92400E]/80 mt-0.5">
            Room and user management require a database change that is scheduled
            for the next build pass. Configuration currently requires direct
            database access or running the seed script.
          </p>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm p-5 flex items-start gap-4 opacity-70"
              aria-label={`${section.title} — ${section.status}`}
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-slate-100 flex items-center justify-center shrink-0">
                <Icon
                  className="w-5 h-5 text-neutral-slate-400"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-semibold text-primary-navy leading-tight">
                    {section.title}
                  </h3>
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide bg-neutral-slate-100 text-neutral-slate-500 px-2 py-0.5 rounded-full">
                    {section.status}
                  </span>
                </div>
                <p className="text-[12px] text-neutral-slate-500 mt-1 leading-relaxed">
                  {section.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Version info */}
      <div className="text-[11px] text-neutral-slate-400 text-right pt-2">
        Mabvuku Polyclinic Queue Management · v1.0.0
      </div>
    </div>
  );
}
