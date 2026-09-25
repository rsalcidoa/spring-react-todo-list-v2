import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';

const mockRequestReset = vi.fn();

vi.mock('../services/ApiService', () => ({
  requestReset: (...args: unknown[]) => mockRequestReset(...args),
}));

beforeEach(() => {
  mockRequestReset.mockReset();
});

afterEach(cleanup);

describe('ForgotPasswordPage', () => {
  it('renders with email input and submit button', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Forgot Password/i)).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Send reset code/i })).toBeTruthy();
  });

  it('submits form and calls requestReset with email', async () => {
    mockRequestReset.mockResolvedValue({ data: { token: 'ABC123' } });
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send reset code/i }));

    await waitFor(() => expect(mockRequestReset).toHaveBeenCalledWith('test@test.com'));
  });

  it('displays the generated token and continue link on success', async () => {
    mockRequestReset.mockResolvedValue({ data: { token: 'ABC123' } });
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send reset code/i }));

    await waitFor(() => expect(screen.getByText('ABC123')).toBeTruthy());
    const link = screen.getByRole('link', { name: /Continue to reset/i });
    expect(link).toBeTruthy();
  });

  it('shows error when API request fails', async () => {
    mockRequestReset.mockRejectedValue(new Error('network'));
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send reset code/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  });
});
