import { 
  GGC_CAMPUS_POLYGON, 
  GDOT_HIGHWAY_KEYWORDS, 
  MUNICIPAL_BOUNDS, 
  AUTHORITIES_DIRECTORY 
} from '../data/jurisdictionsData';
import { AuthorityContact } from '../types/jurisdiction';

export function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  const n = polygon.length;
  let inside = false;
  let p1x = polygon[0][0];
  let p1y = polygon[0][1];

  for (let i = 0; i <= n; i++) {
    const p2x = polygon[i % n][0];
    const p2y = polygon[i % n][1];

    if (min(p1y, p2y) < lng && lng <= max(p1y, p2y)) {
      if (lat <= max(p1x, p2x)) {
        if (p1y !== p2y) {
          const xinters = (lng - p1y) * (p2x - p1x) / (p2y - p1y) + p1x;
          if (p1x === p2x || lat <= xinters) {
            inside = !inside;
          }
        }
      }
    }
    p1x = p2x;
    p1y = p2y;
  }

  return inside;
}

function min(a: number, b: number) { return a < b ? a : b; }
function max(a: number, b: number) { return a > b ? a : b; }

export interface ClassificationResult {
  authority: AuthorityContact;
  matchReason: string;
}

export function classifyJurisdiction(
  lat: number,
  lng: number,
  roadName: string = ''
): ClassificationResult {
  const roadClean = roadName.toLowerCase();

  // 1. State Highway / Interstate Check (GDOT District 1)
  for (const kw of GDOT_HIGHWAY_KEYWORDS) {
    if (roadClean.includes(kw)) {
      return {
        authority: AUTHORITIES_DIRECTORY.GDOT,
        matchReason: `Identified as State Route or Interstate Corridor ('${kw.toUpperCase()}'). Routed to GDOT District 1.`
      };
    }
  }

  // 2. GGC Campus Check (Highest priority for College Pilot)
  if (
    pointInPolygon(lat, lng, GGC_CAMPUS_POLYGON) ||
    roadClean.includes('ggc') ||
    roadClean.includes('lonnie harvel') ||
    roadClean.includes('university center ln')
  ) {
    return {
      authority: AUTHORITIES_DIRECTORY.GGC,
      matchReason: 'Location falls within Georgia Gwinnett College campus property & maintenance perimeter.'
    };
  }

  // 3. Check City Keywords across all municipalities
  for (const [cityId, info] of Object.entries(MUNICIPAL_BOUNDS)) {
    for (const kw of info.keywords) {
      if (roadClean.includes(kw)) {
        const auth = AUTHORITIES_DIRECTORY[cityId] || AUTHORITIES_DIRECTORY.GWINNETT_COUNTY;
        return {
          authority: auth,
          matchReason: `Address identified within municipal limits of ${auth.name}.`
        };
      }
    }
  }

  // 4. Check Coordinate Bounding Boxes
  for (const [cityId, info] of Object.entries(MUNICIPAL_BOUNDS)) {
    if (
      lat >= info.minLat && lat <= info.maxLat &&
      lng >= info.minLng && lng <= info.maxLng
    ) {
      const auth = AUTHORITIES_DIRECTORY[cityId] || AUTHORITIES_DIRECTORY.GWINNETT_COUNTY;
      return {
        authority: auth,
        matchReason: `Coordinates fall within ${auth.name} municipal maintenance zone.`
      };
    }
  }

  // 5. Fallback: Gwinnett County DOT (Unincorporated County Roads)
  return {
    authority: AUTHORITIES_DIRECTORY.GWINNETT_COUNTY,
    matchReason: 'Location falls within Gwinnett County roadway maintenance jurisdiction (unincorporated GCDOT).'
  };
}
