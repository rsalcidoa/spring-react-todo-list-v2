import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

let mockLogin: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockLogin = vi.fn().mockResolvedValue(undefined);
  vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(() => ({
      login: mockLogin,
      logout: vi.fn(),
    })),
  }));
});

afterEach(cleanup);

describe('LoginPage', () => {
  it('renders with correct labels and inputs', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    
    expect(screen.getByText(/Login/i)).toBeTruthy();
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeTruthy();
  });

  it('submits form and calls login on submit', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123', expect.any(Function)));
  });
});
