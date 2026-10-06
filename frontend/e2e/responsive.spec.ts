import { test, expect } from 'playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Responsive layout', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('board fits a phone width', async ({ page }) => {
    const email = `resp_${Date.now()}@test.com`;
    await page.goto(`${BASE}/register`);
    await expect(page.getByRole('heading', { name: /Registrarse/i })).toBeVisible({ timeout: 10000 });
    const inputs = page.locator('form input');
    await inputs.nth(0).fill(email);
    await inputs.nth(1).fill('Test123!');
    await page.getByRole('button', { name: /Registrarse/i }).click();
    await expect(page.getByText(/Tablero/i)).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /Crear tarea/i }).click();
    await page.getByPlaceholder(/Título de la tarea/i).fill('Movil');
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(page.getByText('Movil')).toBeVisible({ timeout: 10000 });

    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(noOverflow).toBe(true);

    await expect(page).toHaveScreenshot(['mobile', 'board.png']);
  });
});
