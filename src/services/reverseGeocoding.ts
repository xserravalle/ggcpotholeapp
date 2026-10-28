export interface GeocodeResult {
  address: string;
  road: string;
  city: string;
  full: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  // Strategy 1: Nominatim OpenStreetMap Reverse Geocode
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const resp = await fetch(url, {
      headers: { 
        'Accept-Language': 'en'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      const addr = data.address || {};
      const houseNumber = addr.house_number || '';
      const road = addr.road || addr.pedestrian || addr.street || addr.highway || addr.footway || '';
      const building = addr.amenity || addr.building || addr.shop || addr.leisure || '';
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Lawrenceville';
      const state = addr.state_code || (addr.state === 'Georgia' ? 'GA' : addr.state) || 'GA';
      const postcode = addr.postcode || '';

      let streetSpecific = '';
      if (houseNumber && road) {
        streetSpecific = `${houseNumber} ${road}`;
      } else if (building && road) {
        streetSpecific = `${building}, ${road}`;
      } else if (road) {
        streetSpecific = road;
      } else if (building) {
        streetSpecific = building;
      } else if (data.display_name) {
        const parts = data.display_name.split(',').map((s: string) => s.trim());
        streetSpecific = parts.slice(0, 2).join(', ');
      }

      if (streetSpecific) {
        const formatted = [streetSpecific, city, `${state} ${postcode}`.trim()].filter(Boolean).join(', ');
        return {
          address: formatted,
          road: road || streetSpecific,
          city,
          full: data.display_name || formatted
        };
      }
    }
  } catch {
    // Continue to Strategy 2
  }

  // Strategy 2: Photon Reverse Geocoder (High-speed Komoot OpenStreetMap mirror)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    const resp = await fetch(photonUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      const prop = data.features?.[0]?.properties || {};
      const houseNumber = prop.housenumber || '';
      const street = prop.street || '';
      const name = prop.name || '';
      const city = prop.city || prop.county || 'Lawrenceville';
      const state = prop.state === 'Georgia' ? 'GA' : (prop.state || 'GA');
      const postcode = prop.postcode || '';

      let streetSpecific = '';
      if (houseNumber && street) {
        streetSpecific = `${houseNumber} ${street}`;
      } else if (name && street) {
        streetSpecific = `${name}, ${street}`;
      } else if (street) {
        streetSpecific = street;
      } else if (name) {
        streetSpecific = name;
      }

      if (streetSpecific) {
        const formatted = [streetSpecific, city, `${state} ${postcode}`.trim()].filter(Boolean).join(', ');
        return {
          address: formatted,
          road: street || streetSpecific,
          city,
          full: formatted
        };
      }
    }
  } catch {
    // Continue to Strategy 3 fallback
  }

  // Strategy 3: Campus & Regional Roadway Heuristics
  if (lat >= 33.9740 && lat <= 33.9870 && lng >= -84.0150 && lng <= -83.9960) {
    return {
      address: '1000 University Center Ln, Lawrenceville, GA 30043',
      road: 'University Center Ln',
      city: 'Lawrenceville',
      full: 'Georgia Gwinnett College Campus, Lawrenceville, GA 30043'
    };
  }

  return {
    address: `Roadway near ${lat.toFixed(4)}, ${lng.toFixed(4)}, Lawrenceville, GA`,
    road: 'Local Roadway',
    city: 'Lawrenceville',
    full: `Gwinnett County Roadway (${lat.toFixed(4)}, ${lng.toFixed(4)})`
  };
}
