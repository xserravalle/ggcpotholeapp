import { ParkingLot, SimulationParams, CalculatedParkingState } from '../types/parking';

export function calculateParkingState(lot: ParkingLot, params: SimulationParams): CalculatedParkingState {
  const isWeekend = params.dayOfWeek === 'Saturday' || params.dayOfWeek === 'Sunday';
  const hour = Math.max(0, Math.min(23, params.hourOfDay));
  
  // 1. Get baseline occupancy for this hour
  let baseRate = isWeekend 
    ? (lot.weekendOccupancyRates[hour] ?? 50) 
    : (lot.baseOccupancyRates[hour] ?? 50);

  // Linear interpolation with next hour based on minuteOfDay
  const nextHour = (hour + 1) % 24;
  const nextRate = isWeekend 
    ? (lot.weekendOccupancyRates[nextHour] ?? 50) 
    : (lot.baseOccupancyRates[nextHour] ?? 50);
  const minuteFraction = params.minuteOfDay / 60;
  let blendedRate = baseRate + (nextRate - baseRate) * minuteFraction;

  // 2. Apply Weekend Rush Surge
  if (params.isWeekendRush && isWeekend) {
    if (lot.category === 'Club & Bulk Warehouse' || lot.category === 'Regional Mall' || lot.category === 'Supercenter') {
      blendedRate = blendedRate * 1.18 + 5;
    }
  }

  // 3. Apply Holiday Shopping Surge (+35% retail boost, capped at 99%)
  if (params.isHolidaySurge) {
    if (lot.category !== 'Higher Education') {
      blendedRate = Math.min(99, blendedRate * 1.35 + 8);
    }
  }

  // 4. Apply GGC Class-Change Surge
  const isGgcLot = lot.id.includes('GGC');
  if (isGgcLot && !isWeekend) {
    // Check if current time is near typical GGC class change slots (e.g., 10:45 AM, 12:15 PM, 1:45 PM, 3:15 PM)
    const timeInHours = hour + params.minuteOfDay / 60;
    const isNearClassChangeTime = 
      (timeInHours >= 10.5 && timeInHours <= 11.2) ||
      (timeInHours >= 12.0 && timeInHours <= 12.6) ||
      (timeInHours >= 13.5 && timeInHours <= 14.1) ||
      (timeInHours >= 15.0 && timeInHours <= 15.5);

    if (params.isGgcClassChange || isNearClassChangeTime) {
      blendedRate = Math.min(98, blendedRate * 1.30 + 12);
    }
  }

  // 5. Apply Rainy Weather Modifier (slower circulation, +8%)
  if (params.isRainWeather) {
    blendedRate = Math.min(98, blendedRate * 1.08 + 4);
  }

  // Final clamped rate
  const finalRate = Math.max(0, Math.min(99, Math.round(blendedRate)));
  const occupiedSpots = Math.round((finalRate / 100) * lot.totalCapacity);
  const availableSpots = Math.max(0, lot.totalCapacity - occupiedSpots);

  // Status classification
  let congestionStatus: 'plentiful' | 'moderate' | 'congested' | 'full';
  if (finalRate < 60) {
    congestionStatus = 'plentiful';
  } else if (finalRate < 82) {
    congestionStatus = 'moderate';
  } else if (finalRate < 94) {
    congestionStatus = 'congested';
  } else {
    congestionStatus = 'full';
  }

  // Estimated time to find a spot calculation
  let estimatedTimeToFindSpotMinutes: number;
  if (finalRate < 50) {
    estimatedTimeToFindSpotMinutes = 1;
  } else if (finalRate < 70) {
    estimatedTimeToFindSpotMinutes = 2;
  } else if (finalRate < 82) {
    estimatedTimeToFindSpotMinutes = 4;
  } else if (finalRate < 90) {
    estimatedTimeToFindSpotMinutes = 7;
  } else if (finalRate < 95) {
    estimatedTimeToFindSpotMinutes = 11;
  } else {
    estimatedTimeToFindSpotMinutes = 16;
  }

  // Adjust wait time if rain
  if (params.isRainWeather && estimatedTimeToFindSpotMinutes > 2) {
    estimatedTimeToFindSpotMinutes += 2;
  }

  // Smart recommendation logic
  let recommendation = 'Plenty of available parking spaces. Drive right in.';
  let recommendedZone = lot.zones[0]?.name ?? 'Main Lot';

  if (congestionStatus === 'full') {
    if (lot.zones.length > 2) {
      recommendedZone = lot.zones[lot.zones.length - 1].name;
      recommendation = `Lot is at critical capacity (${finalRate}%). Bypass main entrance; head directly to ${recommendedZone}.`;
    } else {
      recommendation = `Lot is nearly saturated (${finalRate}%). Extended search delay (~${estimatedTimeToFindSpotMinutes} min).`;
    }
  } else if (congestionStatus === 'congested') {
    const leastOccupiedZone = [...lot.zones].sort((a, b) => (a.occupied / a.capacity) - (b.occupied / b.capacity))[0];
    recommendedZone = leastOccupiedZone?.name ?? lot.zones[0]?.name;
    recommendation = `Filling quickly. Recommended target: ${recommendedZone} (~${estimatedTimeToFindSpotMinutes} min search).`;
  } else if (congestionStatus === 'moderate') {
    recommendation = `Moderate turnover. Good availability in ${lot.zones[0]?.name ?? 'Main Section'}.`;
  }

  // Estimated turnover rate (cars per hour)
  const turnoverRatePerHour = Math.round(lot.totalCapacity * (0.25 + (finalRate / 200)));

  return {
    lotId: lot.id,
    occupancyPercent: finalRate,
    occupiedSpots,
    availableSpots,
    congestionStatus,
    estimatedTimeToFindSpotMinutes,
    turnoverRatePerHour,
    recommendation,
    recommendedZone
  };
}

export function generate24HourForecast(lot: ParkingLot, params: SimulationParams) {
  const points = [];
  for (let h = 6; h <= 23; h++) {
    const state = calculateParkingState(lot, {
      ...params,
      hourOfDay: h,
      minuteOfDay: 0
    });
    const label = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
    points.push({
      hour: h,
      label,
      occupancy: state.occupancyPercent,
      available: state.availableSpots,
      waitMinutes: state.estimatedTimeToFindSpotMinutes
    });
  }
  return points;
}

export function generate7DayCongestionMatrix(lot: ParkingLot, currentHour: number) {
  const days: SimulationParams['dayOfWeek'][] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];
  const hours = [8, 10, 12, 14, 16, 18, 20, 22]; // Sample hours

  return days.map(day => {
    const hourlyData: Record<number, number> = {};
    hours.forEach(h => {
      const state = calculateParkingState(lot, {
        dayOfWeek: day,
        hourOfDay: h,
        minuteOfDay: 0,
        isHolidaySurge: false,
        isWeekendRush: true,
        isGgcClassChange: false,
        isRainWeather: false
      });
      hourlyData[h] = state.occupancyPercent;
    });
    return {
      day,
      hours: hourlyData
    };
  });
}
