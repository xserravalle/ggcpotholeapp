import { describe, it, expect } from 'vitest';
import { canRecordImpact, IMPACT_COOLDOWN_MS } from '@/services/impactCooldown';

describe('canRecordImpact', () => {
  it('should verify IMPACT_COOLDOWN_MS is set to 10 seconds (10000ms)', () => {
    expect(IMPACT_COOLDOWN_MS).toBe(10_000);
  });

  it('allows first impact when lastAcceptedAt is null', () => {
    // 1. First impact / normal input
    // Input: lastAcceptedAt = null, now = 5000
    // Expected: true, because no previous impact has been accepted.
    expect(canRecordImpact(null, 5000)).toBe(true);
  });

  it('rejects impact before cooldown expires', () => {
    // 2. Impact before cooldown expires
    // Input: lastAcceptedAt = 10000, now = 15000
    // Expected: false, because only 5 seconds have passed.
    expect(canRecordImpact(10000, 15000)).toBe(false);
  });

  it('allows impact exactly at the 10-second boundary', () => {
    // 3. Impact exactly at the 10-second boundary
    // Input: lastAcceptedAt = 10000, now = 20000
    // Expected: true, because the full 10-second cooldown has passed.
    expect(canRecordImpact(10000, 20000)).toBe(true);
  });

  it('allows impact after cooldown expires', () => {
    // 4. Impact after cooldown expires
    // Input: lastAcceptedAt = 10000, now = 25000
    // Expected: true, because 15 seconds have passed.
    expect(canRecordImpact(10000, 25000)).toBe(true);
  });

  it('rejects invalid or out-of-order timestamps', () => {
    // 5. Invalid/out-of-order timestamp
    // Input: lastAcceptedAt = 20000, now = 15000
    // Expected: false, because the current timestamp occurs before the last accepted impact and should not create another detection.
    expect(canRecordImpact(20000, 15000)).toBe(false);
  });
});
