import { PotholeReport, SeverityLevel } from '../types/pothole';
import { TrackedHazardSpot, SpotHitRecord } from '../types/sensorQueue';
import { milesBetween } from './distanceCalculator';
import { classifyJurisdiction } from './jurisdictionClassifier';

export const FEET_PER_MILE = 5280;
export const DEFAULT_RADIUS_FEET = 50; // 50 ft radius per specification
export const DEFAULT_G_FORCE_THRESHOLD = 3.0;

export interface ImpactInput {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  gForce: number | null | undefined;
  timestamp?: number | string | Date | null | undefined;
  roadName?: string;
  city?: string;
}

export interface ImpactProcessConfig {
  thresholdG?: number;
  radiusFeet?: number;
}

export interface ImpactProcessResult {
  accepted: boolean;
  reason?: string;
  updatedSpots: TrackedHazardSpot[];
  spot: TrackedHazardSpot | null;
  reportCreated: PotholeReport | null;
}

/**
 * Validates impact data.
 * Returns an error string if invalid, or null if valid.
 */
export function validateImpactInput(input: ImpactInput): string | null {
  if (!input) {
    return 'Impact input object is missing or null';
  }

  const { latitude, longitude, gForce, timestamp } = input;

  if (
    latitude === null ||
    latitude === undefined ||
    typeof latitude !== 'number' ||
    Number.isNaN(latitude)
  ) {
    return 'Invalid or missing latitude';
  }
  if (latitude < -90 || latitude > 90) {
    return 'Latitude out of valid range (-90 to 90)';
  }

  if (
    longitude === null ||
    longitude === undefined ||
    typeof longitude !== 'number' ||
    Number.isNaN(longitude)
  ) {
    return 'Invalid or missing longitude';
  }
  if (longitude < -180 || longitude > 180) {
    return 'Longitude out of valid range (-180 to 180)';
  }

  if (
    gForce === null ||
    gForce === undefined ||
    typeof gForce !== 'number' ||
    Number.isNaN(gForce)
  ) {
    return 'Invalid or missing G-force';
  }

  if (timestamp !== undefined && timestamp !== null) {
    const timeMs = new Date(timestamp).getTime();
    if (Number.isNaN(timeMs)) {
      return 'Invalid timestamp provided';
    }
  }

  return null;
}

/**
 * Processes an impact event and updates tracked spots.
 * Files a report only after the same spot is hit 3 times.
 * Runs 100% silently with no popups, no audio chimes, and no vibrations.
 */
