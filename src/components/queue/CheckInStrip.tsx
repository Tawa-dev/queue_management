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
          message: `Patient checked in successfully. Ticket #${res.ticketNumber} issued.`,
        });
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
          message: res.error || "Failed to check in patient. Try again.",
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

      {/* Form matching reference design */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Patient Name */}
          <div className="md:col-span-5">
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
              disabled={isLoading}
            />
          </div>

          {/* Reason for Visit */}
          <div className="md:col-span-5">
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
              disabled={isLoading}
            />
          </div>

          {/* Priority */}
          <div className="md:col-span-2 flex flex-col gap-1.5 text-left">
            <span className="text-xs font-semibold text-neutral-slate-700">Priority</span>
            <label className="flex items-center gap-2.5 h-10 cursor-pointer select-none text-xs font-medium text-neutral-slate-700">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 text-primary-navy border-neutral-slate-300 rounded focus:ring-primary-blue cursor-pointer"
              />
              <span>Urgent / Priority</span>
            </label>
          </div>
        </div>

        {/* Submit Button Row - Right Aligned */}
        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            icon={<UserPlus className="w-4 h-4" />}
            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            CHECK IN PATIENT
          </Button>
        </div>
      </form>
    </div>
  );
}
