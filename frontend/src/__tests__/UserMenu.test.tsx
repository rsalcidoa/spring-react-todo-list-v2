import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import UserMenu from '../components/UserMenu';

afterEach(cleanup);

describe('UserMenu', () => {
  it('shows the email initial as the avatar with the email as tooltip', () => {
    render(<UserMenu email="ana@example.com" onLogout={() => {}} />);

    const button = screen.getByRole('button', { name: /Cuenta/i });
    expect(button.textContent).toBe('A');
    expect(button.getAttribute('title')).toBe('ana@example.com');
  });

  it('opens a menu with the email and logs out', () => {
    const onLogout = vi.fn();
    render(<UserMenu email="ana@example.com" onLogout={onLogout} />);

    fireEvent.click(screen.getByRole('button', { name: /Cuenta/i }));

    expect(screen.getByText('ana@example.com')).toBeTruthy();
    fireEvent.click(screen.getByRole('menuitem', { name: /Cerrar sesión/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
