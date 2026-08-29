import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CheckInStrip } from "./CheckInStrip";

vi.mock("@/server/actions/checkIn", () => ({
  checkInPatientAction: vi.fn(),
}));

import { checkInPatientAction } from "@/server/actions/checkIn";

describe("CheckInStrip Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders intake inputs and submit button (covers: AC-1)", () => {
    render(<CheckInStrip />);

    expect(screen.getByText(/check in new patient/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Patient Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason for Visit/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /check in patient/i })).toBeInTheDocument();
  });

  it("displays validation error messages when submitting empty fields (covers: AC-5)", async () => {
    render(<CheckInStrip />);

    const submitBtn = screen.getByRole("button", { name: /check in patient/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Patient name is required")).toBeInTheDocument();
    expect(await screen.findByText("Reason for visit is required")).toBeInTheDocument();
    expect(checkInPatientAction).not.toHaveBeenCalled();
  });

  it("submits patient check-in and renders success alert banner on completion (covers: AC-1, AC-6)", async () => {
    vi.mocked(checkInPatientAction).mockResolvedValue({
      success: true,
      ticketNumber: "1",
      patientName: "Tendai Chikore",
      visitId: "visit-1",
    });

    render(<CheckInStrip />);

    const nameInput = screen.getByLabelText(/Patient Name/i);
    const reasonInput = screen.getByLabelText(/Reason for Visit/i);
    const submitBtn = screen.getByRole("button", { name: /check in patient/i });

    fireEvent.change(nameInput, { target: { value: "Tendai Chikore" } });
    fireEvent.change(reasonInput, { target: { value: "Severe Headache" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(checkInPatientAction).toHaveBeenCalledWith({
        fullName: "Tendai Chikore",
        reason: "Severe Headache",
        isUrgent: false,
        bypassDuplicateWarning: false,
      });
    });

    expect(
      await screen.findByText(/Patient checked in successfully. Ticket #1 issued/i)
    ).toBeInTheDocument();
  });
});
