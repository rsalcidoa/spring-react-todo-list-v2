import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ErrorBanner from '../components/ErrorBanner';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ErrorBanner', () => {
  it('renders the error message with role=alert', () => {
    render(<ErrorBanner message="Something went wrong" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeTruthy();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('auto-hides after 5 seconds', async () => {
    vi.useFakeTimers();
    render(<ErrorBanner message="Auto hide" />);
    expect(screen.getByRole('alert')).toBeTruthy();

    const banner = screen.getByRole('alert');
    await vi.advanceTimersByTimeAsync(5000);
    expect(banner.parentElement).toBeNull();
  });

  it('hides immediately when close button is clicked', () => {
    render(<ErrorBanner message="Dismissible" />);
    fireEvent.click(screen.getByRole('button', { name: /Cerrar/i }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('stacks vertically when multiple banners are rendered', () => {
    const { container } = render(
      <>
        <ErrorBanner message="First error" />
        <ErrorBanner message="Second error" />
      </>,
    );
    const banners = container.querySelectorAll('[role="alert"]');
    expect(banners.length).toBe(2);
  });
});
