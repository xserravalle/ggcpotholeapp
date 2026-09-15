import { ParkingLot } from '../types/parking';

export const PARKING_LOTS: ParkingLot[] = [
  {
    id: 'PARK-COSTCO-01',
    name: 'Costco Wholesale #187 (Lawrenceville / Duluth)',
    shortName: 'Costco (Venture Dr)',
    category: 'Club & Bulk Warehouse',
    address: '3980 Venture Dr, Duluth, GA 30096',
    city: 'Duluth / Lawrenceville border',
    latitude: 33.9575,
    longitude: -84.1350,
    corridor: 'Pleasant Hill Rd / Venture Dr',
    totalCapacity: 780,
    // Hourly baseline (00:00 to 23:00)
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 5, 12, 24, 45, 68, 84, 91, 88, 82, 79, 83, 89, 78, 64, 42, 18, 5, 0, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 8, 18, 42, 75, 94, 98, 99, 97, 98, 99, 96, 91, 82, 67, 39, 12, 0, 0, 0
    ],
    zones: [
      { id: 'z1', name: 'Front Entrance A-Row', capacity: 160, occupied: 154, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 18, adaSpotsOccupied: 16 },
      { id: 'z2', name: 'Tire Center & South Wing', capacity: 220, occupied: 185, evChargersTotal: 6, evChargersOccupied: 5, adaSpotsTotal: 10, adaSpotsOccupied: 7 },
      { id: 'z3', name: 'Gas Station Queue Bypass', capacity: 180, occupied: 172, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 6, adaSpotsOccupied: 5 },
      { id: 'z4', name: 'Rear Commercial Overflow Lot', capacity: 220, occupied: 98, evChargersTotal: 8, evChargersOccupied: 3, adaSpotsTotal: 8, adaSpotsOccupied: 2 }
    ],
    peakHoursDescription: 'Peak congestion on Saturdays & Sundays 11:30 AM - 4:30 PM. Gas lines spill into Venture Dr.',
    nearbyAlternativeId: 'PARK-SAMS-DULUTH',
    nearbyAlternativeName: 'Sam\'s Club Steve Reynolds (1.4 mi south, -28% load)',
    specialRules: 'Gas station queue adds 8-12 min to lot circulation during midday.',
    features: ['Costco Gas Fuel Station', 'Tire Center Parking', '8 Level-2 EV Plugs', 'Cart Corrals Every 2 Aisles']
  },
  {
    id: 'PARK-GGC-CAMPUS',
    name: 'Georgia Gwinnett College (GGC) - Parking Deck 1 & Student Center',
    shortName: 'GGC Parking Deck 1',
    category: 'Higher Education',
    address: '1000 University Center Ln, Lawrenceville, GA 30043',
    city: 'Lawrenceville',
    latitude: 33.9810,
    longitude: -84.0040,
    corridor: 'Collins Hill Rd / SR 316',
    totalCapacity: 1250,
    // Weekday class surges peaking at class turnover periods
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 8, 30, 68, 92, 96, 94, 98, 95, 92, 85, 71, 62, 54, 42, 22, 10, 2, 0, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 0, 5, 10, 15, 20, 22, 25, 24, 20, 18, 15, 12, 10, 8, 4, 0, 0, 0, 0
    ],
    zones: [
      { id: 'g1', name: 'Deck Level 1 (Faculty & Permit Only)', capacity: 250, occupied: 238, evChargersTotal: 12, evChargersOccupied: 11, adaSpotsTotal: 22, adaSpotsOccupied: 19 },
      { id: 'g2', name: 'Deck Level 2 (Student Commuter Core)', capacity: 320, occupied: 318, evChargersTotal: 8, evChargersOccupied: 8, adaSpotsTotal: 12, adaSpotsOccupied: 11 },
      { id: 'g3', name: 'Deck Level 3 (Student Upper)', capacity: 340, occupied: 312, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 8, adaSpotsOccupied: 6 },
      { id: 'g4', name: 'Deck Level 4 (Rooftop Open)', capacity: 340, occupied: 210, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 8, adaSpotsOccupied: 3 }
    ],
    peakHoursDescription: 'Critical peaks Mon-Thu at 10:45 AM, 12:15 PM, and 1:45 PM during class transitions.',
    nearbyAlternativeId: 'PARK-GGC-LOTH',
    nearbyAlternativeName: 'GGC Lot H (West Campus Perimeter, 4 min walk, 42% free)',
    specialRules: 'GGC Class-change wave triggers 15-minute gridlock at Collins Hill exit.',
    features: ['4-Story Covered Deck', 'Elevator Access', 'Campus Security Emergency Callboxes', '20 EV Chargers']
  },
  {
    id: 'PARK-GGC-LOTH',
    name: 'Georgia Gwinnett College (GGC) - Surface Lot H & Athletics',
    shortName: 'GGC Commuter Lot H',
    category: 'Higher Education',
    address: '1100 Gwinnett Pkwy, Lawrenceville, GA 30043',
    city: 'Lawrenceville',
    latitude: 33.9840,
    longitude: -84.0090,
    corridor: 'Collins Hill Rd',
    totalCapacity: 650,
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 4, 18, 45, 68, 79, 76, 82, 79, 74, 65, 52, 41, 30, 18, 8, 2, 0, 0, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 0, 5, 8, 12, 15, 18, 20, 22, 20, 16, 12, 8, 5, 2, 0, 0, 0, 0, 0
    ],
    zones: [
      { id: 'h1', name: 'Lot H North Section', capacity: 320, occupied: 245, evChargersTotal: 4, evChargersOccupied: 2, adaSpotsTotal: 12, adaSpotsOccupied: 7 },
      { id: 'h2', name: 'Lot H South / Soccer Field Side', capacity: 330, occupied: 190, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 10, adaSpotsOccupied: 4 }
    ],
    peakHoursDescription: 'Ideal overflow option when Deck 1 & 2 reach capacity between 11 AM - 2 PM.',
    nearbyAlternativeId: 'PARK-GGC-CAMPUS',
    nearbyAlternativeName: 'GGC Parking Deck 1',
    specialRules: 'Direct campus shuttle connects to Building A every 8 minutes.',
    features: ['Free Student Permit Zone', 'Campus Shuttle Stop', 'Direct Athletic Field Access']
  },
  {
    id: 'PARK-SAMS-DULUTH',
    name: 'Sam\'s Club (Duluth / Gwinnett Place)',
    shortName: 'Sam\'s Club Duluth',
    category: 'Club & Bulk Warehouse',
    address: '3450 Steve Reynolds Blvd, Duluth, GA 30096',
    city: 'Duluth',
    latitude: 33.9430,
    longitude: -84.1480,
    corridor: 'Steve Reynolds Blvd / Pleasant Hill Rd',
    totalCapacity: 690,
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 2, 10, 22, 40, 58, 71, 78, 74, 72, 70, 75, 79, 71, 55, 34, 15, 2, 0, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 5, 15, 35, 62, 85, 91, 93, 90, 92, 94, 91, 85, 74, 58, 32, 10, 0, 0, 0
    ],
    zones: [
      { id: 'sd1', name: 'Main Entrance Front Rows', capacity: 200, occupied: 188, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 14, adaSpotsOccupied: 12 },
      { id: 'sd2', name: 'Tire & Battery / Cafe Side', capacity: 240, occupied: 192, evChargersTotal: 4, evChargersOccupied: 3, adaSpotsTotal: 8, adaSpotsOccupied: 5 },
      { id: 'sd3', name: 'West Commercial Perimeter', capacity: 250, occupied: 120, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 8, adaSpotsOccupied: 2 }
    ],
    peakHoursDescription: 'Saturdays 1:00 PM - 5:00 PM, Sunday post-church grocery rush.',
    nearbyAlternativeId: 'PARK-COSTCO-01',
    nearbyAlternativeName: 'Costco Duluth (Venture Dr)',
    features: ['Sam\'s Club Fuel Station', 'Curbside Pickup Dedicated Stalls (24 spots)', 'Tire Center Bays']
  },
  {
    id: 'PARK-SAMS-SNELLVILLE',
    name: 'Sam\'s Club (Snellville / Scenic Hwy)',
    shortName: 'Sam\'s Club Snellville',
    category: 'Club & Bulk Warehouse',
    address: '1520 Scenic Hwy S, Snellville, GA 30078',
    city: 'Snellville',
    latitude: 33.8590,
    longitude: -84.0050,
    corridor: 'Scenic Hwy (SR 124)',
    totalCapacity: 620,
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 2, 8, 20, 38, 54, 68, 74, 70, 68, 69, 73, 76, 68, 52, 30, 12, 0, 0, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 4, 12, 30, 58, 80, 89, 92, 88, 90, 91, 88, 82, 70, 52, 28, 8, 0, 0, 0
    ],
    zones: [
      { id: 'ss1', name: 'Entrance Front Plaza', capacity: 180, occupied: 165, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 12, adaSpotsOccupied: 10 },
      { id: 'ss2', name: 'South Highway Side', capacity: 220, occupied: 175, evChargersTotal: 4, evChargersOccupied: 2, adaSpotsTotal: 8, adaSpotsOccupied: 4 },
      { id: 'ss3', name: 'Rear Delivery & Overflow', capacity: 220, occupied: 95, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 6, adaSpotsOccupied: 1 }
    ],
    peakHoursDescription: 'Scenic Hwy weekend surge creates backlog at SR 124 curb cuts.',
    nearbyAlternativeId: 'PARK-WALMART-SNELLVILLE',
    nearbyAlternativeName: 'Walmart Supercenter Snellville (0.5 mi south)',
    features: ['Bulk Loading Area', 'Optical & Pharmacy Curbside', 'Sam\'s Club Gas Station']
  },
  {
    id: 'PARK-WALMART-DULUTH',
    name: 'Walmart Supercenter (Duluth / Pleasant Hill Rd)',
    shortName: 'Walmart Duluth (Pleasant Hill)',
    category: 'Supercenter',
    address: '2635 Pleasant Hill Rd, Duluth, GA 30096',
    city: 'Duluth',
    latitude: 33.9580,
    longitude: -84.1280,
    corridor: 'Pleasant Hill Rd',
    totalCapacity: 850,
    baseOccupancyRates: [
      2, 1, 0, 0, 0, 6, 18, 35, 52, 65, 75, 82, 80, 78, 82, 86, 88, 85, 78, 62, 40, 20, 8, 4
    ],
    weekendOccupancyRates: [
      4, 2, 0, 0, 1, 8, 22, 45, 68, 84, 92, 95, 94, 95, 96, 95, 92, 88, 82, 68, 45, 25, 12, 6
    ],
    zones: [
      { id: 'wd1', name: 'Grocery Entrance (West)', capacity: 280, occupied: 270, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 18, adaSpotsOccupied: 17 },
      { id: 'wd2', name: 'Home & Electronics (East)', capacity: 290, occupied: 245, evChargersTotal: 4, evChargersOccupied: 4, adaSpotsTotal: 16, adaSpotsOccupied: 12 },
      { id: 'wd3', name: 'Outer Perimeter & EVgo Hub', capacity: 280, occupied: 155, evChargersTotal: 8, evChargersOccupied: 6, adaSpotsTotal: 8, adaSpotsOccupied: 3 }
    ],
    peakHoursDescription: 'Very high volume daily between 3 PM - 8 PM; weekend peaks hit 95%+.',
    nearbyAlternativeId: 'PARK-COSTCO-01',
    nearbyAlternativeName: 'Costco Lawrenceville / Duluth',
    features: ['EVgo DC Fast Chargers (8 stalls)', 'Online Grocery Pickup (30 stalls)', 'Subway & Pharmacy']
  },
  {
    id: 'PARK-WALMART-LAWRENCEVILLE',
    name: 'Walmart Supercenter (Lawrenceville / Riverside Pkwy)',
    shortName: 'Walmart Lawrenceville',
    category: 'Supercenter',
    address: '1400 Lawrenceville Hwy, Lawrenceville, GA 30046',
    city: 'Lawrenceville',
    latitude: 33.9480,
    longitude: -84.0120,
    corridor: 'Lawrenceville Hwy (US-29)',
    totalCapacity: 800,
    baseOccupancyRates: [
      1, 0, 0, 0, 0, 5, 15, 30, 48, 60, 70, 75, 74, 72, 76, 80, 84, 80, 72, 55, 34, 16, 5, 2
    ],
    weekendOccupancyRates: [
      2, 1, 0, 0, 0, 7, 18, 38, 62, 78, 86, 90, 89, 90, 92, 91, 87, 80, 70, 52, 32, 18, 8, 4
    ],
    zones: [
      { id: 'wl1', name: 'Grocery Entry Front', capacity: 270, occupied: 245, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 16, adaSpotsOccupied: 14 },
      { id: 'wl2', name: 'General Merchandise Wing', capacity: 270, occupied: 215, evChargersTotal: 2, evChargersOccupied: 1, adaSpotsTotal: 14, adaSpotsOccupied: 10 },
      { id: 'wl3', name: 'Outer Ring & Auto Care', capacity: 260, occupied: 125, evChargersTotal: 4, evChargersOccupied: 2, adaSpotsTotal: 6, adaSpotsOccupied: 2 }
    ],
    peakHoursDescription: 'Steady afternoon traffic, heavy evening rush between 5:30 - 7:30 PM.',
    nearbyAlternativeId: 'PARK-GGC-CAMPUS',
    nearbyAlternativeName: 'Georgia Gwinnett College (2 mi north)',
    features: ['Auto Care Center', 'Garden Center Stalls', 'Curbside Pickup']
  },
  {
    id: 'PARK-SUGARLOAF-MILLS',
    name: 'Sugarloaf Mills Mall (5,000+ Multi-Zone Facility)',
    shortName: 'Sugarloaf Mills Mall',
    category: 'Regional Mall',
    address: '5900 Sugarloaf Pkwy, Lawrenceville, GA 30043',
    city: 'Lawrenceville',
    latitude: 33.9780,
    longitude: -84.0620,
    corridor: 'Sugarloaf Pkwy / I-85 Exit 108',
    totalCapacity: 5200,
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 1, 4, 8, 14, 25, 42, 54, 52, 50, 55, 62, 70, 72, 68, 54, 38, 18, 5, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 2, 6, 12, 28, 55, 78, 88, 91, 93, 95, 94, 92, 89, 84, 72, 52, 28, 10, 0
    ],
    zones: [
      { id: 'sm1', name: 'AMC Theatres & Dave & Buster\'s Wing', capacity: 1400, occupied: 1120, evChargersTotal: 8, evChargersOccupied: 7, adaSpotsTotal: 40, adaSpotsOccupied: 32 },
      { id: 'sm2', name: 'Bass Pro Shops Outdoor World Section', capacity: 1200, occupied: 940, evChargersTotal: 6, evChargersOccupied: 4, adaSpotsTotal: 34, adaSpotsOccupied: 25 },
      { id: 'sm3', name: 'Food Court & Medieval Times Entrance', capacity: 1300, occupied: 1150, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 36, adaSpotsOccupied: 30 },
      { id: 'sm4', name: 'North Perimeter Overflow Ring', capacity: 1300, occupied: 410, evChargersTotal: 10, evChargersOccupied: 3, adaSpotsTotal: 20, adaSpotsOccupied: 5 }
    ],
    peakHoursDescription: 'Massive Friday & Saturday evening entertainment crowds (AMC/Medieval Times/Bass Pro).',
    nearbyAlternativeId: 'PARK-GWINNETT-PLACE',
    nearbyAlternativeName: 'Gwinnett Place Central Area (2.8 mi south)',
    specialRules: 'Holiday shopping surges push entire 5,200 capacity to 98% during Thanksgiving/Christmas.',
    features: ['Electrify America Ultra-Fast Hub (10 stalls)', 'Covered Valet Entrance', 'Ride-Share Designated Pick-up Zones']
  },
  {
    id: 'PARK-GWINNETT-PLACE',
    name: 'Gwinnett Place Hub (Mega Mart & Beauty Master Center)',
    shortName: 'Gwinnett Place Plaza',
    category: 'Major Asian Plaza / Corridor',
    address: '2100 Pleasant Hill Rd, Duluth, GA 30096',
    city: 'Duluth',
    latitude: 33.9610,
    longitude: -84.1380,
    corridor: 'Pleasant Hill Rd / Satellite Blvd',
    totalCapacity: 1400,
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 2, 6, 15, 28, 42, 58, 65, 62, 60, 64, 68, 70, 68, 58, 42, 22, 8, 2, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 3, 10, 24, 48, 70, 84, 88, 86, 88, 89, 87, 83, 76, 65, 46, 24, 6, 0, 0
    ],
    zones: [
      { id: 'gp1', name: 'Mega Mart Front Plaza', capacity: 450, occupied: 395, evChargersTotal: 4, evChargersOccupied: 4, adaSpotsTotal: 20, adaSpotsOccupied: 18 },
      { id: 'gp2', name: 'Beauty Master & Food Hall Lot', capacity: 450, occupied: 370, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 18, adaSpotsOccupied: 14 },
      { id: 'gp3', name: 'Ring Road Redevelopment Expansion Lot', capacity: 500, occupied: 160, evChargersTotal: 6, evChargersOccupied: 2, adaSpotsTotal: 14, adaSpotsOccupied: 4 }
    ],
    peakHoursDescription: 'High lunch and dinner traffic for Mega Mart food court and adjacent Korean BBQ restaurants.',
    nearbyAlternativeId: 'PARK-HMART-PLAZA',
    nearbyAlternativeName: 'H Mart Plaza (1.1 mi north on Pleasant Hill)',
    features: ['High Pedestrian Flow', '24/7 Security Patrol', 'Bus Transit Connect']
  },
  {
    id: 'PARK-HMART-PLAZA',
    name: 'H Mart & Asian Dining Plaza (Pleasant Hill Rd)',
    shortName: 'H Mart Plaza Duluth',
    category: 'Major Asian Plaza / Corridor',
    address: '2550 Pleasant Hill Rd, Duluth, GA 30096',
    city: 'Duluth',
    latitude: 33.9635,
    longitude: -84.1310,
    corridor: 'Pleasant Hill Rd',
    totalCapacity: 520,
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 1, 5, 14, 30, 52, 76, 88, 85, 78, 74, 80, 86, 84, 76, 58, 32, 10, 2, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 2, 8, 22, 54, 82, 94, 97, 95, 96, 97, 95, 92, 88, 79, 60, 34, 12, 0, 0
    ],
    zones: [
      { id: 'hm1', name: 'Main Supermarket Row', capacity: 220, occupied: 212, evChargersTotal: 2, evChargersOccupied: 2, adaSpotsTotal: 12, adaSpotsOccupied: 11 },
      { id: 'hm2', name: 'Bakery & Restaurant Wing', capacity: 180, occupied: 168, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 8, adaSpotsOccupied: 7 },
      { id: 'hm3', name: 'East Boundary Overflow', capacity: 120, occupied: 65, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 4, adaSpotsOccupied: 1 }
    ],
    peakHoursDescription: 'Very compact lot; severe circling delays during 12 PM - 2 PM and 6 PM - 8 PM.',
    nearbyAlternativeId: 'PARK-GWINNETT-PLACE',
    nearbyAlternativeName: 'Gwinnett Place Plaza (3 mins away, +35% vacancy)',
    features: ['High Turnover Grocery', 'Direct Pleasant Hill Access', 'Compact Car Priority Stalls']
  },
  {
    id: 'PARK-TARGET-PLEASANT-HILL',
    name: 'Target & Best Buy Power Center (Pleasant Hill)',
    shortName: 'Target / Best Buy Duluth',
    category: 'Big Box & Power Center',
    address: '1905 Pleasant Hill Rd, Duluth, GA 30096',
    city: 'Duluth',
    latitude: 33.9540,
    longitude: -84.1410,
    corridor: 'Pleasant Hill Rd',
    totalCapacity: 920,
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 2, 8, 18, 35, 52, 68, 76, 74, 70, 73, 79, 84, 80, 72, 54, 30, 10, 2, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 4, 12, 28, 56, 78, 88, 92, 90, 91, 92, 90, 86, 80, 70, 50, 25, 8, 0, 0
    ],
    zones: [
      { id: 'tb1', name: 'Target Front Drive-Up Section', capacity: 340, occupied: 300, evChargersTotal: 6, evChargersOccupied: 5, adaSpotsTotal: 20, adaSpotsOccupied: 18 },
      { id: 'tb2', name: 'Best Buy & Total Wine Wing', capacity: 320, occupied: 260, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 14, adaSpotsOccupied: 10 },
      { id: 'tb3', name: 'Central Power Center Concourse', capacity: 260, occupied: 150, evChargersTotal: 4, evChargersOccupied: 2, adaSpotsTotal: 10, adaSpotsOccupied: 4 }
    ],
    peakHoursDescription: 'Target Drive-Up pickup bays experience sharp peaks between 4:30 PM - 7:00 PM.',
    nearbyAlternativeId: 'PARK-COSTCO-01',
    nearbyAlternativeName: 'Costco Wholesale Duluth',
    features: ['Target Drive-Up Dedicated Spots (32)', 'Tesla Supercharger Hub (12 stalls)', 'Best Buy Geek Squad Bay']
  },
  {
    id: 'PARK-HOMEDEPOT-LOWES-SNELLVILLE',
    name: 'Home Depot & Lowe\'s Home Improvement Ring (Scenic Hwy)',
    shortName: 'Home Depot / Lowe\'s Snellville',
    category: 'Big Box & Power Center',
    address: '1675 Scenic Hwy S, Snellville, GA 30078',
    city: 'Snellville',
    latitude: 33.8560,
    longitude: -84.0180,
    corridor: 'Scenic Hwy (SR 124)',
    totalCapacity: 890,
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 8, 22, 45, 62, 70, 74, 76, 72, 68, 69, 72, 74, 68, 52, 34, 14, 4, 0, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 12, 35, 68, 88, 94, 95, 93, 89, 88, 86, 82, 75, 64, 48, 28, 10, 0, 0, 0
    ],
    zones: [
      { id: 'hd1', name: 'Home Depot Contractor / Pro Entrance', capacity: 280, occupied: 245, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 16, adaSpotsOccupied: 13 },
      { id: 'hd2', name: 'Lowe\'s Garden Center Section', capacity: 310, occupied: 270, evChargersTotal: 4, evChargersOccupied: 3, adaSpotsTotal: 16, adaSpotsOccupied: 12 },
      { id: 'hd3', name: 'Trailer & Lumber Loading Lot', capacity: 300, occupied: 170, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 8, adaSpotsOccupied: 3 }
    ],
    peakHoursDescription: 'Saturday morning peak (7:30 AM - 1:00 PM) driven by DIY homeowners & trade contractors.',
    nearbyAlternativeId: 'PARK-SAMS-SNELLVILLE',
    nearbyAlternativeName: 'Sam\'s Club Snellville',
    features: ['Extra-Wide Contractor Vehicle Stalls', 'Tool Rental Bays', 'Trailer Turnaround Space']
  },
  {
    id: 'PARK-PUBLIX-SUWANEE',
    name: 'Publix at Suwanee Jubilee Shopping Center',
    shortName: 'Publix Suwanee Jubilee',
    category: 'Grocery Center',
    address: '1500 Peachtree Industrial Blvd, Suwanee, GA 30024',
    city: 'Suwanee',
    latitude: 34.0510,
    longitude: -84.0750,
    corridor: 'Peachtree Industrial Blvd',
    totalCapacity: 480,
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 2, 8, 22, 40, 54, 65, 72, 70, 66, 68, 74, 82, 80, 70, 50, 26, 8, 0, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 4, 12, 30, 55, 74, 82, 85, 84, 82, 84, 85, 83, 76, 64, 42, 20, 6, 0, 0
    ],
    zones: [
      { id: 'ps1', name: 'Publix Market Front Plaza', capacity: 220, occupied: 185, evChargersTotal: 4, evChargersOccupied: 3, adaSpotsTotal: 12, adaSpotsOccupied: 10 },
      { id: 'ps2', name: 'Jubilee Boutique Retail Wing', capacity: 160, occupied: 110, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 8, adaSpotsOccupied: 4 },
      { id: 'ps3', name: 'South Overflow Tier', capacity: 100, occupied: 35, evChargersTotal: 2, evChargersOccupied: 0, adaSpotsTotal: 4, adaSpotsOccupied: 1 }
    ],
    peakHoursDescription: 'Evenings 5 PM - 7:30 PM dinner rush; Sunday noon grocery peak.',
    nearbyAlternativeId: 'PARK-PUBLIX-PTC',
    nearbyAlternativeName: 'Publix Peachtree Corners Town Center',
    features: ['Publix Curbside Pick Up', 'EV Charging Stalls', 'Walkable Town Jubilee Dining']
  },
  {
    id: 'PARK-PUBLIX-PTC',
    name: 'Publix at Peachtree Corners Town Center',
    shortName: 'Publix PTC Town Center',
    category: 'Grocery Center',
    address: '5200 Town Center Blvd, Peachtree Corners, GA 30092',
    city: 'Peachtree Corners',
    latitude: 33.9702,
    longitude: -84.2210,
    corridor: 'Peachtree Pkwy / Town Center Blvd',
    totalCapacity: 560,
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 3, 10, 25, 44, 58, 68, 74, 72, 69, 72, 78, 85, 84, 76, 58, 30, 10, 0, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 5, 15, 34, 60, 78, 86, 88, 87, 86, 88, 89, 87, 82, 72, 50, 24, 8, 0, 0
    ],
    zones: [
      { id: 'pt1', name: 'Publix Front Line', capacity: 240, occupied: 205, evChargersTotal: 6, evChargersOccupied: 5, adaSpotsTotal: 14, adaSpotsOccupied: 12 },
      { id: 'pt2', name: 'Town Green Amphitheater Wing', capacity: 180, occupied: 155, evChargersTotal: 4, evChargersOccupied: 3, adaSpotsTotal: 8, adaSpotsOccupied: 6 },
      { id: 'pt3', name: 'Curiosity Lab Autonomous Shuttle Bay', capacity: 140, occupied: 65, evChargersTotal: 4, evChargersOccupied: 2, adaSpotsTotal: 6, adaSpotsOccupied: 2 }
    ],
    peakHoursDescription: 'Concert & Town Green weekend event evenings reach 95%+ capacity.',
    nearbyAlternativeId: 'PARK-PUBLIX-SUWANEE',
    nearbyAlternativeName: 'Publix Suwanee Jubilee',
    features: ['Curiosity Lab Autonomous Shuttle Stop', 'EV Fast Charging', 'Direct Town Green Access']
  },
  {
    id: 'PARK-KROGER-DULUTH',
    name: 'Kroger at Gwinnett Crossing (Satellite & Pleasant Hill)',
    shortName: 'Kroger Gwinnett Crossing',
    category: 'Grocery Center',
    address: '3780 Old Norcross Rd, Duluth, GA 30096',
    city: 'Duluth',
    latitude: 33.9510,
    longitude: -84.1290,
    corridor: 'Satellite Blvd / Old Norcross Rd',
    totalCapacity: 450,
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 2, 10, 24, 42, 56, 68, 75, 73, 70, 72, 77, 83, 80, 71, 52, 28, 8, 0, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 4, 14, 32, 58, 76, 84, 86, 85, 84, 86, 87, 84, 78, 66, 44, 20, 6, 0, 0
    ],
    zones: [
      { id: 'kd1', name: 'Kroger Main Store Aisles', capacity: 250, occupied: 205, evChargersTotal: 2, evChargersOccupied: 2, adaSpotsTotal: 12, adaSpotsOccupied: 10 },
      { id: 'kd2', name: 'Kroger Fuel & Pharmacy Drive-Thru', capacity: 200, occupied: 135, evChargersTotal: 0, evChargersOccupied: 0, adaSpotsTotal: 8, adaSpotsOccupied: 4 }
    ],
    peakHoursDescription: 'Convenient grocery stop with steady weekday 5 PM - 7 PM turnover.',
    nearbyAlternativeId: 'PARK-WALMART-DULUTH',
    nearbyAlternativeName: 'Walmart Duluth Pleasant Hill',
    features: ['Kroger Fuel Center', 'Pharmacy Drive-thru Lane', 'Kroger Delivery Hub']
  },
  {
    id: 'PARK-SATELLITE-CORP',
    name: 'Satellite Blvd Corporate & Medical Plaza Center',
    shortName: 'Satellite Blvd Business Plaza',
    category: 'Big Box & Power Center',
    address: '2800 Satellite Blvd, Duluth, GA 30096',
    city: 'Duluth',
    latitude: 33.9650,
    longitude: -84.1150,
    corridor: 'Satellite Blvd',
    totalCapacity: 600,
    baseOccupancyRates: [
      0, 0, 0, 0, 0, 4, 16, 52, 85, 91, 88, 84, 78, 82, 85, 79, 64, 42, 22, 8, 2, 0, 0, 0
    ],
    weekendOccupancyRates: [
      0, 0, 0, 0, 0, 0, 2, 5, 10, 14, 18, 20, 19, 18, 16, 14, 12, 8, 4, 0, 0, 0, 0, 0
    ],
    zones: [
      { id: 'sc1', name: 'Medical Office Pavilion', capacity: 260, occupied: 235, evChargersTotal: 6, evChargersOccupied: 5, adaSpotsTotal: 18, adaSpotsOccupied: 16 },
      { id: 'sc2', name: 'Professional Services Concourse', capacity: 340, occupied: 280, evChargersTotal: 4, evChargersOccupied: 3, adaSpotsTotal: 12, adaSpotsOccupied: 7 }
    ],
    peakHoursDescription: 'Heavy weekday business hours (9 AM - 4 PM); virtually empty on weekends.',
    nearbyAlternativeId: 'PARK-SUGARLOAF-MILLS',
    nearbyAlternativeName: 'Sugarloaf Mills Mall (1.2 mi north)',
    features: ['High ADA Stall Ratio', 'Designated Patient Drop-Off Loop', 'Covered Walkways']
  }
];
