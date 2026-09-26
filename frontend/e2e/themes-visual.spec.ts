import { test, expect } from 'playwright/test';

const BASE = 'http://localhost:5173';
const SHOTS = process.env.SHOTS_DIR || 'e2e/__screenshots__';
const THEMES = ['ink', 'phosphor', 'nord'] as const;

async function useTheme(page: import('playwright/test').Page, theme: string) {
  await page.goto(BASE);
  await page.evaluate(t => localStorage.setItem('theme', t), theme);
}

async function register(page: import('playwright/test').Page, email: string, password: string) {
  await page.goto(`${BASE}/register`);
  await expect(page.getByRole('heading', { name: /Registrarse/i })).toBeVisible({ timeout: 10000 });
  const inputs = page.locator('form input');
  await inputs.nth(0).fill(email);
  await inputs.nth(1).fill(password);
  await page.getByRole('button', { name: /Registrarse/i }).click();
  await expect(page.getByText(/Tablero/i)).toBeVisible({ timeout: 15000 });
}

for (const theme of THEMES) {
  test.describe(`theme ${theme}`, () => {
    test('login page', async ({ page }) => {
      await useTheme(page, theme);
      await page.goto(`${BASE}/login`);
      await expect(page.getByRole('heading', { name: /Iniciar sesión/i })).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: `${SHOTS}/${theme}/login.png` });
    });

    test('empty board', async ({ page }) => {
      await useTheme(page, theme);
      await register(page, `empty_${theme}_${Date.now()}@test.com`, 'Test123!');
      await expect(page.getByText(/No hay tareas todavía/i)).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: `${SHOTS}/${theme}/board-empty.png` });
    });

    test('board with data', async ({ page }) => {
      await useTheme(page, theme);
      await register(page, `shot_${theme}_${Date.now()}@test.com`, 'Test123!');
      await page.getByRole('button', { name: /\+ Tarea/i }).click();
      const titleInput = page.getByPlaceholder(/Título de la tarea/i);
      await expect(titleInput).toBeVisible({ timeout: 5000 });
      const title = `Tarea ${theme} ${Date.now()}`;
      await titleInput.fill(title);
      await page.getByRole('button', { name: /Guardar/i }).click();
      await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: `${SHOTS}/${theme}/board.png` });
    });

    test('open modal', async ({ page }) => {
      await useTheme(page, theme);
      await register(page, `modal_${theme}_${Date.now()}@test.com`, 'Test123!');
      await page.getByRole('button', { name: /\+ Tarea/i }).click();
      await expect(page.getByPlaceholder(/Título de la tarea/i)).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: `${SHOTS}/${theme}/modal.png` });
    });

    test('error toast on failed load', async ({ page }) => {
      await useTheme(page, theme);
      await register(page, `err_${theme}_${Date.now()}@test.com`, 'Test123!');
      await page.route('**/v1/tasks', route => route.abort());
      await page.route('**/v1/tags', route => route.abort());
      await page.reload();
      await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: `${SHOTS}/${theme}/toast-error.png` });
    });
  });
}
