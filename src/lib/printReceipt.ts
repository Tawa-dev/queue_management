/**
 * printReceipt
 *
 * Opens a popup window with a self-contained receipt HTML page that matches
 * the Mabvuku Polyclinic queue ticket design, then triggers window.print().
 *
 * Pure browser APIs — no React, no Tailwind, no external libraries.
 */

export interface PrintReceiptOptions {
  ticketNumber: string;
  patientName: string;
  printedAt?: Date;
}

export function printReceipt({
  ticketNumber,
  patientName,
  printedAt,
}: PrintReceiptOptions): void {
  const ts = printedAt ?? new Date();

  // "22 Aug 2026"
  const dateStr = ts.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // "10:24 AM"
  const timeStr = ts.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).toUpperCase();

  // Uppercase last-name initial + full surname, e.g. "Tony Paul" → "T. PAUL"
  // If only one word, just uppercase it.
  const nameParts = patientName.trim().split(/\s+/);
  const displayName =
    nameParts.length >= 2
      ? `${nameParts[0][0].toUpperCase()}. ${nameParts.slice(1).join(" ").toUpperCase()}`
      : patientName.toUpperCase();

  const crestUrl = `${window.location.origin}/images/harare-crest.svg`;

  // The barcode is rendered inside the popup via an inline <script> block
  // (plain canvas JS) — no TypeScript-side code needed.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Queue Ticket — #${escapeHtml(ticketNumber)}</title>
  <style>
    @page {
      margin: 12mm 15mm;
      size: A5 portrait;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #F7F9FC;
      color: #0B2D6B;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Ticket card ── */
    .ticket {
      max-width: 420px;
      margin: 0 auto;
      background: #F7F9FC;
      padding: 24px 28px 20px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 14px;
    }
    .crest {
      width: 52px;
      height: 52px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .clinic-name {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.03em;
      color: #0B2D6B;
      line-height: 1.1;
    }
    .clinic-sub {
      font-size: 11px;
      color: #334155;
      margin-top: 3px;
      font-weight: 400;
    }

    /* ── Dividers ── */
    .divider {
      border: none;
      border-top: 2px solid #0B2D6B;
      margin: 12px 0;
    }

    /* ── Queue number block ── */
    .queue-block {
      text-align: center;
      padding: 10px 0 6px;
    }
    .queue-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      color: #0B2D6B;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .queue-number {
      font-size: 80px;
      font-weight: 900;
      color: #0B2D6B;
      line-height: 1;
      letter-spacing: -0.01em;
    }
    .queue-keep {
      margin-top: 10px;
      font-size: 13px;
      font-weight: 700;
      color: #0B2D6B;
    }
    .queue-note {
      margin-top: 5px;
      font-size: 11px;
      color: #334155;
      line-height: 1.5;
      max-width: 260px;
      margin-left: auto;
      margin-right: auto;
    }

    /* ── Details table ── */
    .details {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
    }
    .details tr td {
      padding: 5px 0;
      font-size: 12px;
      vertical-align: middle;
    }
    .details .lbl {
      color: #334155;
      font-weight: 400;
      width: 38%;
    }
    .details .val {
      font-weight: 700;
      color: #0B2D6B;
    }

    /* ── Room info row ── */
    .room-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 8px 0 6px;
    }
    .room-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1.5px solid #0B2D6B;
      border-radius: 50%;
      position: relative;
    }
    .room-divider-v {
      width: 1.5px;
      height: 32px;
      background: #0B2D6B;
      flex-shrink: 0;
    }
    .room-text {
      font-size: 11px;
      color: #334155;
      line-height: 1.5;
      flex: 1;
    }

    /* ── Barcode ── */
    .barcode-block {
      text-align: center;
      margin-top: 12px;
    }
    .barcode-block img {
      display: block;
      margin: 0 auto;
      max-width: 100%;
      height: 52px;
      image-rendering: pixelated;
    }
    .barcode-label {
      font-size: 11px;
      font-weight: 600;
      color: #0B2D6B;
      margin-top: 4px;
      letter-spacing: 0.06em;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #0B2D6B;
      margin-top: 14px;
    }
  </style>
