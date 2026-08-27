"use client";

import React, { useState } from "react";
import { UserPlus, AlertTriangle, User, Activity, ShieldAlert } from "lucide-react";
import { Button, Input, AlertBanner } from "@/components/ui";
import { checkInPatientAction, CheckInResult } from "@/server/actions/checkIn";

export interface CheckInStripProps {
  onCheckInSuccess?: (result: CheckInResult) => void;
  className?: string;
}

export function CheckInStrip({ onCheckInSuccess, className = "" }: CheckInStripProps) {
  const [fullName, setFullName] = useState("");
  const [reason, setReason] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; reason?: string }>({});
  const [alertState, setAlertState] = useState<{
    type: "success" | "warning" | "error";
    message: string;
    requiresConfirmation?: boolean;
  } | null>(null);

  const validateForm = () => {
    const errors: { fullName?: string; reason?: string } = {};
    if (!fullName.trim()) {
      errors.fullName = "Patient name is required";
    }
    if (!reason.trim()) {
      errors.reason = "Reason for visit is required";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckIn = async (bypassDuplicateWarning = false) => {
    if (!validateForm()) return;

    setIsLoading(true);
    setAlertState(null);

    try {
      const res = await checkInPatientAction({
        fullName: fullName.trim(),
        reason: reason.trim(),
        isUrgent,
        bypassDuplicateWarning,
      });

      if (res.success) {
        setAlertState({
          type: "success",
          message: `Successfully checked in ${res.patientName} — Ticket #${res.ticketNumber} issued.`,
        });
        // Clear form state
        setFullName("");
        setReason("");
        setIsUrgent(false);
        setFieldErrors({});

        if (onCheckInSuccess) {
          onCheckInSuccess(res);
        }
      } else if (res.requiresConfirmation && res.warning) {
        setAlertState({
          type: "warning",
          message: res.warning,
          requiresConfirmation: true,
        });
      } else {
        setAlertState({
          type: "error",
          message: res.error || "Failed to check in patient. Please try again.",
        });
      }
    } catch {
      setAlertState({
        type: "error",
        message: "Network or server connection error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheckIn(false);
  };

  return (
    <div className={`w-full bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm space-y-3 ${className}`}>
      {/* Top Title & Header Strip */}
      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#1E4DB7] flex items-center justify-center font-semibold">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] leading-tight">
              Patient Intake & Check-In
            </h2>
            <p className="text-[11px] text-[#64748B] leading-tight">
              Quick registration for walk-in outpatient queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
          <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#334155] text-[11px]">
            Mode: Walk-In
          </span>
        </div>
      </div>

      {/* Alert Banner Container */}
      {alertState && (
        <div className="space-y-2">
          <AlertBanner
            type={alertState.type}
            message={alertState.message}
            onDismiss={() => setAlertState(null)}
          />
          {alertState.requiresConfirmation && (
            <div className="flex items-center gap-2 bg-[#FFFBEB] p-2.5 rounded-lg border border-[#FDE68A]">
              <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0" />
              <span className="text-xs text-[#92400E] font-medium flex-1">
                Confirm duplicate entry for this patient?
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCheckIn(true)}
                isLoading={isLoading}
              >
                Proceed Check-In
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Horizontal Check-in Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Patient Name Input */}
        <div className="md:col-span-5">
          <Input
            label="Patient Full Name"
            placeholder="e.g. Tendai Chikore"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: undefined });
            }}
            error={fieldErrors.fullName}
            icon={<User className="w-4 h-4 text-[#64748B]" />}
            isRequired
            disabled={isLoading}
          />
        </div>

        {/* Reason for Visit Input */}
        <div className="md:col-span-4">
          <Input
            label="Reason for Visit"
            placeholder="e.g. Severe Headache, General Checkup"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (fieldErrors.reason) setFieldErrors({ ...fieldErrors, reason: undefined });
            }}
            error={fieldErrors.reason}
            icon={<Activity className="w-4 h-4 text-[#64748B]" />}
            isRequired
            disabled={isLoading}
          />
        </div>

        {/* Urgent Priority Checkbox */}
        <div className="md:col-span-1.5 flex items-center h-10 mb-0.5">
          <label className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer select-none transition-colors text-xs font-semibold ${
            isUrgent 
              ? "bg-[#FEF2F2] border-[#DC2626] text-[#DC2626]" 
              : "bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]"
          }`}>
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 accent-[#DC2626] rounded cursor-pointer"
            />
            <AlertTriangle className={`w-3.5 h-3.5 ${isUrgent ? "text-[#DC2626]" : "text-[#64748B]"}`} />
            <span>Urgent</span>
          </label>
        </div>

        {/* Submit Action Button */}
        <div className="md:col-span-1.5 h-10">
          <Button
            type="submit"
            variant={isUrgent ? "destructive" : "primary"}
            fullWidth
            isLoading={isLoading}
            icon={<UserPlus className="w-4 h-4" />}
            className="h-10"
          >
            Check In
          </Button>
        </div>
      </form>
    </div>
  );
}
