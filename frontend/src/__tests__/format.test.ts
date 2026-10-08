import { describe, it, expect } from 'vitest';
import { formatNumber, formatDate } from '../services/format';

describe('format', () => {
  it('formats numbers per locale', () => {
    expect(formatNumber(1000, 'en')).toBe('1,000');
    expect(formatNumber(1000, 'es')).toBe('1000');
  });

  it('formats a due date with Intl', () => {
    expect(formatDate('2026-06-15', 'en')).toContain('2026');
  });

  it('returns empty for a missing date', () => {
    expect(formatDate(undefined, 'es')).toBe('');
  });
});
