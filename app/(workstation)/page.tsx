"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Hourglass,
  UserCheck,
  CheckCircle2,
  XCircle,
  Search,
  Tv,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  Button,
  Input,
  Badge,
  AlertBanner,
  MetricBar,
} from "@/components/ui";
import { CheckInStrip } from "@/components/queue/CheckInStrip";

export default function WorkstationHomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAlert, setShowAlert] = useState(true);

  const summaryMetrics = [
    {
      id: "today",
      label: "Today",
      value: 56,
      subtext: "Total checked in",
      icon: <Users className="w-5 h-5 text-[#1E4DB7]" />,
      valueColor: "text-[#0B2D6B]",
    },
    {
      id: "waiting",
      label: "Waiting",
      value: 22,
      icon: <Hourglass className="w-5 h-5 text-[#F97316]" />,
      valueColor: "text-[#F97316]",
    },
    {
      id: "consulting",
      label: "In Consultation",
      value: 12,
      icon: <UserCheck className="w-5 h-5 text-[#1D4ED8]" />,
      valueColor: "text-[#1D4ED8]",
    },
    {
      id: "seen",
      label: "Seen",
      value: 34,
      icon: <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />,
      valueColor: "text-[#16A34A]",
    },
    {
      id: "dna",
      label: "Did Not Attend",
      value: 2,
      icon: <XCircle className="w-5 h-5 text-[#475569]" />,
      valueColor: "text-[#475569]",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header & Quick Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B2D6B]">
              Outpatient Queue Workstation
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#ECFDF5] text-[#16A34A] border border-[#86EFAC]/40">
              Live Workstation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Mabvuku Polyclinic Outpatient Triage & Consultation Workstation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/display/zone-a" target="_blank">
            <Button
              variant="secondary"
              size="sm"
              icon={<Tv className="w-4 h-4 text-[#0B2D6B]" />}
            >
              Open TV Display Board
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary Metric Bar */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">Queue Summary Metrics</h2>
        <MetricBar metrics={summaryMetrics} />
      </section>

      {/* 3. System Announcement Alert */}
      {showAlert && (
        <section aria-label="System Announcements">
          <AlertBanner
            type="info"
            message="Check-in pipeline active: Submitting the intake strip persists real patient and visit records."
            onDismiss={() => setShowAlert(false)}
          />
        </section>
      )}

      {/* 4. Main Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Check-in Strip & Waiting Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real Patient Check-In Strip Component */}
          <CheckInStrip />

          {/* Waiting Queue Table Preview */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Waiting Queue
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#1E4DB7]">
                  22
                </span>
              </div>

              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search by name or number..."
                  icon={<Search className="w-4 h-4" />}
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F5F9] text-[#64748B] uppercase font-semibold tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th scope="col" className="px-4 py-3">#</th>
                    <th scope="col" className="px-4 py-3">Patient</th>
                    <th scope="col" className="px-4 py-3">Reason For Visit</th>
                    <th scope="col" className="px-4 py-3">Arrived</th>
                    <th scope="col" className="px-4 py-3">Waiting</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                  <tr className="bg-[#FFFBEB]/60 hover:bg-[#FFFBEB] transition-colors font-medium">
                    <td className="px-4 py-3 text-sm font-bold text-[#F97316]">23</td>
                    <td className="px-4 py-3 font-semibold">T. CHIMWEMWE</td>
                    <td className="px-4 py-3 text-[#475569]">Back pain</td>
                    <td className="px-4 py-3 text-[#64748B]">10:12 AM</td>
                    <td className="px-4 py-3 font-bold text-[#DC2626]">12 min</td>
                    <td className="px-4 py-3">
                      <Badge variant="waiting" size="sm" />
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-[#1E4DB7]">24</td>
                    <td className="px-4 py-3 font-semibold">S. MPOFU</td>
                    <td className="px-4 py-3 text-[#475569]">Headache</td>
                    <td className="px-4 py-3 text-[#64748B]">10:14 AM</td>
                    <td className="px-4 py-3 font-bold text-[#DC2626]">10 min</td>
                    <td className="px-4 py-3">
                      <Badge variant="waiting" size="sm" />
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-[#1E4DB7]">25</td>
                    <td className="px-4 py-3 font-semibold">A. ZHOU</td>
                    <td className="px-4 py-3 text-[#475569]">Flu symptoms</td>
                    <td className="px-4 py-3 text-[#64748B]">10:16 AM</td>
                    <td className="px-4 py-3 font-semibold text-[#F97316]">8 min</td>
                    <td className="px-4 py-3">
                      <Badge variant="waiting" size="sm" />
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-[#1E4DB7]">26</td>
                    <td className="px-4 py-3 font-semibold">M. NGWENYA</td>
                    <td className="px-4 py-3 text-[#475569]">Stomach pain</td>
                    <td className="px-4 py-3 text-[#64748B]">10:18 AM</td>
                    <td className="px-4 py-3 text-[#475569]">6 min</td>
                    <td className="px-4 py-3">
                      <Badge variant="waiting" size="sm" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Next Patient & Room Assignment Panel */}
        <div className="space-y-6">
          {/* Next Patient Callout Card */}
          <div className="bg-white p-5 rounded-lg border border-[#FDBA74]/50 shadow-sm bg-gradient-to-br from-white to-[#FFFBEB]/40">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
              Next Patient
            </span>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-[#F97316]">#23</span>
              <span className="text-base font-bold text-[#0F172A]">T. CHIMWEMWE</span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">Reason: Back pain</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#DC2626]">
              <Clock className="w-3.5 h-3.5" />
              <span>Waiting 12 min</span>
            </div>
          </div>

          {/* Room Allocation Panel */}
          <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2D6B]">
                Assign to Available Room
              </h3>
              <button
                type="button"
                className="text-xs text-[#1E4DB7] hover:underline flex items-center gap-1"
                onClick={() => alert("Room statuses updated")}
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded border border-[#E2E8F0] flex items-center justify-between gap-2 bg-[#F8FAFC]">
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Consult Room 1</h4>
                  <p className="text-[11px] text-[#64748B]">Nurse: N. Chikomo</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="available" size="sm" />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => alert("Assigned to Room 1")}
                  >
                    Assign
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded border border-[#E2E8F0] flex items-center justify-between gap-2 bg-[#F8FAFC]">
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Consult Room 2</h4>
                  <p className="text-[11px] text-[#64748B]">Nurse: P. Mutasa</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="available" size="sm" />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => alert("Assigned to Room 2")}
                  >
                    Assign
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded border border-[#E2E8F0] flex items-center justify-between gap-2 bg-[#FFF7ED]/30 opacity-75">
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Consult Room 3</h4>
                  <p className="text-[11px] text-[#64748B]">Nurse: S. Dube</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="busy" size="sm" />
                  <span className="text-xs text-[#94A3B8] px-2 font-mono">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
