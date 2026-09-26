import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

afterEach(cleanup);

describe('App Routing', () => {
  it('renders LoginPage at /login route', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const heading = screen.getByText(/Iniciar sesión/i);
    expect(heading).toBeTruthy();
  });

  it('renders form inputs correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const email = screen.getByLabelText(/Correo electrónico/i);
    expect(email).toBeTruthy();
    const password = screen.getByLabelText(/Contraseña/i);
    expect(password).toBeTruthy();
  });
});
