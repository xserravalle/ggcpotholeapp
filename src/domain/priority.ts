import { PotholeReport, ReportPriority } from './types';

/**
 * SCORING WEIGHTS BREAKDOWN (Total: 0 to 100 points)
 * --------------------------------------------------
 * 1. Severity Weight (max 45 points):
 *    - 'critical': 45 pts (axle damage / immediate hazard)
 *    - 'severe':   35 pts (deep cavity > 4 inches)
 *    - 'moderate': 20 pts (cavity 2-4 inches)
 *    - 'minor':    10 pts (surface defect < 2 inches)
 *
 * 2. Confirmations Weight (max 25 points, capped):
 *    - 5 points per citizen confirmation, capped at 5 confirmations (5 * 5 = 25 pts)
 *
 * 3. Peak G-Force Telemetry Bonus (max 20 points):
 *    - >= 6.0G: 20 pts (violent impact)
 *    - >= 4.0G: 14 pts (hard shock)
 *    - >= 2.5G:  8 pts (noticeable bump)
 *    - > 0G or sensorDetected: 4 pts
 *
 * 4. High-Speed Highway / GDOT Corridor Bonus (max 10 points):
 *    - GDOT jurisdiction or high-speed arterial corridor (GA-316, I-85, etc.): 10 pts
 *    - Campus internal core (pedestrian density): 5 pts
 *    - Municipal local street: 0 pts
 */

const GDOT_HIGHWAY_PATTERNS = [
  'gdot',
  'ga-316',
  'ga 316',
  'sr-316',
  'sr 316',
  'i-85',
  'i 85',
  'i-985',
  'i 985',
  'interstate',
  'ga-20',
  'ga 20',
  'sr-20',
  'ga-120',
  'ga 120',
  'sr-120',
  'ga-124',
  'ga 124',
  'us-78',
  'us 78',
  'us-29',
  'university pkwy',
];

/**
 * Calculates a deterministic priority score between 0 and 100 for a pothole report.
 */
export function priorityScore(report: Partial<PotholeReport>): number {
  let score = 0;

  // 1. Severity weight (0 - 45)
  switch (report.severity) {
    case 'critical':
      score += 45;
      break;
    case 'severe':
      score += 35;
      break;
    case 'moderate':
      score += 20;
      break;
    case 'minor':
    default:
      score += 10;
      break;
  }

  // 2. Confirmations (0 - 25, capped at 5 confirmations)
  const confirmations = Math.max(0, report.verificationsCount ?? 0);
  score += Math.min(25, confirmations * 5);

  // 3. Peak G shock telemetry bonus (0 - 20)
  const gForce =
    report.bumpIntensity ??
    report.sensorEvidence?.maxGForce ??
    (report.sensorDetected ? 1.0 : 0);

  if (gForce >= 6.0) {
    score += 20;
  } else if (gForce >= 4.0) {
    score += 14;
  } else if (gForce >= 2.5) {
    score += 8;
  } else if (gForce > 0 || report.sensorDetected) {
    score += 4;
  }

  // 4. Highway / GDOT corridor bonus (0 - 10)
  const roadLower = `${report.roadName ?? ''} ${report.address ?? ''} ${report.jurisdiction ?? ''}`.toLowerCase();
  const isHighway = GDOT_HIGHWAY_PATTERNS.some((pat) => roadLower.includes(pat));
  
  if (isHighway) {
    score += 10;
  } else if (roadLower.includes('ggc') || roadLower.includes('georgia gwinnett college')) {
    score += 5;
  }

  // Clamp strictly between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Maps a numeric priority score (0-100) to a suggested categorical Priority.
 * Note: Admins can always manually override this suggested priority.
 */
export function suggestPriority(score: number): ReportPriority {
  if (score >= 80) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}
