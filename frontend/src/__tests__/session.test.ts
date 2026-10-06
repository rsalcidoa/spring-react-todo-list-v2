import { describe, it, expect, vi } from 'vitest';
import {
  getToken,
  getEmail,
  isAuthenticated,
  saveSession,
  clearSession,
  handleUnauthorized,
  saveRefreshToken,
  getRefreshToken,
  type SessionStorage,
} from '../services/session';

function makeStorage(entries: Record<string, string> = {}): SessionStorage & { store: Record<string, string> } {
  const store: Record<string, string> = { ...entries };
  return {
    store,
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
}

describe('session module', () => {
  it('reads token and email through getToken/getEmail', () => {
    const storage = makeStorage({ jwt: 'abc', email: 'a@b.c' });
    expect(getToken(storage)).toBe('abc');
    expect(getEmail(storage)).toBe('a@b.c');
    expect(isAuthenticated(storage)).toBe(true);
  });

  it('isAuthenticated is false without a token', () => {
    expect(isAuthenticated(makeStorage())).toBe(false);
  });

  it('saveSession stores both keys and clearSession removes them', () => {
    const storage = makeStorage();
    saveSession('tok', 'a@b.c', storage);
    expect(storage.store).toEqual({ jwt: 'tok', email: 'a@b.c' });
    clearSession(storage);
    expect(storage.store).toEqual({});
  });

  it('stores and clears the refresh token', () => {
    const storage = makeStorage();
    saveRefreshToken('r1', storage);
    expect(getRefreshToken(storage)).toBe('r1');
    clearSession(storage);
    expect(getRefreshToken(storage)).toBeNull();
  });

  it('handleUnauthorized clears and redirects for non-login requests', () => {
    const storage = makeStorage({ jwt: 'tok', email: 'a@b.c' });
    const navigator = { redirectToLogin: vi.fn() };
    expect(handleUnauthorized('/tasks', storage, navigator)).toBe(true);
    expect(storage.store).toEqual({});
    expect(navigator.redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it('handleUnauthorized does not redirect for the login call', () => {
    const storage = makeStorage({ jwt: 'tok', email: 'a@b.c' });
    const navigator = { redirectToLogin: vi.fn() };
    expect(handleUnauthorized('/auth/login', storage, navigator)).toBe(false);
    expect(storage.store).toEqual({ jwt: 'tok', email: 'a@b.c' });
    expect(navigator.redirectToLogin).not.toHaveBeenCalled();
  });
});
