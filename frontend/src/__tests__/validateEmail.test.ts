import { describe, it, expect } from 'vitest';
import { validateEmail } from '../services/validateEmail';

describe('validateEmail', () => {
  it('returns true for valid emails', () => {
    expect(validateEmail('usuario@dominio.com')).toBe(true);
    expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    expect(validateEmail('a@b.c')).toBe(true);
  });

  it('returns false for missing TLD dot', () => {
    expect(validateEmail('mail@mail')).toBe(false);
  });

  it('returns false for strings without @', () => {
    expect(validateEmail('notanemail')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('returns false for emails with spaces', () => {
    expect(validateEmail('user name@example.com')).toBe(false);
  });

  it('returns false for missing local part or domain', () => {
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
  });
});
