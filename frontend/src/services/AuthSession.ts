import axios from 'axios';
import { api } from './ApiService';
import {
  clearSession,
  getEmail,
  getRefreshToken,
  getToken,
  handleUnauthorized as applyUnauthorizedPolicy,
  saveRefreshToken,
  saveSession,
  type Navigator as SessionNavigator,
  type SessionStorage,
} from './session';

const LOGIN_ENDPOINT = '/auth/login';
const REFRESH_ENDPOINT = '/auth/refresh';
const LOGIN_ROUTE = '/login';

export interface AuthTokens {
  token: string;
  refreshToken?: string;
}

export interface AuthTransport {
  login(email: string, password: string): Promise<AuthTokens>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  request(config: unknown): Promise<unknown>;
}

export interface AuthSessionOptions {
  storage?: SessionStorage;
  navigator?: SessionNavigator;
  transport?: AuthTransport;
}

export interface SessionState {
  token: string | null;
  email: string | null;
}

export type SessionListener = (state: SessionState) => void;

const defaultNavigator: SessionNavigator = {
  redirectToLogin() {
    window.location.href = LOGIN_ROUTE;
  },
};

/**
 * Deep module owning the auth lifecycle: token storage, refresh rotation
 * (single-flight) and the single 401 policy. ApiService is transport; the
 * React context is a thin binding over `login`/`logout`/`subscribe`.
 */
export class AuthSession {
  private refreshPromise: Promise<string> | null = null;
  private readonly listeners = new Set<SessionListener>();

  constructor(private readonly options: AuthSessionOptions = {}) {}

  private get storage(): SessionStorage {
    return this.options.storage ?? (globalThis.localStorage as SessionStorage);
  }

  private get navigator(): SessionNavigator {
    return this.options.navigator ?? defaultNavigator;
  }

  private get transport(): AuthTransport {
    return this.options.transport ?? {
      login: (email, password) => api.post(LOGIN_ENDPOINT, { email, password }).then(r => r.data),
      refresh: (refreshToken) => axios.post(`/v1${REFRESH_ENDPOINT}`, { refreshToken }).then(r => r.data),
      request: (config) => api(config as never),
    };
  }

  getToken(): string | null {
    return getToken(this.storage);
  }

  getEmail(): string | null {
    return getEmail(this.storage);
  }

  getRefreshToken(): string | null {
    return getRefreshToken(this.storage);
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async login(email: string, password: string): Promise<string> {
    const data = await this.transport.login(email, password);
    saveSession(data.token, email, this.storage);
    if (data.refreshToken) saveRefreshToken(data.refreshToken, this.storage);
    this.notify();
    return data.token;
  }

  logout(): void {
    clearSession(this.storage);
    this.notify();
  }

  /** Refreshes the access token, collapsing concurrent callers onto one request. */
  async ensureFreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh(refreshToken).finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async performRefresh(refreshToken: string): Promise<string> {
    const data = await this.transport.refresh(refreshToken);
    saveSession(data.token, this.getEmail() ?? '', this.storage);
    saveRefreshToken(data.refreshToken as string, this.storage);
    this.notify();
    return data.token;
  }

  isAuthEndpoint(url: string | undefined): boolean {
    const value = url ?? '';
    return value.includes(LOGIN_ENDPOINT) || value.includes(REFRESH_ENDPOINT);
  }

  handleUnauthorized(url: string | undefined): boolean {
    return applyUnauthorizedPolicy(url, this.storage, this.navigator);
  }

  private notify(): void {
    const state: SessionState = { token: this.getToken(), email: this.getEmail() };
    this.listeners.forEach(listener => listener(state));
  }
}

export const authSession = new AuthSession();
