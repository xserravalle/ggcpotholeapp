import { PotholeReport } from '../types/pothole';

const STORAGE_KEY = 'ggc-pothole-patrol-reports-v2';

export function loadStoredPotholes(fallbackList: PotholeReport[]): PotholeReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallbackList;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallbackList;
  } catch {
    return fallbackList;
  }
}

export function saveStoredPotholes(list: PotholeReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save potholes to localStorage', err);
  }
}

export function exportPotholesToCsv(list: PotholeReport[], filename = 'gwinnett_pothole_work_orders.csv'): void {
  const headers = [
    'Work Order / Tracking Code',
    'Title',
    'Severity',
    'Hazard Type',
    'Status',
    'Jurisdiction',
    'Address',
    'Latitude',
    'Longitude',
    'Distance from GGC (mi)',
    'Depth (in)',
    'Width (in)',
    'Surface Type',
    'Damage Risk',
    'Detected By',
    'Sensor Detected',
    'Bump Intensity (G)',
    'Reported At',
    'Verifications'
  ];

  const rows = list.map(item => [
    `"${item.trackingCode || item.workOrderNumber || item.id}"`,
    `"${(item.title || '').replace(/"/g, '""')}"`,
    item.severity.toUpperCase(),
    item.hazardType || 'POTHOLE',
    item.status.toUpperCase(),
    `"${item.jurisdiction}"`,
    `"${(item.address || '').replace(/"/g, '""')}"`,
    item.latitude.toFixed(6),
    item.longitude.toFixed(6),
    (item.distanceFromGgcMiles ?? 0).toFixed(2),
    item.estimatedDepthInches || 0,
    item.estimatedWidthInches || 0,
    item.surfaceType || 'Asphalt',
    `"${item.damageRisk || ''}"`,
    `"${item.detectedBy}"`,
    item.sensorDetected ? 'YES' : 'NO',
    item.bumpIntensity || 0,
    item.reportedAt || '',
    item.verificationsCount || 0
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
