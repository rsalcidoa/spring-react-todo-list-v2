import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as ApiService from '../services/ApiService';

vi.mock('../services/ApiService', () => ({
  api: { post: vi.fn() },
}));

const TestComponent: React.FC = () => {
  const { login } = useAuth();
  return <button onClick={() => login('user@example.com', 'secret123').catch(() => undefined)}>login</button>;
};

afterEach(cleanup);

describe('AuthContext login', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    } as unknown as Storage;
    return render(
      <MemoryRouter>
        <AuthProvider>{component}</AuthProvider>
      </MemoryRouter>,
    );
  };

  it('stores token and email in localStorage on successful login', async () => {
    (ApiService.api.post as any).mockResolvedValue({ data: { token: 'jwt123' } });
    renderWithProvider(<TestComponent />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(ApiService.api.post).toHaveBeenCalledWith('/auth/login', { email: 'user@example.com', password: 'secret123' }));
    await waitFor(() => expect(localStorage.setItem).toHaveBeenCalledWith('jwt', 'jwt123'));
    await waitFor(() => expect(localStorage.setItem).toHaveBeenCalledWith('email', 'user@example.com'));
  });

  it('does not store token when login fails', async () => {
    (ApiService.api.post as any).mockRejectedValue(new Error('network'));
    renderWithProvider(<TestComponent />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(ApiService.api.post).toHaveBeenCalled());
    await new Promise(r => setTimeout(r, 50));
    expect(localStorage.setItem).not.toHaveBeenCalledWith('jwt', 'jwt123');
  });
});
