/**
 * printReceipt
 *
 * Opens a new popup window containing a self-contained receipt HTML page,
 * waits for it to load, then calls window.print() on it.
 *
 * This avoids all CSS specificity battles and works reliably across browsers
 * and operating systems (including macOS Safari and Chrome).
 *
 * No React, no Tailwind, no Next.js Image — purely browser APIs.
 */

export interface PrintReceiptOptions {
  ticketNumber: string;
  patientName: string;
  department?: string;
  printedAt?: Date;
}

export function printReceipt({
  ticketNumber,
  patientName,
  department = "Block A — General Outpatient",
  printedAt,
}: PrintReceiptOptions): void {
  const ts = printedAt ?? new Date();

  const dateStr = ts.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeStr = ts.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const crestUrl = `${window.location.origin}/images/harare-crest.svg`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Patient Receipt — ${escapeHtml(patientName)}</title>
  <style>
    @page { margin: 15mm; size: A4 portrait; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #000;
      background: #fff;
    }

    .wrap { max-width: 540px; margin: 0 auto; }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .clinic-name {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #0B2D6B;
      margin-bottom: 5px;
    }
    .clinic-sub {
      font-size: 11px;
      color: #334155;
      margin: 2px 0;
      line-height: 1.4;
    }
    .crest {
      width: 60px;
      height: 60px;
      object-fit: contain;
      flex-shrink: 0;
    }

    /* ── Dividers ── */
    .divider {
      border: none;
      border-top: 1.5px solid #0B2D6B;
      margin: 12px 0;
    }
    .divider-dashed {
      border: none;
      border-top: 1px dashed #94A3B8;
      margin: 16px 0;
    }

    /* ── Title block ── */
    .title-block {
      text-align: center;
      margin: 14px 0;
    }
    .title {
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #0B2D6B;
    }
    .subtitle {
      font-size: 11px;
      color: #64748B;
      margin-top: 5px;
    }

    /* ── Details table ── */
    .details {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
    }
    .details td {
      padding: 6px 0;
      vertical-align: top;
    }
    .lbl {
      width: 36%;
      font-weight: 600;
      color: #334155;
      font-size: 12px;
    }
    .val {
      color: #0F172A;
      font-size: 13px;
    }
    .val-bold {
      font-weight: 700;
      font-size: 14px;
    }
    .queue-num {
      font-size: 38px;
      font-weight: 900;
      color: #0B2D6B;
      letter-spacing: 0.05em;
      line-height: 1;
    }

    /* ── Info box ── */
    .info {
      margin: 12px 0;
      padding: 10px 12px;
      background: #F8FAFC;
      border-left: 3px solid #0B2D6B;
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
    }

    /* ── Sign here ── */
    .sign-block { margin: 20px 0 14px; }
    .sign-lbl {
      font-size: 12px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 8px;
    }
    .sign-box {
      width: 220px;
      height: 52px;
      border: 1.5px solid #334155;
      border-radius: 2px;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 18px;
      text-align: center;
      font-size: 10px;
      color: #94A3B8;
    }
    .footer p { margin: 3px 0; }
  </style>
</head>
<body>
  <div class="wrap">

    <!-- Header -->
    <div class="header">
      <div>
        <div class="clinic-name">MABVUKU POLYCLINIC</div>
        <div class="clinic-sub">Outpatient Queue Management System</div>
        <div class="clinic-sub">City of Harare Municipal</div>
      </div>
      <img class="crest" src="${crestUrl}" alt="City of Harare Crest" />
    </div>

    <hr class="divider" />

    <!-- Title -->
    <div class="title-block">
      <div class="title">PATIENT RECEIPT</div>
      <div class="subtitle">Queue Management</div>
    </div>

    <hr class="divider" />

    <!-- Details -->
    <table class="details">
      <tbody>
        <tr>
          <td class="lbl">Patient Name</td>
          <td class="val val-bold">${escapeHtml(patientName)}</td>
        </tr>
        <tr>
          <td class="lbl">Queue Number</td>
          <td class="val queue-num">${escapeHtml(ticketNumber)}</td>
        </tr>
        <tr>
          <td class="lbl">Date</td>
          <td class="val">${escapeHtml(dateStr)}</td>
        </tr>
        <tr>
          <td class="lbl">Time</td>
          <td class="val">${escapeHtml(timeStr)}</td>
        </tr>
        <tr>
          <td class="lbl">Department</td>
          <td class="val">${escapeHtml(department)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Instructions -->
    <div class="info">
      Please keep this receipt and present it when your name is called.
      Wait in the seating area — your queue number will be displayed on the
      screen when it is your turn.
    </div>

    <!-- Signature -->
    <div class="sign-block">
      <div class="sign-lbl">Patient Signature</div>
      <div class="sign-box"></div>
    </div>

    <hr class="divider-dashed" />

    <!-- Footer -->
    <div class="footer">
      <p>Mabvuku Polyclinic · City of Harare</p>
      <p>Thank you for choosing our services</p>
    </div>

  </div>

  <script>
    // Print as soon as the page (including the crest image) is fully loaded.
    window.onload = function () {
      window.print();
      // Close the popup after the print dialog is dismissed.
      window.onafterprint = function () { window.close(); };
    };
  </script>
</body>
</html>`;

  const popup = window.open("", "_blank", "width=680,height=900,scrollbars=yes");
  if (!popup) {
    // Popup was blocked — fall back to a data: URL approach in the same tab
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return;
  }

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
