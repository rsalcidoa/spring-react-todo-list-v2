const TOKEN_KEY = 'jwt';
const EMAIL_KEY = 'email';
const REFRESH_KEY = 'refreshToken';
const LOGIN_URL = '/auth/login';
const LOGIN_ROUTE = '/login';

export interface SessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Navigator {
  redirectToLogin(): void;
}

const defaultNavigator: Navigator = {
  redirectToLogin() {
    window.location.href = LOGIN_ROUTE;
  },
};

export function getToken(storage: SessionStorage = localStorage): string | null {
  return storage.getItem(TOKEN_KEY);
}

export function getEmail(storage: SessionStorage = localStorage): string | null {
  return storage.getItem(EMAIL_KEY);
}

export function isAuthenticated(storage: SessionStorage = localStorage): boolean {
  return getToken(storage) !== null;
}

export function saveSession(token: string, email: string, storage: SessionStorage = localStorage): void {
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(EMAIL_KEY, email);
}

export function getRefreshToken(storage: SessionStorage = localStorage): string | null {
  return storage.getItem(REFRESH_KEY);
}

export function saveRefreshToken(token: string, storage: SessionStorage = localStorage): void {
  storage.setItem(REFRESH_KEY, token);
}

export function clearSession(storage: SessionStorage = localStorage): void {
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(EMAIL_KEY);
  storage.removeItem(REFRESH_KEY);
}

/**
 * 401 policy owned by the session module. Clears the session and redirects,
 * except for the login call itself, which rejects without redirect.
 * Returns true when it acted (cleared + redirected).
 */
export function handleUnauthorized(
  url: string | undefined,
  storage: SessionStorage = localStorage,
  navigator: Navigator = defaultNavigator,
): boolean {
  if (url === LOGIN_URL) {
    return false;
  }
  clearSession(storage);
  navigator.redirectToLogin();
  return true;
}
