"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, UsersRound, PhoneOff } from "lucide-react";
import { Input } from "@/components/ui";
import {
  getPatientsAction,
  type PatientListItem,
} from "@/server/actions/getPatients";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<
  NonNullable<PatientListItem["lastVisit"]>["status"],
  { bg: string; text: string; label: string }
> = {
  WAITING: {
    bg: "bg-[#FFF4E5]",
    text: "text-[#F97316]",
    label: "Waiting",
  },
  IN_ROOM: {
    bg: "bg-[#EFF6FF]",
    text: "text-[#1D4ED8]",
    label: "In Consultation",
  },
  COMPLETED: {
    bg: "bg-[#ECFDF5]",
    text: "text-[#16A34A]",
    label: "Completed",
  },
  CANCELLED: {
    bg: "bg-[#F1F5F9]",
    text: "text-[#475569]",
    label: "Cancelled",
  },
};

// ---------------------------------------------------------------------------
// Patient row
// ---------------------------------------------------------------------------
function PatientRow({ patient }: { patient: PatientListItem }) {
  const visit = patient.lastVisit;
  const statusStyle = visit ? STATUS_STYLES[visit.status] : null;

  return (
    <tr className="bg-white hover:bg-[#F8FAFC] transition-colors border-b border-neutral-slate-200 last:border-0">
      {/* Name */}
      <td className="px-4 py-3">
        <span className="text-[14px] font-semibold text-primary-navy uppercase">
          {patient.fullName}
        </span>
      </td>

      {/* Phone */}
      <td className="px-4 py-3 hidden sm:table-cell">
        {patient.phone ? (
          <span className="text-[13px] text-neutral-slate-600">{patient.phone}</span>
        ) : (
          <span className="flex items-center gap-1 text-[12px] text-neutral-slate-400">
            <PhoneOff className="w-3.5 h-3.5" />
            Not recorded
          </span>
        )}
      </td>

      {/* Visits */}
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-[13px] font-semibold text-primary-navy">
          {patient.totalVisits}
        </span>
      </td>

      {/* Last visit */}
      <td className="px-4 py-3 hidden lg:table-cell">
        {visit ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-neutral-slate-600 truncate max-w-[180px]">
              {visit.reason}
            </span>
            <span className="text-[11px] text-neutral-slate-400">
              {formatDateTime(visit.checkInTime)} · {visit.zoneName}
            </span>
          </div>
        ) : (
          <span className="text-[12px] text-neutral-slate-400">No visits</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {visit && statusStyle ? (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${statusStyle.bg} ${statusStyle.text}`}
          >
            {statusStyle.label}
          </span>
        ) : (
          <span className="text-[12px] text-neutral-slate-400">—</span>
        )}
      </td>

      {/* Registered */}
      <td className="px-4 py-3 hidden xl:table-cell">
        <span className="text-[12px] text-neutral-slate-400">
          {formatDate(patient.createdAt)}
        </span>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-neutral-slate-200 animate-pulse">
          <td className="px-4 py-3">
            <div className="h-4 w-36 bg-neutral-slate-200 rounded" />
          </td>
          <td className="px-4 py-3 hidden sm:table-cell">
            <div className="h-3 w-24 bg-neutral-slate-100 rounded" />
          </td>
          <td className="px-4 py-3 hidden md:table-cell">
            <div className="h-3 w-6 bg-neutral-slate-100 rounded" />
          </td>
          <td className="px-4 py-3 hidden lg:table-cell">
            <div className="h-3 w-40 bg-neutral-slate-100 rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-20 bg-neutral-slate-100 rounded-full" />
          </td>
          <td className="px-4 py-3 hidden xl:table-cell">
            <div className="h-3 w-20 bg-neutral-slate-100 rounded" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------
function EmptyState({ search }: { search: string }) {
  return (
    <tbody>
      <tr>
        <td colSpan={6} className="px-4 py-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-neutral-slate-100 flex items-center justify-center">
              <UsersRound className="w-6 h-6 text-neutral-slate-400" strokeWidth={1.5} />
            </div>
            {search ? (
              <>
                <p className="text-sm font-bold text-neutral-slate-700">
                  No patients match &ldquo;{search}&rdquo;
                </p>
                <p className="text-xs text-neutral-slate-500">
                  Try a different name or clear the search.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-neutral-slate-700">No patients yet</p>
                <p className="text-xs text-neutral-slate-500">
                  Patients appear here once checked in by reception.
                </p>
              </>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PatientsPage() {
  const [allPatients, setAllPatients] = useState<PatientListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const res = await getPatientsAction();
    if (res.success) setAllPatients(res.patients);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side search filter — trim + case insensitive name match
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allPatients;
    return allPatients.filter((p) => p.fullName.toLowerCase().includes(q));
  }, [allPatients, search]);

  return (
    <div className="space-y-4 pb-6">
      <h1 className="sr-only">Patients — Mabvuku Polyclinic</h1>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold text-primary-navy leading-tight flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-neutral-slate-400" />
            Patients
          </h2>
          <p className="text-[13px] text-neutral-slate-500 mt-0.5">
            {isLoading
              ? "Loading…"
              : `${allPatients.length} patient${allPatients.length !== 1 ? "s" : ""} registered`}
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <Input
            id="patients-search"
            type="search"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4 text-neutral-slate-400" />}
            aria-label="Search patients by name"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-primary-navy text-[11px] uppercase font-semibold tracking-wider border-b border-neutral-slate-200 bg-neutral-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3 hidden sm:table-cell">Phone</th>
                <th scope="col" className="px-4 py-3 hidden md:table-cell">Visits</th>
                <th scope="col" className="px-4 py-3 hidden lg:table-cell">Last Visit</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 hidden xl:table-cell">Registered</th>
              </tr>
            </thead>

            {isLoading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState search={search} />
            ) : (
              <tbody className="divide-y divide-neutral-slate-200">
                {filtered.map((p) => (
                  <PatientRow key={p.id} patient={p} />
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* Footer row showing count when filtered */}
        {!isLoading && search && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-neutral-slate-200 text-[11px] text-neutral-slate-400">
            Showing {filtered.length} of {allPatients.length} patients
          </div>
        )}
      </div>
    </div>
  );
}
