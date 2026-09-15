export interface GeocodeResult {
  address: string;
  road: string;
  city: string;
  full: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const resp = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      const addressObj = data.address || {};
      const road = addressObj.road || addressObj.pedestrian || addressObj.street || '';
      const city = addressObj.city || addressObj.town || addressObj.county || 'Lawrenceville';
      const state = addressObj.state || 'GA';
      const postcode = addressObj.postcode || '';

      const cleanAddr = [road, city, `${state} ${postcode}`].filter(Boolean).join(', ');
      return {
        address: cleanAddr || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        road: road || 'Local Roadway',
        city: city || 'Lawrenceville',
        full: data.display_name || cleanAddr
      };
    }
  } catch {
    // Ignore network error and fall through to heuristic
  }

  // Fallback heuristic based on GGC campus coordinates
  if (lat >= 33.9740 && lat <= 33.9870 && lng >= -84.0150 && lng <= -83.9960) {
    return {
      address: '1000 University Center Ln, Lawrenceville, GA 30043 (GGC Campus)',
      road: 'University Center Ln',
      city: 'Lawrenceville',
      full: 'Georgia Gwinnett College Campus, Lawrenceville, GA'
    };
  }

  return {
    address: `Roadway at (${lat.toFixed(4)}, ${lng.toFixed(4)}), Lawrenceville, GA`,
    road: 'Local Roadway',
    city: 'Lawrenceville',
    full: `Gwinnett County, GA (${lat.toFixed(4)}, ${lng.toFixed(4)})`
  };
}
