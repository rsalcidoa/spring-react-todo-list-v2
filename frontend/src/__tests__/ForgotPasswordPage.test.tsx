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

    expect(screen.getByText(/Recuperar contraseña/i)).toBeTruthy();
    expect(screen.getByLabelText(/Correo electrónico/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Enviar código/i })).toBeTruthy();
  });

  it('submits form and calls requestReset with email', async () => {
    mockRequestReset.mockResolvedValue({ data: { token: 'ABC123' } });
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar código/i }));

    await waitFor(() => expect(mockRequestReset).toHaveBeenCalledWith('test@test.com'));
  });

  it('displays the generated token and continue link on success', async () => {
    mockRequestReset.mockResolvedValue({ data: { token: 'ABC123' } });
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar código/i }));

    await waitFor(() => expect(screen.getByText('ABC123')).toBeTruthy());
    const link = screen.getByRole('link', { name: /Continuar/i });
    expect(link.getAttribute('href')).toBe('/reset/ABC123');
  });

  it('shows error when API request fails', async () => {
    mockRequestReset.mockRejectedValue(new Error('network'));
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar código/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  });

  it('copies the token to the clipboard with confirmation', async () => {
    mockRequestReset.mockResolvedValue({ data: { token: 'ABC123' } });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar código/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /Copiar/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Copiar/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('ABC123'));
    await waitFor(() => expect(screen.getByRole('button', { name: /¡Copiado!/i })).toBeTruthy());
  });

  it('names the retry action when the request fails', async () => {
    mockRequestReset.mockRejectedValue(new Error('network'));
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar código/i }));

    await waitFor(() => expect(screen.getByText(/Reintenta/i)).toBeTruthy());
  });
});
