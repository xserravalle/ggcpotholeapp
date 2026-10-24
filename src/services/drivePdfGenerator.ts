import { jsPDF } from 'jspdf';
import { DriveSession } from '../types/driveSession';
import { formatDuration } from './driveSessionService';

export async function generateDrivePdf(session: DriveSession): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;
  const contentWidth = pageWidth - (margin * 2);
  let y = 38;

  const targetEmail = 'peyton.holland@gmail.com';
  const trackingCode = session.trackingCode || `DRIVE-2026-${session.id.slice(0, 4).toUpperCase()}`;

  // 1. Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('GEORGIA ROAD HAZARD & POTHOLE PATROL', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Drive-Time Mapping Session & Pothole Incidence Ledger', margin, y + 13);

  // Tracking Code on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DRIVE LOG ID:', pageWidth - margin - 120, y);
  doc.setFontSize(13);
  doc.setTextColor(13, 148, 136); // teal-600
  doc.text(trackingCode, pageWidth - margin - 120, y + 15);

  y += 28;

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Official Drive Patrol & Roadway Hazard Audit', margin, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Automated route telemetry and accelerometer shock ledger routed to ${targetEmail}.`, margin, y);
  y += 16;

  // Key Metric Badges
  const badgeW = (contentWidth - 18) / 4;
  const badgeH = 28;

  const drawMetricBadge = (x: number, label: string, value: string, bg: [number, number, number]) => {
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.roundedRect(x, y, badgeW, badgeH, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(label, x + (badgeW / 2), y + 10, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(value, x + (badgeW / 2), y + 23, { align: 'center' });
  };

  drawMetricBadge(margin, 'DRIVE DISTANCE', `${session.totalDistanceMiles.toFixed(2)} mi`, [13, 148, 136]); // teal
  drawMetricBadge(margin + badgeW + 6, 'DRIVE TIME', formatDuration(session.durationSeconds), [37, 99, 235]); // blue
  drawMetricBadge(margin + (badgeW * 2) + 12, 'HAZARDS FOUND', `${session.incidents.length} Shocks`, [220, 38, 38]); // red
  drawMetricBadge(margin + (badgeW * 3) + 18, 'MAX SHOCK', `${session.peakG.toFixed(2)} G`, [109, 40, 217]); // purple

  y += badgeH + 18;

  // Section Heading Helper
  const drawHeading = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138); // blue-900
    doc.text(title, margin, y);
    y += 10;
  };

  // Section 1: Route & Drive Details
  drawHeading('1. Route Telemetry & Temporal Summary');

  const drawTableRow = (label: string, value: string, isLast = false) => {
    const rowH = 15;
    const col1W = 150;
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, contentWidth, rowH, 'S');
    doc.line(margin + col1W, y, margin + col1W, y + rowH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(label, margin + 6, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(value, margin + col1W + 6, y + 11);

    y += rowH;
    if (isLast) y += 12;
  };

  const startTimeStr = new Date(session.startTime).toLocaleString();
  const endTimeStr = session.endTime ? new Date(session.endTime).toLocaleString() : 'In Progress';

  drawTableRow('Drive Session Activation:', startTimeStr);
  drawTableRow('Drive Session Termination:', endTimeStr);
  drawTableRow('GPS Breadcrumbs Mapped:', `${session.path.length} waypoints recorded`);
  drawTableRow('Target Public Works Dispatch:', targetEmail, true);

  // Section 2: Detected Pothole Incidence Ledger
  drawHeading(`2. Detected Pothole Incidence Ledger (${session.incidents.length} Events)`);

  if (session.incidents.length === 0) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No significant roadway shocks (≥ 3.0G) were detected during this drive session.', margin + 10, y + 16);
    y += 38;
  } else {
    // Table Header
    const colW = [24, 52, 54, 54, 180, 176];
    const headerH = 16;
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y, contentWidth, headerH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let curX = margin;
    const headers = ['#', 'TIME', 'SEVERITY', 'SHOCK', 'NEAREST STREET ADDRESS', 'GPS COORDINATES'];
    headers.forEach((h, idx) => {
      doc.text(h, curX + 4, y + 11);
      curX += colW[idx];
    });
    y += headerH;

    // Table Rows
    session.incidents.slice(0, 8).forEach((inc, idx) => {
      const rowH = 16;
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, contentWidth, rowH, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.rect(margin, y, contentWidth, rowH, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      let rx = margin;
      
      // #
      doc.text(`${idx + 1}`, rx + 4, y + 11);
      rx += colW[0];

      // Time into drive
      doc.text(`+${formatDuration(inc.elapsedSeconds)}`, rx + 4, y + 11);
      rx += colW[1];

      // Severity
      const sev = inc.severity.toUpperCase();
      if (sev === 'CRITICAL' || sev === 'SEVERE') {
        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(217, 119, 6);
        doc.setFont('helvetica', 'bold');
      }
      doc.text(sev, rx + 4, y + 11);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      rx += colW[2];

      // Shock Peak
      doc.text(`${inc.peakG.toFixed(2)} G`, rx + 4, y + 11);
      rx += colW[3];

      // Address
      const addrShort = (inc.address || inc.roadName || 'Roadway').slice(0, 38);
      doc.text(addrShort, rx + 4, y + 11);
      rx += colW[4];

      // Lat/Lng
      doc.text(`${inc.latitude.toFixed(5)}, ${inc.longitude.toFixed(5)}`, rx + 4, y + 11);

      y += rowH;
    });

    y += 14;
  }

  // Section 3: Field Verification Signoff Block
  drawHeading('3. Dispatch Verification & Maintenance Transfer');
  const signColW = contentWidth / 2;
  const signRowH = 16;

  const drawSignRow = (l1: string, l2: string) => {
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, y, contentWidth, signRowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, signRowH, 'S');
    doc.line(margin + signColW, y, margin + signColW, y + signRowH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(l1, margin + 6, y + 11);
    doc.text('_____________________________', margin + 105, y + 11);

    doc.text(l2, margin + signColW + 6, y + 11);
    doc.text('_____________________________', margin + signColW + 105, y + 11);

    y += signRowH;
  };

  drawSignRow('Patrol Driver Signature:', 'Supervisor Verification:');
  drawSignRow('Work Order Batch #:', 'Repair Priority Level:');
  y += 14;

  // Footer
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Generated by Georgia Pothole Patrol System • Drive-Time Geospatial Audit • Georgia Gwinnett College Senior Capstone',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  doc.save(`Drive_Report_${trackingCode}.pdf`);
}
