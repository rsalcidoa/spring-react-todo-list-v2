import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider, readTheme, useTheme, AVAILABLE_THEMES } from '../context/ThemeContext';

afterEach(cleanup);

function storageWith(entries: Record<string, string> = {}) {
  const store: Record<string, string> = { ...entries };
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  } as Storage;
}

describe('readTheme', () => {
  it('defaults to ink without stored value', () => {
    expect(readTheme(storageWith())).toBe('ink');
  });

  it('restores a stored theme and rejects unknown values', () => {
    expect(readTheme(storageWith({ theme: 'nord' }))).toBe('nord');
    expect(readTheme(storageWith({ theme: 'neon' }))).toBe('ink');
  });

  it('exposes the three themes in Spanish', () => {
    expect(AVAILABLE_THEMES.map(t => t.name)).toEqual(['ink', 'phosphor', 'nord']);
    expect(AVAILABLE_THEMES.map(t => t.label)).toEqual(['Tinta', 'Fósforo', 'Nórdico']);
  });
});

describe('ThemeProvider', () => {
  it('sets data-theme on the document and persists on change', () => {
    const getItem = vi.fn(() => null);
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem, setItem, removeItem: vi.fn(), clear: vi.fn() });

    function Probe() {
      const { setTheme } = useTheme();
      return <button onClick={() => setTheme('phosphor')}>switch</button>;
    }

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('ink');
    fireEvent.click(screen.getByRole('button', { name: 'switch' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('phosphor');
    expect(setItem).toHaveBeenCalledWith('theme', 'phosphor');
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-theme');
  });
});
