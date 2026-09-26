import { describe, it, expect } from 'vitest';
import { getDueState, todayLocal } from '../services/dueState';

describe('getDueState', () => {
  const today = '2026-09-25';

  it('returns none without a date', () => {
    expect(getDueState(undefined, today)).toBe('none');
    expect(getDueState('', today)).toBe('none');
    expect(getDueState(null, today)).toBe('none');
  });

  it('returns overdue for past dates', () => {
    expect(getDueState('2026-09-24', today)).toBe('overdue');
    expect(getDueState('2024-02-29', today)).toBe('overdue');
  });

  it('returns today for the same date', () => {
    expect(getDueState('2026-09-25', today)).toBe('today');
  });

  it('returns future for later dates', () => {
    expect(getDueState('2026-09-26', today)).toBe('future');
    expect(getDueState('2027-01-01', today)).toBe('future');
  });

  it('todayLocal formats local yyyy-MM-dd', () => {
    expect(todayLocal(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(todayLocal(new Date(2026, 11, 31))).toBe('2026-12-31');
    expect(getDueState('2026-12-31')).toBeDefined();
  });
});
