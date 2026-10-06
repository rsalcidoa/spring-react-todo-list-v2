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
    
    expect(screen.getByText(/Iniciar sesión/i)).toBeTruthy();
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    expect(emailInput).toBeTruthy();
    expect(screen.getByLabelText(/Contraseña/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeTruthy();
  });

  it('submits form and calls login on submit', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    const passwordInput = screen.getByLabelText(/Contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123', expect.any(Function)));
  });

  it('blocks submit and shows a banner for an invalid email', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'notanemail' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'password123' } });
    fireEvent.submit(emailInput.closest('form')!);

    await waitFor(() => expect(screen.getByText('Formato de email inválido')).toBeTruthy());
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('marks the email input as required', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/Correo electrónico/i).hasAttribute('required')).toBe(true);
  });

  it('links to the forgot-password route', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /¿Olvidaste tu contraseña\?/i });
    expect(link.getAttribute('href')).toBe('/forgot-password');
  });
});
