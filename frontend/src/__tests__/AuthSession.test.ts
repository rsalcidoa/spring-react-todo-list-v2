import { describe, it, expect, vi } from 'vitest';
import { AuthSession, type AuthTransport } from '../services/AuthSession';
import type { SessionStorage, Navigator } from '../services/session';

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

function makeTransport(overrides: Partial<AuthTransport> = {}): AuthTransport {
  return {
    login: vi.fn().mockResolvedValue({ token: 'token-1', refreshToken: 'refresh-1' }),
    refresh: vi.fn().mockResolvedValue({ token: 'token-2', refreshToken: 'refresh-2' }),
    request: vi.fn(),
    ...overrides,
  };
}

describe('AuthSession', () => {
  it('login persists the token, email and refresh token', async () => {
    const storage = makeStorage();
    const transport = makeTransport();
    const session = new AuthSession({ storage, transport });

    await session.login('a@b.c', 'secret');

    expect(transport.login).toHaveBeenCalledWith('a@b.c', 'secret');
    expect(storage.store).toEqual({ jwt: 'token-1', email: 'a@b.c', refreshToken: 'refresh-1' });
  });

  it('ensureFreshToken refreshes once under concurrency and rotates the tokens', async () => {
    const storage = makeStorage({ refreshToken: 'refresh-1' });
    let resolveRefresh: (value: { token: string; refreshToken: string }) => void = () => {};
    const refresh = vi.fn().mockImplementation(
      () => new Promise<{ token: string; refreshToken: string }>((resolve) => { resolveRefresh = resolve; }),
    );
    const session = new AuthSession({ storage, transport: makeTransport({ refresh }) });

    const first = session.ensureFreshToken();
    const second = session.ensureFreshToken();

    expect(refresh).toHaveBeenCalledTimes(1);

    resolveRefresh({ token: 'new-token', refreshToken: 'new-refresh' });

    await expect(first).resolves.toBe('new-token');
    await expect(second).resolves.toBe('new-token');
    expect(storage.store.jwt).toBe('new-token');
    expect(storage.store.refreshToken).toBe('new-refresh');
  });

  it('clears the session and redirects on a non-login 401', () => {
    const storage = makeStorage({ jwt: 'tok', email: 'a@b.c', refreshToken: 'r1' });
    const navigator: Navigator = { redirectToLogin: vi.fn() };
    const session = new AuthSession({ storage, navigator, transport: makeTransport() });

    const acted = session.handleUnauthorized('/tasks');

    expect(acted).toBe(true);
    expect(storage.store).toEqual({});
    expect(navigator.redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it('does not clear or redirect when the 401 comes from the login call', () => {
    const storage = makeStorage({ jwt: 'tok', email: 'a@b.c' });
    const navigator: Navigator = { redirectToLogin: vi.fn() };
    const session = new AuthSession({ storage, navigator, transport: makeTransport() });

    const acted = session.handleUnauthorized('/auth/login');

    expect(acted).toBe(false);
    expect(storage.store).toEqual({ jwt: 'tok', email: 'a@b.c' });
    expect(navigator.redirectToLogin).not.toHaveBeenCalled();
  });

  it('notifies subscribers on login and logout', async () => {
    const storage = makeStorage();
    const session = new AuthSession({ storage, transport: makeTransport() });
    const listener = vi.fn();

    session.subscribe(listener);
    await session.login('a@b.c', 'secret');
    session.logout();

    expect(listener).toHaveBeenCalledWith({ token: 'token-1', email: 'a@b.c' });
    expect(listener).toHaveBeenLastCalledWith({ token: null, email: null });
  });
});
