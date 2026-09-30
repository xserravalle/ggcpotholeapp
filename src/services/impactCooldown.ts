export const IMPACT_COOLDOWN_MS = 10_000;

/**
 * Treat impacts close together in time as one event.
 * A null timestamp means no impact has been accepted yet.
 */
export function canRecordImpact(
  lastAcceptedAt: number | null,
  now: number
): boolean {
  return lastAcceptedAt === null ||
    now - lastAcceptedAt >= IMPACT_COOLDOWN_MS;
}
