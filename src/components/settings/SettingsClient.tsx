"use client";

import React, { useState, useCallback } from "react";
import {
  Users,
  DoorOpen,
  Plus,
  Trash2,
  Settings2,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { Button, Input, Select, AlertBanner } from "@/components/ui";
import {
  getSettingsDataAction,
  addStaffAction,
  removeStaffAction,
  resetPasswordAction,
  addRoomAction,
  removeRoomAction,
  type StaffMember,
  type RoomSetting,
  type ZoneOption,
} from "@/server/actions/settings";

// Role values as constants — avoids importing @prisma/client in a client component
const Role = {
  RECEPTIONIST: "RECEPTIONIST",
  DOCTOR: "DOCTOR",
  ADMIN: "ADMIN",
} as const;
type Role = typeof Role[keyof typeof Role];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ROLE_LABELS: Record<Role, string> = {
  RECEPTIONIST: "Receptionist",
  DOCTOR: "Doctor / Nurse",
  ADMIN: "Admin",
};

const ROLE_COLORS: Record<Role, string> = {
  RECEPTIONIST: "bg-[#EFF6FF] text-[#1D4ED8]",
  DOCTOR:       "bg-[#ECFDF5] text-[#16A34A]",
  ADMIN:        "bg-[#FFF1F2] text-[#BE123C]",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface SettingsClientProps {
  initialStaff: StaffMember[];
  initialRooms: RoomSetting[];
  initialZones: ZoneOption[];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function SettingsClient({
  initialStaff,
  initialRooms,
  initialZones,
}: SettingsClientProps) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [rooms, setRooms] = useState<RoomSetting[]>(initialRooms);
  const zones = initialZones; // zones don't change at runtime

  const refresh = useCallback(async () => {
    const res = await getSettingsDataAction();
    if (res.success) {
      setStaff(res.staff);
      setRooms(res.rooms);
    }
  }, []);

  return (
    <div className="space-y-6 pb-6">
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

      {/* Staff management */}
      <StaffSection staff={staff} zones={zones} onMutate={refresh} />

      {/* Room management */}
      <RoomSection rooms={rooms} zones={zones} onMutate={refresh} />

      <div className="text-[11px] text-neutral-slate-400 text-right pt-2">
        Mabvuku Polyclinic Queue Management · v1.0.0
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staff section
// ---------------------------------------------------------------------------
function StaffSection({
  staff,
  zones,
  onMutate,
}: {
  staff: StaffMember[];
  zones: ZoneOption[];
  onMutate: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Add form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.RECEPTIONIST);
  const [zoneId, setZoneId] = useState<string>(zones[0]?.id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Reset password state — tracks which row has the form open
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isResetting, setIsResetting] = useState(false);

  const resetForm = () => {
    setName(""); setEmail(""); setPassword("");
    setRole(Role.RECEPTIONIST); setZoneId(zones[0]?.id ?? "");
    setFieldErrors({}); setShowForm(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Name is required";
    if (!email.trim()) errors.email = "Email is required";
    if (!password.trim()) errors.password = "Password is required";
    else if (password.length < 8) errors.password = "Minimum 8 characters";
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    setIsSubmitting(true);
    setAlert(null);
    try {
      const res = await addStaffAction({
        name, email, role,
        zoneId: role === Role.ADMIN ? null : zoneId,
        password,
      });
      if (res.success) {
        setAlert({ type: "success", message: `Staff account created for ${name}.` });
        resetForm();
        await onMutate();
      } else {
        setAlert({ type: "error", message: res.error ?? "Failed to create staff account." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName}? This cannot be undone.`)) return;
    setRemovingId(userId);
    setAlert(null);
    try {
      const res = await removeStaffAction(userId);
      if (res.success) {
        setAlert({ type: "success", message: `${userName} has been removed.` });
        await onMutate();
      } else {
        setAlert({ type: "error", message: res.error ?? "Failed to remove staff member." });
      }
    } finally {
      setRemovingId(null);
    }
  };

  const openResetForm = (userId: string) => {
    setResetTargetId(userId);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
  };

  const cancelReset = () => {
    setResetTargetId(null);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    const errors: Record<string, string> = {};
    if (!newPassword) errors.newPassword = "New password is required";
    else if (newPassword.length < 8) errors.newPassword = "Minimum 8 characters";
    if (!confirmPassword) errors.confirmPassword = "Please confirm the password";
    else if (newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (Object.keys(errors).length) { setPasswordErrors(errors); return; }

    setIsResetting(true);
    setAlert(null);
    try {
      const res = await resetPasswordAction({ userId, newPassword });
      if (res.success) {
        setAlert({ type: "success", message: `Password reset successfully for ${userName}.` });
        cancelReset();
      } else {
        setAlert({ type: "error", message: res.error ?? "Failed to reset password." });
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <section aria-labelledby="staff-heading">
      <div className="bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm overflow-hidden">
        {/* Section header */}
        <div className="px-5 py-4 border-b border-neutral-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary-blue" strokeWidth={1.75} />
            </div>
            <div>
              <h3 id="staff-heading" className="text-[14px] font-bold text-primary-navy">
                Staff Accounts
              </h3>
              <p className="text-[11px] text-neutral-slate-500">
                {staff.length} member{staff.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowForm((v) => !v)}
          >
            Add Staff
          </Button>
        </div>

        {/* Alert */}
        {alert && (
          <div className="px-5 pt-3">
            <AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd} className="px-5 py-4 border-b border-neutral-slate-200 bg-[#F8FAFC] space-y-3">
            <p className="text-[12px] font-semibold text-primary-navy uppercase tracking-[0.06em]">
              New Staff Member
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name"
                placeholder="e.g. Dr. T. Moyo"
                isRequired
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
                error={fieldErrors.name}
                disabled={isSubmitting}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. doctor@mabvuku.co.zw"
                isRequired
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
                error={fieldErrors.email}
                disabled={isSubmitting}
              />
              <Select
                label="Role"
                isRequired
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={isSubmitting}
                options={[
                  { value: Role.RECEPTIONIST, label: "Receptionist" },
                  { value: Role.DOCTOR,       label: "Doctor / Nurse" },
                  { value: Role.ADMIN,         label: "Admin" },
                ]}
              />
              {role !== Role.ADMIN && (
                <Select
                  label="Zone"
                  isRequired
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  disabled={isSubmitting}
                  options={zones.map((z) => ({ value: z.id, label: `${z.name} (${z.code})` }))}
                />
              )}
              <Input
                label="Temporary Password"
                type="password"
                placeholder="Min. 8 characters"
                isRequired
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                error={fieldErrors.password}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Create Account
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={resetForm} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Staff table */}
        {staff.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-neutral-slate-400">
            No staff accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[11px] uppercase font-semibold tracking-wider text-neutral-slate-500 border-b border-neutral-slate-200">
                <tr>
                  <th scope="col" className="px-5 py-3">Name</th>
                  <th scope="col" className="px-5 py-3">Email</th>
                  <th scope="col" className="px-5 py-3">Role</th>
                  <th scope="col" className="hidden sm:table-cell px-5 py-3">Zone</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-slate-100">
                {staff.map((member) => (
                  <React.Fragment key={member.id}>
                    {/* Main row */}
                    <tr className={resetTargetId === member.id ? "bg-[#F0F9FF]" : "bg-white hover:bg-[#F8FAFC]"}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-tint flex items-center justify-center text-[11px] font-bold text-primary-navy shrink-0">
                            {member.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <span className="font-semibold text-primary-navy truncate">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-neutral-slate-600 truncate max-w-[180px]">
                        {member.email}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_COLORS[member.role]}`}>
                          <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                          {ROLE_LABELS[member.role]}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-5 py-3 text-neutral-slate-500">
                        {member.zoneName ?? <span className="text-neutral-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<KeyRound className="w-3.5 h-3.5" />}
                            onClick={() => resetTargetId === member.id ? cancelReset() : openResetForm(member.id)}
                            aria-label={`Reset password for ${member.name}`}
                          >
                            {resetTargetId === member.id ? "Cancel" : "Reset Password"}
                          </Button>
                          <Button
                            variant="outline_destructive"
                            size="sm"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            isLoading={removingId === member.id}
                            onClick={() => handleRemove(member.id, member.name)}
                            aria-label={`Remove ${member.name}`}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline reset password form — expands below the row */}
                    {resetTargetId === member.id && (
                      <tr className="bg-[#F0F9FF]">
                        <td colSpan={5} className="px-5 pb-4">
                          <div className="border border-[#BAE6FD] rounded-lg p-4 space-y-3">
                            <p className="text-[12px] font-semibold text-[#0369A1] flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5" />
                              Reset password for {member.name}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Input
                                label="New Password"
                                type="password"
                                placeholder="Min. 8 characters"
                                isRequired
                                value={newPassword}
                                onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors((p) => ({ ...p, newPassword: "" })); }}
                                error={passwordErrors.newPassword}
                                disabled={isResetting}
                              />
                              <Input
                                label="Confirm Password"
                                type="password"
                                placeholder="Re-enter new password"
                                isRequired
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordErrors((p) => ({ ...p, confirmPassword: "" })); }}
                                error={passwordErrors.confirmPassword}
                                disabled={isResetting}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                isLoading={isResetting}
                                onClick={() => handleResetPassword(member.id, member.name)}
                              >
                                Save New Password
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={cancelReset}
                                disabled={isResetting}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Room section
// ---------------------------------------------------------------------------
function RoomSection({
  rooms,
  zones,
  onMutate,
}: {
  rooms: RoomSetting[];
  zones: ZoneOption[];
  onMutate: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [zoneId, setZoneId] = useState<string>(zones[0]?.id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName(""); setRoomNumber(""); setZoneId(zones[0]?.id ?? "");
    setFieldErrors({}); setShowForm(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Room name is required";
    if (!roomNumber.trim()) errors.roomNumber = "Room number is required";
    if (!zoneId) errors.zoneId = "Zone is required";
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    setIsSubmitting(true);
    setAlert(null);
    try {
      const res = await addRoomAction({ name, roomNumber, zoneId });
      if (res.success) {
        setAlert({ type: "success", message: `${name} added successfully.` });
        resetForm();
        await onMutate();
      } else {
        setAlert({ type: "error", message: res.error ?? "Failed to add room." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (roomId: string, roomName: string) => {
    if (!confirm(`Remove ${roomName}? This cannot be undone.`)) return;
    setRemovingId(roomId);
    setAlert(null);
    try {
      const res = await removeRoomAction(roomId);
      if (res.success) {
        setAlert({ type: "success", message: `${roomName} has been removed.` });
        await onMutate();
      } else {
        setAlert({ type: "error", message: res.error ?? "Failed to remove room." });
      }
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section aria-labelledby="rooms-heading">
      <div className="bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm overflow-hidden">
        {/* Section header */}
        <div className="px-5 py-4 border-b border-neutral-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] flex items-center justify-center shrink-0">
              <DoorOpen className="w-4 h-4 text-[#16A34A]" strokeWidth={1.75} />
            </div>
            <div>
              <h3 id="rooms-heading" className="text-[14px] font-bold text-primary-navy">
                Consultation Rooms
              </h3>
              <p className="text-[11px] text-neutral-slate-500">
                {rooms.length} room{rooms.length !== 1 ? "s" : ""} across {zones.length} zone{zones.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowForm((v) => !v)}
          >
            Add Room
          </Button>
        </div>

        {/* Alert */}
        {alert && (
          <div className="px-5 pt-3">
            <AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd} className="px-5 py-4 border-b border-neutral-slate-200 bg-[#F8FAFC] space-y-3">
            <p className="text-[12px] font-semibold text-primary-navy uppercase tracking-[0.06em]">
              New Room
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Room Name"
                placeholder="e.g. Consultation Room 7"
                isRequired
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
                error={fieldErrors.name}
                disabled={isSubmitting}
              />
              <Input
                label="Room Number"
                placeholder="e.g. 107"
                isRequired
                value={roomNumber}
                onChange={(e) => { setRoomNumber(e.target.value); setFieldErrors((p) => ({ ...p, roomNumber: "" })); }}
                error={fieldErrors.roomNumber}
                disabled={isSubmitting}
              />
              <Select
                label="Zone"
                isRequired
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                disabled={isSubmitting}
                error={fieldErrors.zoneId}
                options={zones.map((z) => ({ value: z.id, label: `${z.name} (${z.code})` }))}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Add Room
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={resetForm} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Rooms table grouped by zone */}
        {rooms.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-neutral-slate-400">
            No rooms configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[11px] uppercase font-semibold tracking-wider text-neutral-slate-500 border-b border-neutral-slate-200">
                <tr>
                  <th scope="col" className="px-5 py-3">Room</th>
                  <th scope="col" className="px-5 py-3">Number</th>
                  <th scope="col" className="px-5 py-3">Zone</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-slate-100">
                {rooms.map((room) => (
                  <tr key={room.id} className="bg-white hover:bg-[#F8FAFC]">
                    <td className="px-5 py-3 font-semibold text-primary-navy">{room.name}</td>
                    <td className="px-5 py-3 text-neutral-slate-600">{room.roomNumber}</td>
                    <td className="px-5 py-3 text-neutral-slate-500">{room.zoneName}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        room.status === "FREE"
                          ? "bg-[#ECFDF5] text-[#16A34A]"
                          : "bg-[#FFF7ED] text-[#EA580C]"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          room.status === "FREE" ? "bg-[#16A34A]" : "bg-[#EA580C]"
                        }`} />
                        {room.status === "FREE" ? "Free" : "Occupied"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="outline_destructive"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        isLoading={removingId === room.id}
                        onClick={() => handleRemove(room.id, room.name)}
                        disabled={room.status === "OCCUPIED"}
                        title={room.status === "OCCUPIED" ? "Cannot remove an occupied room" : undefined}
                        aria-label={`Remove ${room.name}`}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
