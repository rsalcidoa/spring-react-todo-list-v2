import { test, expect } from 'playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Password reset', () => {
  test('recover a password end to end', async ({ page }) => {
    const email = `reset_${Date.now()}@test.com`;
    const password = 'OldPass123!';
    const newPassword = 'NewPass123!';

    // Register (auto-login lands on the board).
    await page.goto(`${BASE}/register`);
    await expect(page.getByRole('heading', { name: /Registrarse/i })).toBeVisible({ timeout: 10000 });
    const regInputs = page.locator('form input');
    await regInputs.nth(0).fill(email);
    await regInputs.nth(1).fill(password);
    await page.getByRole('button', { name: /Registrarse/i }).click();
    await expect(page.getByText(/Tablero/i)).toBeVisible({ timeout: 15000 });

    // Log out through the user menu.
    await page.getByRole('button', { name: /Cuenta/i }).click();
    await page.getByRole('menuitem', { name: /Cerrar sesión/i }).click();
    await expect(page.getByRole('heading', { name: /Iniciar sesión/i })).toBeVisible({ timeout: 10000 });

    // Request a reset and read the code shown on screen.
    await page.goto(`${BASE}/forgot-password`);
    await page.getByLabel(/Correo electrónico/i).fill(email);
    await page.getByRole('button', { name: /Enviar código/i }).click();

    const codeEl = page.locator('#reset-token-value');
    await expect(codeEl).toBeVisible({ timeout: 10000 });
    const code = (await codeEl.textContent())?.trim() ?? '';
    expect(code).toMatch(/^[A-Z0-9]{6}$/);

    // Set the new password through the reset link.
    await page.getByRole('link', { name: /Continuar/i }).click();
    await page.getByLabel(/Nueva contraseña/i).fill(newPassword);
    await page.getByLabel(/Confirmar contraseña/i).fill(newPassword);
    await page.getByRole('button', { name: /Restablecer/i }).click();

    // Sign in with the new password.
    await expect(page.getByRole('heading', { name: /Iniciar sesión/i })).toBeVisible({ timeout: 10000 });
    await page.getByLabel(/Correo electrónico/i).fill(email);
    await page.getByLabel(/Contraseña/i).fill(newPassword);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page.getByText(/Tablero/i)).toBeVisible({ timeout: 15000 });
  });
});