export function processImpact(
  input: ImpactInput,
  currentSpots: TrackedHazardSpot[],
  config: ImpactProcessConfig = {}
): ImpactProcessResult {
  const validationError = validateImpactInput(input);
  if (validationError) {
    console.error(`[Impact Tracker Error] ${validationError}`, input);
    return {
      accepted: false,
      reason: validationError,
      updatedSpots: currentSpots,
      spot: null,
      reportCreated: null,
    };
  }

  const { latitude, longitude, gForce, timestamp, roadName, city } = input;
  const lat = latitude!;
  const lng = longitude!;
  const roundedG = parseFloat(gForce!.toFixed(2));
  const thresholdG = config.thresholdG ?? DEFAULT_G_FORCE_THRESHOLD;
  const radiusFeet = config.radiusFeet ?? DEFAULT_RADIUS_FEET;

  // Reject impacts below threshold G-Force setting (e.g. 1.7G, 2.3G, 3.2G)
  if (roundedG < thresholdG) {
    return {
      accepted: false,
      reason: `Impact G-force (${roundedG}G) is below setting threshold (${thresholdG}G)`,
      updatedSpots: currentSpots,
      spot: null,
      reportCreated: null,
    };
  }

  const timeObj = timestamp ? new Date(timestamp) : new Date();
  const timeISO = timeObj.toISOString();
  const timeDisplayStr = timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const radiusMiles = radiusFeet / FEET_PER_MILE;

  // Find existing spot within 50 ft radius
  const existingIndex = currentSpots.findIndex((spot) => {
    const distMiles = milesBetween({ lat: spot.latitude, lng: spot.longitude }, { lat, lng });
    return distMiles <= radiusMiles;
  });

  let reportCreated: PotholeReport | null = null;
  const updatedSpots = [...currentSpots];
  let targetSpot: TrackedHazardSpot;

  const hitRecord: SpotHitRecord = {
    id: `HIT-${crypto.randomUUID()}`,
    timestamp: timeDisplayStr,
    gForce: roundedG,
  };

  if (existingIndex >= 0) {
    const spot = updatedSpots[existingIndex];
    const newHitCount = spot.hitCount + 1;
    const newMaxG = Math.max(spot.maxGForce, roundedG);
    const severity: SeverityLevel = newMaxG >= 6.0 ? 'critical' : 'moderate';

    targetSpot = {
      ...spot,
      hitCount: newHitCount,
      maxGForce: newMaxG,
      severity,
      lastHitAt: timeDisplayStr,
      hits: [...spot.hits, hitRecord],
    };

    // 3-hit confirmation threshold: File report only on 3rd strike if not already reported
    if (newHitCount >= 3 && !targetSpot.promotedToReportId) {
      const uuid = crypto.randomUUID();
      const trackingCode = `GAP-2026-${uuid.slice(0, 8).toUpperCase()}`;
      const newReportId = `GW-POT-${uuid}`;
      targetSpot.promotedToReportId = newReportId;

      const road = roadName || spot.roadName || 'Detected Road Hazard';
      const cityName = city || spot.city || 'Lawrenceville';
      const classification = classifyJurisdiction(lat, lng, road);

      reportCreated = {
        id: newReportId,
        trackingCode,
        title: `Auto-Reported Pothole on ${road}`,
        roadName: road,
        address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        city: cityName,
        jurisdiction: classification.authority.name,
        authorityId: classification.authority.id,
        authorityName: classification.authority.name,
        authorityEmail: classification.authority.contactEmail,
        latitude: lat,
        longitude: lng,
        severity,
        hazardType: 'POTHOLE',
        status: 'reported',
        verificationsCount: 0,
        userConfirmed: false,
        reportedAt: timeISO,
        lastVerifiedAt: timeISO,
        description: `Automated report generated after 3 confirmed accelerometer impacts (${newHitCount} hits recorded near this location, peak ${newMaxG}G).`,
        estimatedDepthInches: newMaxG >= 6.0 ? 3.5 : 2.5,
        estimatedWidthInches: newMaxG >= 6.0 ? 20 : 14,
        surfaceType: 'Asphalt',
        damageRisk: newMaxG >= 6.0 ? 'Tire / Rim Damage' : 'Suspension / Alignment',
        detectedBy: 'Vehicle Accelerometer Telemetry',
        sensorDetected: true,
        sensorEvidence: {
          hitCount: newHitCount,
          maxGForce: newMaxG,
          firstDetectedAt: targetSpot.createdAt,
          lastDetectedAt: timeDisplayStr,
        },
        bumpIntensity: newMaxG,
        workOrderNumber: `DISP-${newReportId}`,
        source: 'sensor',
      };
    }

    updatedSpots[existingIndex] = targetSpot;
  } else {
    // 1st hit at a new spot location
    const road = roadName || 'GPS-detected road (name unverified)';
    const cityName = city || 'Lawrenceville';
    const severity: SeverityLevel = roundedG >= 6.0 ? 'critical' : 'moderate';

    targetSpot = {
      id: `SPOT-${crypto.randomUUID()}`,
      latitude: lat,
      longitude: lng,
      roadName: road,
      city: cityName,
      hitCount: 1,
      maxGForce: roundedG,
      severity,
      createdAt: timeDisplayStr,
      lastHitAt: timeDisplayStr,
      hits: [hitRecord],
    };

    updatedSpots.unshift(targetSpot);
  }

  return {
    accepted: true,
    updatedSpots,
    spot: targetSpot,
    reportCreated,
  };
}
