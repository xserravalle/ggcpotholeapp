import { describe, it, expect } from 'vitest';
import { canRecordImpact, IMPACT_COOLDOWN_MS } from '@/services/impactCooldown';

describe('impactCooldown service', () => {
  it('should export IMPACT_COOLDOWN_MS as 10000 ms', () => {
    expect(IMPACT_COOLDOWN_MS).toBe(10000);
  });

  it('allows first impact when lastAcceptedAt is null', () => {
    const lastAcceptedAt = null;
    const now = 5000;
    expect(canRecordImpact(lastAcceptedAt, now)).toBe(true);
  });

  it('rejects impact before cooldown expires', () => {
    const lastAcceptedAt = 10000;
    const now = 15000;
    expect(canRecordImpact(lastAcceptedAt, now)).toBe(false);
  });

  it('allows impact exactly at the 10-second boundary', () => {
    const lastAcceptedAt = 10000;
    const now = 20000;
    expect(canRecordImpact(lastAcceptedAt, now)).toBe(true);
  });

  it('allows impact after cooldown expires', () => {
    const lastAcceptedAt = 10000;
    const now = 25000;
    expect(canRecordImpact(lastAcceptedAt, now)).toBe(true);
  });

  it('rejects invalid or out-of-order timestamp', () => {
    const lastAcceptedAt = 20000;
    const now = 15000;
    expect(canRecordImpact(lastAcceptedAt, now)).toBe(false);
  });
});
