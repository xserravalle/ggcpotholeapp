import { describe, it, expect } from 'vitest';
import { AUTHORITIES_DIRECTORY } from '@/data/jurisdictionsData';
import { AGENCY_LABELS, getOfficersByAgency } from '@/data/officersData';

describe('Authorities and Officers Agency Consistency', () => {
  it('ensures every authority in AUTHORITIES_DIRECTORY has an agency label', () => {
    const authorityIds = Object.keys(AUTHORITIES_DIRECTORY);
    expect(authorityIds.length).toBeGreaterThan(0);

    for (const id of authorityIds) {
      const label = AGENCY_LABELS[id];
      expect(label, `Agency label missing for authority ID "${id}"`).toBeDefined();
      expect(typeof label).toBe('string');
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });

  it('ensures every authority in AUTHORITIES_DIRECTORY has at least one assigned demo officer', () => {
    const authorityIds = Object.keys(AUTHORITIES_DIRECTORY);

    for (const id of authorityIds) {
      const officers = getOfficersByAgency(id);
      expect(
        officers.length,
        `Authority ID "${id}" (${AUTHORITIES_DIRECTORY[id].name}) must have at least one officer assigned`
      ).toBeGreaterThanOrEqual(1);

      for (const officer of officers) {
        expect(officer.id).toBeDefined();
        expect(officer.name.trim().length).toBeGreaterThan(0);
        expect(officer.agencyId).toBe(id);
      }
    }
  });

  it('specifically verifies DACULA is configured with agency label and demo officers', () => {
    expect(AUTHORITIES_DIRECTORY.DACULA).toBeDefined();
    expect(AGENCY_LABELS.DACULA).toBe('🏙️ City of Dacula');

    const daculaOfficers = getOfficersByAgency('DACULA');
    expect(daculaOfficers.length).toBeGreaterThanOrEqual(2);
    expect(daculaOfficers.some(o => o.name === 'Cameron Hayes')).toBe(true);
    expect(daculaOfficers.some(o => o.name === 'Kelsey Mitchell')).toBe(true);
  });
});
