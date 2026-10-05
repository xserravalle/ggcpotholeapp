import { CAMPUS_CENTER } from '../data/jurisdictionsData';

export interface Coordinates {
  lat: number;
  lng: number;
}

export function milesBetween(a: Coordinates, b: Coordinates): number {
  if (
    !a || !b ||
    a.lat === null || a.lat === undefined || isNaN(a.lat) ||
    a.lng === null || a.lng === undefined || isNaN(a.lng) ||
    b.lat === null || b.lat === undefined || isNaN(b.lat) ||
    b.lng === null || b.lng === undefined || isNaN(b.lng)
  ) {
    throw new Error('Invalid coordinates: latitude and longitude must be numbers.');
  }

  if (a.lat < -90 || a.lat > 90 || b.lat < -90 || b.lat > 90) {
    throw new Error('Invalid latitude: must be between -90 and 90.');
  }

  if (a.lng < -180 || a.lng > 180 || b.lng < -180 || b.lng > 180) {
    throw new Error('Invalid longitude: must be between -180 and 180.');
  }

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
