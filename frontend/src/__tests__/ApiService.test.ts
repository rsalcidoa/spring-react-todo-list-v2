import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { api, getTasks } from '../services/ApiService';

const originalAdapter = api.defaults.adapter;
let store: Record<string, string>;

beforeEach(() => {
  store = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
});

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

function captureAdapter(): () => any {
  let seen: any;
  api.defaults.adapter = async (config: any) => {
    seen = config;
    return { data: [], status: 200, statusText: 'OK', headers: {}, config };
  };
  return () => seen;
}

describe('ApiService request interceptor', () => {
  it('attaches Authorization: Bearer <token> to outgoing requests', async () => {
    localStorage.setItem('jwt', 'tok123');
    const seen = captureAdapter();

    await getTasks();

    expect(seen().headers.Authorization).toBe('Bearer tok123');
  });

  it('omits Authorization when no token is stored', async () => {
    const seen = captureAdapter();

    await getTasks();

    expect(seen().headers.Authorization).toBeUndefined();
  });

  it('refreshes once on 401 and retries the request', async () => {
    localStorage.setItem('jwt', 'old');
    localStorage.setItem('email', 'a@b.c');
    localStorage.setItem('refreshToken', 'r1');
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: { token: 'new', refreshToken: 'r2' } } as never);
    let calls = 0;
    api.defaults.adapter = async (config: any) => {
      calls += 1;
      if (calls === 1) {
        return Promise.reject({ response: { status: 401 }, config });
      }
      return { data: [], status: 200, statusText: 'OK', headers: {}, config };
    };

    await getTasks();

    expect(postSpy).toHaveBeenCalled();
    expect(localStorage.getItem('jwt')).toBe('new');
    postSpy.mockRestore();
  });
});
