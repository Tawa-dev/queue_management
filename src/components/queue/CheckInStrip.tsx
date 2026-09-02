"use client";

import React, { useState } from "react";
import { UserPlus, ShieldAlert } from "lucide-react";
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

    // Capture form values before clearing
    const submittedName = fullName.trim();
    const submittedReason = reason.trim();
    const submittedUrgent = isUrgent;

    // Optimistic: clear the form and show a pending state immediately —
    // the receptionist can start entering the next patient while the DB confirms.
    setIsLoading(true);
    setAlertState({
      type: "success",
      message: `Checking in ${submittedName}…`,
    });
    setFullName("");
    setReason("");
    setIsUrgent(false);
    setFieldErrors({});

    try {
      const res = await checkInPatientAction({
        fullName: submittedName,
        reason: submittedReason,
        isUrgent: submittedUrgent,
        bypassDuplicateWarning,
      });

      if (res.success) {
        // Replace the pending message with the real ticket number
        setAlertState({
          type: "success",
          message: `Patient checked in successfully. Ticket #${res.ticketNumber} issued.`,
        });
        if (onCheckInSuccess) {
          onCheckInSuccess(res);
        }
      } else if (res.requiresConfirmation && res.warning) {
        // Duplicate warning — restore form so the receptionist can decide
        setFullName(submittedName);
        setReason(submittedReason);
        setIsUrgent(submittedUrgent);
        setAlertState({
          type: "warning",
          message: res.warning,
          requiresConfirmation: true,
        });
      } else {
        // Server rejected — restore form so the receptionist can retry
        setFullName(submittedName);
        setReason(submittedReason);
        setIsUrgent(submittedUrgent);
        setAlertState({
          type: "error",
          message: res.error || "Failed to check in patient. Try again.",
        });
      }
    } catch {
      // Network error — restore form
      setFullName(submittedName);
      setReason(submittedReason);
      setIsUrgent(submittedUrgent);
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
    <div className={`w-full bg-white border border-neutral-slate-200 rounded-lg p-4 shadow-clinic-sm space-y-3 ${className}`}>
      <h2 className="text-[13px] font-bold text-primary-navy uppercase tracking-[0.06em]">
        CHECK IN NEW PATIENT
      </h2>

      {/* Alert Banner */}
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

      {/* Form: 3-column row — name | reason | priority + full-width button */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(200px,0.9fr)] gap-4 items-start">
          <Input
            label="Patient Name"
            placeholder="Enter full name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: undefined });
            }}
            error={fieldErrors.fullName}
            isRequired
          />

          <Input
            label="Reason for Visit"
            placeholder="Briefly describe reason for visit"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (fieldErrors.reason) setFieldErrors({ ...fieldErrors, reason: undefined });
            }}
            error={fieldErrors.reason}
            isRequired
          />

          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-neutral-slate-700">Priority</span>
            <label className="flex items-center gap-2.5 h-10 cursor-pointer select-none text-xs font-medium text-neutral-slate-700">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="w-4 h-4 shrink-0 text-primary-navy border-neutral-slate-300 rounded focus:ring-primary-blue cursor-pointer"
              />
              <span className="truncate">Urgent / Priority</span>
            </label>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              fullWidth
              icon={<UserPlus className="w-4 h-4" />}
              className="mt-1 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              CHECK IN PATIENT
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
