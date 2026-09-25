import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import * as ApiService from '../services/ApiService';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../services/ApiService', () => ({
  api: { post: vi.fn() },
}));

afterEach(cleanup);

describe('RegisterPage', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    } as unknown as Storage;
    return render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={component} />
          <Route path="/tasks" element={<div>tasks</div>} />
        </Routes>
      </MemoryRouter>,
    );
  };

  const submit = () => {
    const inputs = document.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: 'user@example.com' } });
    fireEvent.change(inputs[1], { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
  };

  it('shows backend message on 409 conflict', async () => {
    (ApiService.api.post as any)
      .mockRejectedValueOnce({ response: { status: 409, data: { error: 'Este email ya está registrado' } } });
    renderWithProvider(<RegisterPage />);
    submit();
    await waitFor(() => expect(screen.getByText('Este email ya está registrado')).toBeTruthy());
  });

  it('shows generic message on other errors', async () => {
    (ApiService.api.post as any).mockRejectedValueOnce({ response: { status: 500 } });
    renderWithProvider(<RegisterPage />);
    submit();
    await waitFor(() => expect(screen.getByText('Error en registro')).toBeTruthy());
  });
});
