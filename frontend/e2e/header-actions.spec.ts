import { test, expect } from 'playwright/test';

const BASE = 'http://localhost:5173';

async function registerAndReachBoard(page: import('playwright/test').Page) {
  const email = `header_${Date.now()}@test.com`;
  await page.goto(`${BASE}/register`);
  await expect(page.getByRole('heading', { name: /Registrarse/i })).toBeVisible({ timeout: 10000 });
  const inputs = page.locator('form input');
  await inputs.nth(0).fill(email);
  await inputs.nth(1).fill('Test123!');
  await page.getByRole('button', { name: /Registrarse/i }).click();
  await expect(page.getByText(/Todas las tareas/i)).toBeVisible({ timeout: 15000 });
}

test.describe('Header action hierarchy', () => {
  test('project and task actions share the same size and correct emphasis', async ({ page }) => {
    await registerAndReachBoard(page);

    const taskBtn = page.getByRole('button', { name: /\+ Tarea/i });
    const projectBtn = page.getByRole('button', { name: /Nuevo proyecto/i });

    const taskBox = await taskBtn.boundingBox();
    const projectBox = await projectBtn.boundingBox();
    expect(taskBox).not.toBeNull();
    expect(projectBox).not.toBeNull();

    expect(Math.round(taskBox!.height)).toBe(Math.round(projectBox!.height));

    const taskBg = await taskBtn.evaluate(el => getComputedStyle(el).backgroundColor);
    const projectBg = await projectBtn.evaluate(el => getComputedStyle(el).backgroundColor);
    const projectBorder = await projectBtn.evaluate(el => getComputedStyle(el).borderTopWidth);

    expect(taskBg).not.toBe(projectBg);
    expect(parseFloat(projectBorder)).toBeGreaterThan(0);
  });
});
