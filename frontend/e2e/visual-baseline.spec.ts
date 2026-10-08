import { test, expect } from 'playwright/test';

const BASE = 'http://localhost:5173';
const SHOTS = process.env.SHOTS_DIR || '/tmp/shots-before';

test.describe('visual baselines', () => {
  test('login page', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.getByRole('heading', { name: /Iniciar sesión/i })).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: `${SHOTS}/login.png` });
  });

  test('board with data + open modal', async ({ page }) => {
    const email = `shot_${Date.now()}@test.com`;
    const password = 'Test123!';
    await page.goto(`${BASE}/register`);
    await expect(page.getByRole('heading', { name: /Registrarse/i })).toBeVisible({ timeout: 10000 });
    const inputs = page.locator('form input');
    await inputs.nth(0).fill(email);
    await inputs.nth(1).fill(password);
    await page.getByRole('button', { name: /Registrarse/i }).click();
    await expect(page.getByText(/Todas las tareas/i)).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /\+ Tarea/i }).click();
    const titleInput = page.getByPlaceholder(/Título de la tarea/i);
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('Screenshot task');
    await page.screenshot({ path: `${SHOTS}/board-modal.png` });
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(page.getByText('Screenshot task')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: `${SHOTS}/board.png` });
  });
});