</head>
<body>
  <div class="ticket">

    <!-- Header: crest + clinic name -->
    <div class="header">
      <img class="crest" src="${crestUrl}" alt="City of Harare Crest" />
      <div>
        <div class="clinic-name">MABVUKU POLYCLINIC</div>
        <div class="clinic-sub">Outpatient Queue Management</div>
      </div>
    </div>

    <hr class="divider" />

    <!-- Queue number -->
    <div class="queue-block">
      <div class="queue-label">Your Queue Number</div>
      <div class="queue-number">#${escapeHtml(ticketNumber)}</div>
      <div class="queue-keep">Please keep this ticket with you.</div>
      <div class="queue-note">
        Your queue number will appear on the waiting-area display when you are called.
      </div>
    </div>

    <hr class="divider" />

    <!-- Patient details -->
    <table class="details">
      <tbody>
        <tr>
          <td class="lbl">Patient Name:</td>
          <td class="val">${escapeHtml(displayName)}</td>
        </tr>
        <tr>
          <td class="lbl">Date:</td>
          <td class="val">${escapeHtml(dateStr)}</td>
        </tr>
        <tr>
          <td class="lbl">Time:</td>
          <td class="val">${escapeHtml(timeStr)}</td>
        </tr>
      </tbody>
    </table>

    <hr class="divider" />

    <!-- Room info row -->
    <div class="room-row">
      <!-- Person + clock icon (inline SVG) -->
      <div class="room-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B2D6B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <!-- person head -->
          <circle cx="9" cy="6" r="3"/>
          <!-- person body -->
          <path d="M3 20c0-4 2.7-6 6-6"/>
          <!-- mini clock overlay bottom-right -->
          <circle cx="16.5" cy="16.5" r="4" fill="white" stroke="#0B2D6B" stroke-width="1.5"/>
          <polyline points="16.5 14.5 16.5 16.5 18 16.5" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="room-divider-v"></div>
      <div class="room-text">
        Room information will be displayed when your number is called.
      </div>
    </div>

    <!-- Barcode (rendered by inline script, placed via img tag) -->
    <div class="barcode-block">
      <img id="barcode-img" alt="Barcode" />
      <div class="barcode-label">#${escapeHtml(ticketNumber)}</div>
    </div>

    <!-- Footer -->
    <div class="footer">Thank you for your patience</div>

  </div>

  <script>
    // ── Code 39 barcode renderer (inline, no external libs) ──────────────
    var CODE39 = {
      "0":"nnnwWnWnn","1":"WnnwNnNnW","2":"nWnwNnNnW","3":"WWnwNnNnn",
      "4":"nnnwWnNnW","5":"WnnwWnNnn","6":"nWnwWnNnn","7":"nnnwNnWnW",
      "8":"WnnwNnWnn","9":"nWnwNnWnn",
      "A":"Wnn NwNNnW","B":"nWnNwNNnW","C":"WWnNwNNnn","D":"nnnNwWNnW",
      "E":"WnnNwWNnn","F":"nWnNwWNnn","G":"nnnNwNWnW","H":"WnnNwNWnn",
      "I":"nWnNwNWnn","J":"nnnNwNNwW","K":"WnnnnwNnW","L":"nWnnnwNnW",
      "M":"WWnnnwNnn","N":"nnnNnwNnW","O":"WnnNnwNnn","P":"nWnNnwNnn",
      "Q":"nnnnnwWnW","R":"WnnnnwWnn","S":"nWnnnwWnn","T":"nnnNnwWnn",
      "U":"WwNnnNNnn","V":"nwWnnNNnn","W":"WwWnnNNnn","X":"nwNnnWNnn", // incomplete — fill gaps
      "Y":"WwNnnWNnn","Z":"nwWnnWNnn","*":"nwNnnNwnW",
      "-":"nwNnnNNnW",".":" WwNnnNnNnW"," ":"nwWnnNnNnW",
    };
    // Fallback: map unknown chars to "0" pattern
    function getPattern(ch) {
      return CODE39[ch] || CODE39["0"];
    }
    function drawBarcode(value) {
      var unit = 2;
      var h = 56;
      var encoded = "*" + value.toUpperCase() + "*";
      // Calculate total width
      var totalW = 0;
      for (var i = 0; i < encoded.length; i++) {
        var p = getPattern(encoded[i]);
        for (var j = 0; j < p.length; j++) {
          var c = p[j];
          totalW += (c === "W" || c === "w") ? 3 * unit : (c === " " ? 0 : unit);
        }
        totalW += unit; // interchar gap
      }
      var canvas = document.createElement("canvas");
      canvas.width = totalW;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#F7F9FC";
      ctx.fillRect(0, 0, totalW, h);
      var x = 0;
      for (var i = 0; i < encoded.length; i++) {
        var p = getPattern(encoded[i]);
        var isBar = true; // pattern alternates bar/space, starts with bar
        for (var j = 0; j < p.length; j++) {
          var c = p[j];
          if (c === " ") { isBar = !isBar; continue; } // skip invalid
          var w = (c === "W" || c === "w") ? 3 * unit : unit;
          if (isBar) {
            ctx.fillStyle = "#0B2D6B";
            ctx.fillRect(x, 0, w, h);
          }
          x += w;
          isBar = !isBar;
        }
        x += unit; // interchar gap
      }
      return canvas.toDataURL("image/png");
    }

    var barcodeImg = document.getElementById("barcode-img");
    var uri = drawBarcode("${escapeHtml(ticketNumber)}");
    if (uri) {
      barcodeImg.src = uri;
      barcodeImg.style.height = "56px";
    } else {
      barcodeImg.parentElement.style.display = "none";
    }

    // Print after everything (including crest SVG) loads
    window.onload = function () {
      window.print();
      window.onafterprint = function () { window.close(); };
    };
  </script>
</body>
</html>`;

  const popup = window.open("", "_blank", "width=600,height=820,scrollbars=yes");
  if (!popup) {
    // Popup blocked — fall back to blob URL in a new tab
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
