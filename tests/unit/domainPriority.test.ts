import { describe, it, expect } from 'vitest';
import { priorityScore, suggestPriority } from '@/domain/priority';
import { PotholeReport } from '@/domain/types';

describe('domain/priority: Multi-factor Priority Scoring (0-100)', () => {
  it('calculates minimum edge score correctly (low priority)', () => {
    const minReport: Partial<PotholeReport> = {
      severity: 'minor', // 10 pts
      verificationsCount: 0, // 0 pts
      bumpIntensity: 0, // 0 pts
      roadName: 'Quiet Neighborhood Ln',
      jurisdiction: 'City of Duluth',
    };

    const score = priorityScore(minReport);
    expect(score).toBe(10);
    expect(suggestPriority(score)).toBe('low');
  });

  it('calculates maximum edge score correctly (100 points, critical priority)', () => {
    const maxReport: Partial<PotholeReport> = {
      severity: 'critical', // 45 pts
      verificationsCount: 5, // 25 pts (capped)
      bumpIntensity: 8.5, // 20 pts (>= 6.0G)
      roadName: 'GA-316 University Pkwy', // 10 pts (GDOT corridor)
      jurisdiction: 'GDOT (State Route)',
    };

    const score = priorityScore(maxReport);
    expect(score).toBe(100);
    expect(suggestPriority(score)).toBe('critical');
  });

  it('caps community confirmation bonus at 25 points regardless of upvote volume', () => {
    const fiveUpvotes: Partial<PotholeReport> = {
      severity: 'moderate', // 20
      verificationsCount: 5, // 25
      bumpIntensity: 0,
      roadName: 'Local Street',
    };

    const fiftyUpvotes: Partial<PotholeReport> = {
      severity: 'moderate', // 20
      verificationsCount: 50, // capped at 25
      bumpIntensity: 0,
      roadName: 'Local Street',
    };

    expect(priorityScore(fiveUpvotes)).toBe(45);
    expect(priorityScore(fiftyUpvotes)).toBe(45);
  });

  it('correctly tiers peak G shock telemetry bonuses', () => {
    const base: Partial<PotholeReport> = {
      severity: 'moderate', // 20
      verificationsCount: 0,
      roadName: 'Oak St',
    };

    expect(priorityScore({ ...base, bumpIntensity: 7.0 })).toBe(20 + 20); // >= 6.0G -> 20 pts
    expect(priorityScore({ ...base, bumpIntensity: 4.5 })).toBe(20 + 14); // >= 4.0G -> 14 pts
    expect(priorityScore({ ...base, bumpIntensity: 2.8 })).toBe(20 + 8); // >= 2.5G -> 8 pts
    expect(priorityScore({ ...base, bumpIntensity: 1.2 })).toBe(20 + 4); // > 0G -> 4 pts
  });

  it('awards corridor bonus for GDOT / State highways and GGC campus', () => {
    const base: Partial<PotholeReport> = {
      severity: 'moderate', // 20
      verificationsCount: 0,
    };

    // GDOT highway
    expect(priorityScore({ ...base, roadName: 'Interstate 85 Northbound' })).toBe(20 + 10);
    expect(priorityScore({ ...base, roadName: 'SR 316 Express' })).toBe(20 + 10);

    // GGC Campus core
    expect(priorityScore({ ...base, roadName: 'Lonnie Harvel Way @ GGC Campus' })).toBe(20 + 5);

    // Local road
    expect(priorityScore({ ...base, roadName: 'Main Street' })).toBe(20 + 0);
  });

  it('maps scores accurately at threshold boundaries', () => {
    expect(suggestPriority(29)).toBe('low');
    expect(suggestPriority(30)).toBe('medium');
    expect(suggestPriority(54)).toBe('medium');
    expect(suggestPriority(55)).toBe('high');
    expect(suggestPriority(79)).toBe('high');
    expect(suggestPriority(80)).toBe('critical');
    expect(suggestPriority(100)).toBe('critical');
  });
});
