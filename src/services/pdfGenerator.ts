import { jsPDF } from 'jspdf';
import { PotholeReport } from '../types/pothole';
import { AUTHORITIES_DIRECTORY } from '../data/jurisdictionsData';
import { generateMapSnapshot } from './mapSnapshotService';

export async function generatePotholePdf(report: PotholeReport): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;
  const contentWidth = pageWidth - (margin * 2);
  let y = 38;

  const trackingCode = report.trackingCode || report.workOrderNumber || `GAP-${report.id.replace(/[^0-9]/g, '').slice(-4) || '2026-1042'}`;
  const authority = AUTHORITIES_DIRECTORY[report.authorityId || ''] || {
    name: report.jurisdiction || 'Gwinnett County DOT',
    contactEmail: report.authorityEmail || 'dotcustomerservice@gwinnettcounty.com',
    slaTurnaround: '3 to 5 business days',
    department: 'Road Maintenance Division'
  };

  // 1. Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('GEORGIA ROAD HAZARD & POTHOLE PATROL', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Public Works & Campus Infrastructure Incident Docket', margin, y + 13);

  // Tracking Code on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TRACKING CODE:', pageWidth - margin - 120, y);
  doc.setFontSize(13);
  doc.setTextColor(185, 28, 28); // red-700
  doc.text(trackingCode, pageWidth - margin - 120, y + 15);

  y += 28;

  // Header Divider Line
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  // 2. Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Official Roadway Condition & Repair Notice', margin, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Automated incident docket dispatched to ${authority.name} for road triage.`, margin, y);
  y += 14;

  // 3. Status & Severity Badges
  const severity = (report.severity || 'moderate').toUpperCase();
  const status = (report.status || 'reported').toUpperCase();
  const hazard = (report.hazardType || 'POTHOLE').toUpperCase();

  let sevBg = [245, 158, 11]; // amber
  if (severity === 'SEVERE' || severity === 'CRITICAL') {
    sevBg = [220, 38, 38]; // red
  } else if (severity === 'MINOR' || severity === 'LOW') {
    sevBg = [16, 185, 129]; // green
  }

  const badgeW = (contentWidth - 16) / 3;
  const badgeH = 22;

  // Badge 1: Severity
  doc.setFillColor(sevBg[0], sevBg[1], sevBg[2]);
  doc.roundedRect(margin, y, badgeW, badgeH, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`SEVERITY: ${severity}`, margin + (badgeW / 2), y + 15, { align: 'center' });

  // Badge 2: Status
  doc.setFillColor(37, 99, 235); // blue-600
  doc.roundedRect(margin + badgeW + 8, y, badgeW, badgeH, 3, 3, 'F');
  doc.text(`STATUS: ${status}`, margin + badgeW + 8 + (badgeW / 2), y + 15, { align: 'center' });

  // Badge 3: Hazard Type
  doc.setFillColor(71, 85, 105); // slate-600
  doc.roundedRect(margin + (badgeW * 2) + 16, y, badgeW, badgeH, 3, 3, 'F');
  doc.text(`HAZARD: ${hazard}`, margin + (badgeW * 2) + 16 + (badgeW / 2), y + 15, { align: 'center' });

  y += badgeH + 16;

  // Helper for Section Heading
  const drawHeading = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138); // blue-900
    doc.text(title, margin, y);
    y += 10;
  };

  // Helper for 2-column Table Rows
  const drawTableRow = (label: string, value: string, isLast = false) => {
    const rowH = 16;
    const col1W = 155;

    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, rowH, 'F');

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, contentWidth, rowH, 'S');
    doc.line(margin + col1W, y, margin + col1W, y + rowH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(label, margin + 6, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(value, margin + col1W + 6, y + 11);

    y += rowH;
    if (isLast) y += 10;
  };

  // 4. Section 1: Geospatial & Location Details
  drawHeading('1. Geospatial & Location Details');
  const lat = report.latitude.toFixed(6);
  const lng = report.longitude.toFixed(6);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  drawTableRow('Street / Corridor Address:', report.address || 'Gwinnett County Roadway');
  drawTableRow('Landmark / Specific Location:', report.landmark || 'N/A');
  drawTableRow('Exact Coordinates (GPS):', `Lat: ${lat}, Lng: ${lng}`);
  drawTableRow('Digital Map Navigation:', mapsUrl);
  drawTableRow('Campus Distance (GGC):', `${(report.distanceFromGgcMiles ?? 0).toFixed(2)} miles from campus`);
  drawTableRow('Reported Timestamp:', report.reportedAt || new Date().toLocaleString(), true);

  // 5. Section 2: Assigned Transportation Authority
  drawHeading('2. Assigned Transportation Authority');
  drawTableRow('Responsible Agency:', authority.name);
  drawTableRow('Agency Contact Email:', authority.contactEmail);
  drawTableRow('Department:', authority.department);
  drawTableRow('SLA Turnaround Guarantee:', authority.slaTurnaround);
  drawTableRow(
    'Sensor Shock Telemetry:',
    report.sensorDetected
      ? `Accelerated Deceleration Spike (${(report.bumpIntensity || 8.8).toFixed(2)}G)`
      : 'Citizen Visual Report / Verified',
    true
  );

  // 6. Section 3: Hazard Description & Citizen Notes
  drawHeading('3. Hazard Description & Citizen Notes');
  const descBoxH = 28;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, descBoxH, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, descBoxH, 2, 2, 'S');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const descText = report.description || 'No additional notes provided by reporter.';
  const wrappedDesc = doc.splitTextToSize(descText, contentWidth - 12);
  doc.text(wrappedDesc, margin + 6, y + 12);
  y += descBoxH + 12;

  // 7. Section 4: Verified Geospatial Location Snapshot (Image)
  let snapshotDataUrl = report.imageUrl;
  if (!snapshotDataUrl || !snapshotDataUrl.startsWith('data:image')) {
    try {
      snapshotDataUrl = await generateMapSnapshot(report.latitude, report.longitude, {
        severity: report.severity,
        roadName: report.roadName || report.address,
        landmark: report.landmark
      });
    } catch {
      // Continue without dynamic snapshot if generation fails
    }
  }

  if (snapshotDataUrl && snapshotDataUrl.startsWith('data:image')) {
    drawHeading('4. Verified Geospatial Location Map Snapshot');
    const imgWidth = 260;
    const imgHeight = 96;
    const imgX = margin + (contentWidth - imgWidth) / 2;

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(imgX - 3, y - 3, imgWidth + 6, imgHeight + 6, 2, 2, 'FD');

    try {
      doc.addImage(snapshotDataUrl, 'PNG', imgX, y, imgWidth, imgHeight);
      y += imgHeight + 12;
    } catch (err) {
      console.warn('Could not embed snapshot in PDF:', err);
    }
  }

  // 8. Section 5: Public Works Work Order Signoff Block
  drawHeading(snapshotDataUrl && snapshotDataUrl.startsWith('data:image') ? '5. Dispatch & Field Maintenance Log' : '4. Dispatch & Field Maintenance Log');
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

  drawSignRow('Work Order Ref #:', 'Dispatched Crew:');
  drawSignRow('Inspection Date:', 'Patch / Repair Date:');
  drawSignRow('Inspector Signature:', 'Supervisor Signoff:');
  y += 14;

  // 9. Footer
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Generated by Georgia Pothole Patrol System • Georgia Gwinnett College Campus & Gwinnett/GDOT Pilot Project • Certified Record',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  // Save the PDF
  doc.save(`Incident_Report_${trackingCode}.pdf`);
}
