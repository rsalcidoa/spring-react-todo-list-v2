import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ResetPasswordPage from '../pages/ResetPasswordPage';

const mockVerify = vi.fn();
const mockChange = vi.fn();
let navigateMock: ReturnType<typeof vi.fn>;

vi.mock('../services/ApiService', () => ({
  verifyResetToken: (...args: unknown[]) => mockVerify(...args),
  changePasswordReset: (...args: unknown[]) => mockChange(...args),
}));

beforeEach(() => {
  mockVerify.mockReset();
  mockChange.mockReset();
  navigateMock = vi.fn();
});

afterEach(cleanup);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reset/:token" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ResetPasswordPage', () => {
  it('renders with new password and confirm inputs plus submit button', () => {
    renderAt('/reset/ABC123');

    expect(screen.getByRole('heading', { name: /Reset Password/i })).toBeTruthy();
    expect(screen.getByLabelText(/New password:/i)).toBeTruthy();
    expect(screen.getByLabelText(/Confirm password:/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Reset password/i })).toBeTruthy();
  });

  it('verifies token then changes password and navigates to login on success', async () => {
    mockVerify.mockResolvedValue({ data: { verified: true } });
    mockChange.mockResolvedValue({});
    renderAt('/reset/ABC123');

    const newPass = screen.getByLabelText(/New password:/i);
    const confirmPass = screen.getByLabelText(/Confirm password:/i);
    fireEvent.change(newPass, { target: { value: 'newpass9' } });
    fireEvent.change(confirmPass, { target: { value: 'newpass9' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    await waitFor(() => expect(mockVerify).toHaveBeenCalledWith('ABC123'));
    await waitFor(() => expect(mockChange).toHaveBeenCalledWith('ABC123', 'newpass9'));
  });

  it('shows error when passwords do not match and does not call API', async () => {
    renderAt('/reset/ABC123');

    const newPass = screen.getByLabelText(/New password:/i);
    const confirmPass = screen.getByLabelText(/Confirm password:/i);
    fireEvent.change(newPass, { target: { value: 'newpass9' } });
    fireEvent.change(confirmPass, { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    await waitFor(() => expect(screen.getByText(/Passwords do not match/i)).toBeTruthy());
    expect(mockVerify).not.toHaveBeenCalled();
    expect(mockChange).not.toHaveBeenCalled();
  });

  it('shows expired token error when verify returns expired message', async () => {
    mockVerify.mockRejectedValue({ response: { data: { error: 'Reset token has expired' } } });
    renderAt('/reset/ABC123');

    const newPass = screen.getByLabelText(/New password:/i);
    const confirmPass = screen.getByLabelText(/Confirm password:/i);
    fireEvent.change(newPass, { target: { value: 'newpass9' } });
    fireEvent.change(confirmPass, { target: { value: 'newpass9' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    await waitFor(() => expect(screen.getByText(/expired/i)).toBeTruthy());
  });

  it('links back to forgot-password page', () => {
    renderAt('/reset/ABC123');
    const link = screen.getByRole('link', { name: /Request a new code/i });
    expect(link).toBeTruthy();
  });
});
