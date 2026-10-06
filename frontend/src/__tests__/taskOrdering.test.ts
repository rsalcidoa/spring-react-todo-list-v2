import { describe, it, expect } from 'vitest';
import { positionBetween } from '../services/taskOrdering';

describe('positionBetween', () => {
  it('returns a base position when there are no neighbors', () => {
    expect(positionBetween(undefined, undefined)).toBe(1);
  });

  it('appends after the last position', () => {
    expect(positionBetween(2, undefined)).toBe(3);
  });

  it('prepends before the first position', () => {
    expect(positionBetween(undefined, 4)).toBe(3);
  });

  it('returns the midpoint between two neighbors', () => {
    expect(positionBetween(1, 2)).toBe(1.5);
  });
});
