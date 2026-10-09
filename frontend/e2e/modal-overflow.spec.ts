import { test, expect } from 'playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Task dialog overflow', () => {
  test('Save stays within the viewport with many subtasks', async ({ page }) => {
    const email = `modal_${Date.now()}@test.com`;
    await page.goto(`${BASE}/register`);
    await expect(page.getByRole('heading', { name: /Registrarse/i })).toBeVisible({ timeout: 10000 });
    const inputs = page.locator('form input');
    await inputs.nth(0).fill(email);
    await inputs.nth(1).fill('Test123!');
    await page.getByRole('button', { name: /Registrarse/i }).click();
    await expect(page.getByText(/Todas las tareas/i)).toBeVisible({ timeout: 15000 });

    // Create the parent task through the UI.
    await page.getByRole('button', { name: /\+ Tarea/i }).click();
    await page.getByPlaceholder(/Título de la tarea/i).fill('Long task');
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(page.getByText('Long task')).toBeVisible({ timeout: 10000 });

    // Add many subtasks through the API so the test does not depend on scrolling.
    const token = await page.evaluate(() => localStorage.getItem('jwt'));
    expect(token).toBeTruthy();
    const headers = { Authorization: `Bearer ${token}` };
    const list = (await (await page.request.get(`${BASE}/v1/tasks`, { headers })).json()) as Array<{ id: number; title: string }>;
    const parent = list.find(t => t.title === 'Long task');
    expect(parent).toBeTruthy();
    for (let i = 0; i < 15; i++) {
      const res = await page.request.post(`${BASE}/v1/tasks`, {
        headers,
        data: { title: `Sub ${i}`, priority: 'LOW', parentId: parent!.id },
      });
      expect(res.ok()).toBeTruthy();
    }

    // Open the edit dialog; it loads the subtasks.
    await page.getByText('Long task').click();
    await expect(page.getByText(/Editar tarea/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Sub 14')).toBeVisible({ timeout: 5000 });

    const save = page.getByRole('button', { name: /Guardar/i });
    const box = await save.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
  });
});
