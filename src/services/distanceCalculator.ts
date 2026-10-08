import { CAMPUS_CENTER } from '../data/jurisdictionsData';

export interface Coordinates {
  lat: number;
  lng: number;
}

export function milesBetween(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function distanceFromCampusMiles(coords: Coordinates): number {
  return milesBetween({ lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng }, coords);
}

export function isWithinCampusRadius(coords: Coordinates, radiusMiles: number = 1.0): boolean {
  return distanceFromCampusMiles(coords) <= radiusMiles;
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export const FEET_PER_MILE = 5280;
export const HAZARD_WARNING_DISTANCE_MILES = 0.1; // 528 feet
export const HAZARD_WARNING_DISTANCE_FEET = HAZARD_WARNING_DISTANCE_MILES * FEET_PER_MILE;

/**
 * Calculates compass bearing (0-360 degrees) from point A to point B
 */
export function calculateBearing(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const theta = Math.atan2(y, x);

  return (toDeg(theta) + 360) % 360;
}

/**
 * Checks if a target hazard is in front of the vehicle based on current GPS heading.
 * If heading is null/undefined/NaN, defaults to true (treats any nearby hazard as relevant).
 */
export function isHazardAhead(
  currentHeading: number | null | undefined,
  currentPos: Coordinates,
  hazardPos: Coordinates,
  coneDegrees: number = 85
): boolean {
  if (currentHeading == null || isNaN(currentHeading)) {
    return true;
  }
  const bearing = calculateBearing(currentPos, hazardPos);
  const diff = Math.abs(currentHeading - bearing);
  const angleDiff = Math.min(diff, 360 - diff);
  return angleDiff <= coneDegrees;
}

