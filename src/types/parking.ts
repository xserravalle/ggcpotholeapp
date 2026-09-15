export type ParkingLotCategory = 
  | 'Club & Bulk Warehouse' 
  | 'Higher Education' 
  | 'Supercenter' 
  | 'Grocery Center' 
  | 'Regional Mall' 
  | 'Big Box & Power Center' 
  | 'Major Asian Plaza / Corridor';

export interface ParkingZone {
  id: string;
  name: string; // e.g., 'Deck 1 Level 2', 'Front Row East', 'Overflow Lot'
  capacity: number;
  occupied: number;
  evChargersTotal: number;
  evChargersOccupied: number;
  adaSpotsTotal: number;
  adaSpotsOccupied: number;
}

export interface ParkingLot {
  id: string;
  name: string;
  shortName: string;
  category: ParkingLotCategory;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  corridor: string; // e.g. 'Pleasant Hill Rd', 'Satellite Blvd', 'Scenic Hwy', 'Sugarloaf Pkwy'
  totalCapacity: number;
  baseOccupancyRates: number[]; // 24 hourly baselines (0-23)
  weekendOccupancyRates: number[]; // 24 hourly weekend baselines
  zones: ParkingZone[];
  peakHoursDescription: string;
  nearbyAlternativeId?: string;
  nearbyAlternativeName?: string;
  specialRules?: string; // e.g., 'GGC Class change peak at 10:45 AM & 12:15 PM'
  features: string[]; // e.g. ['Covered Parking', 'EV Fast Charging', 'Gas Station Queue']
}

export interface SimulationParams {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  hourOfDay: number; // 0 to 23
  minuteOfDay: number; // 0 to 59
  isHolidaySurge: boolean; // Black Friday / Holiday shopping surge (+35-45% retail)
  isWeekendRush: boolean; // Weekend shopping rush modifier
  isGgcClassChange: boolean; // GGC 15-minute class change surge (+30% campus traffic)
  isRainWeather: boolean; // Bad weather effect (+15% slower turnover)
}

export interface CalculatedParkingState {
  lotId: string;
  occupancyPercent: number; // 0 - 100
  occupiedSpots: number;
  availableSpots: number;
  congestionStatus: 'plentiful' | 'moderate' | 'congested' | 'full';
  estimatedTimeToFindSpotMinutes: number;
  turnoverRatePerHour: number;
  recommendation: string;
  recommendedZone?: string;
}
