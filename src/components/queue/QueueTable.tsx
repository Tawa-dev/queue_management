"use client";

import React, { useState, useEffect } from "react";
import { Search, AlertTriangle, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Input, Badge } from "@/components/ui";
import { QueueVisitItem } from "@/server/actions/getQueue";

const ROWS_PER_PAGE = 8;

export interface QueueTableProps {
  visits: QueueVisitItem[];
  lastUpdated?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

function waitTimeClass(mins: number) {
  if (mins >= 12) return "text-status-urgent-text font-bold";
  if (mins >= 10) return "text-[#EA580C] font-bold";
  if (mins >= 8) return "text-status-waiting-text font-bold";
  if (mins >= 5) return "text-[#F59E0B] font-bold";
  return "text-status-seen-text font-bold";
}

export function QueueTable({
  visits,
  lastUpdated = "Just now",
  isLoading = false,
  className = "",
}: QueueTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(interval);
  }, []);


  const calculateWaitMins = (checkInIsoString: string) => {
    const diffMs = now.getTime() - new Date(checkInIsoString).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const formatArrival = (checkInIsoString: string) => {
    return new Date(checkInIsoString).toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const filteredVisits = visits.filter((v) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    return (
      v.patientName.toLowerCase().includes(query) ||
      v.ticketNumber.toLowerCase().includes(query) ||
      v.reason.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredVisits.length / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const pageVisits = filteredVisits.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    return [1, 2, 3];
  };

  const pagerBtn =
    "px-2 py-1 rounded text-primary-blue hover:bg-primary-tint disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium min-h-8";

  return (
    <div className={`bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm overflow-hidden ${className}`}>
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-[13px] font-bold text-primary-navy uppercase tracking-[0.06em] whitespace-nowrap">
            Waiting Queue ({filteredVisits.length})
          </h3>
          <div
            className="hidden sm:flex items-center gap-1.5 text-[11px] text-neutral-slate-500 whitespace-nowrap"
            role="status"
            aria-live="polite"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-status-seen-text" />
            <span>Live · {lastUpdated}</span>
          </div>
        </div>
        <div className="w-full sm:w-56">
          <Input
            placeholder="Search by name or number"
            icon={<Search className="w-4 h-4" />}
            iconPosition="right"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 text-xs"
            aria-label="Search by name or number"
          />
        </div>
      </div>

      {pageVisits.length === 0 ? (
        <div className="p-10 text-center flex flex-col items-center justify-center space-y-2 border-t border-neutral-slate-200">
          <div className="w-10 h-10 rounded-full bg-neutral-slate-100 flex items-center justify-center text-neutral-slate-500">
            <Inbox className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-neutral-slate-700">
            {searchQuery ? "No matching patients found" : "No patients currently waiting in queue"}
          </h4>
          <p className="text-[11px] text-neutral-slate-500 max-w-sm">
            {searchQuery
              ? `No patient or ticket matches "${searchQuery}". Clear your search to view all entries.`
              : "Patients checked in via the intake strip will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-primary-navy text-[11px] uppercase font-semibold tracking-wider border-y border-neutral-slate-200">
              <tr>
                <th scope="col" className="px-4 py-2.5 w-14">#</th>
                <th scope="col" className="px-4 py-2.5">Patient</th>
                <th scope="col" className="px-4 py-2.5">Reason for Visit</th>
                <th scope="col" className="px-4 py-2.5">Arrived</th>
                <th scope="col" className="px-4 py-2.5">Waiting</th>
                <th scope="col" className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-slate-200 text-primary-navy">
              {pageVisits.map((visit, index) => {
                const waitMins = calculateWaitMins(visit.checkInTime);
                const isOverdue = waitMins >= 15;
                const isFirstRow = startIndex === 0 && index === 0;

                return (
                  <tr
                    key={visit.id}
                    className={`${
                      visit.isUrgent
                        ? "bg-status-urgent-bg/70"
                        : isFirstRow
                        ? "bg-[#FEF5E5]"
                        : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-3 font-extrabold text-[15px]">
                      <span
                        className={
                          visit.isUrgent
                            ? "text-status-urgent-text"
                            : isFirstRow
                            ? "text-status-waiting-text"
                            : "text-primary-blue"
                        }
                      >
                        {visit.ticketNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary-navy">
                      <div className="flex items-center gap-2">
                        <span className="uppercase">{visit.patientName}</span>
                        {visit.isUrgent && <Badge variant="urgent" size="sm" showDefaultIcon={false} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-normal text-primary-navy">{visit.reason}</td>
                    <td className="px-4 py-3 font-normal text-primary-navy whitespace-nowrap">
                      {formatArrival(visit.checkInTime)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={waitTimeClass(waitMins)}>
                        {waitMins} min
                      </span>
                      {isOverdue && (
                        <AlertTriangle className="inline w-3.5 h-3.5 text-status-urgent-text ml-1 align-text-bottom" aria-label="Wait over 15 minutes" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={waitMins >= 10 ? "waiting" : "seen"}
                        size="sm"
                        showDefaultIcon={false}
                      >
                        WAITING
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-4 py-3 border-t border-neutral-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-neutral-slate-500">
        <span>
          Showing {filteredVisits.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredVisits.length)} of {filteredVisits.length} waiting patients
        </span>

        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => goToPage(1)} disabled={safeCurrentPage === 1} className={pagerBtn}>
            First
          </button>
          <button
            type="button"
            onClick={() => goToPage(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            className={pagerBtn}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((page) => {
            const reachable = page <= totalPages;
            return (
              <button
                key={page}
                type="button"
                onClick={() => reachable && goToPage(page)}
                disabled={!reachable}
                className={`w-7 h-7 rounded font-semibold cursor-pointer transition-colors ${
                  page === safeCurrentPage
                    ? "bg-primary-navy text-white"
                    : "text-primary-blue hover:bg-primary-tint disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => goToPage(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            className={pagerBtn}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => goToPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className={pagerBtn}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
