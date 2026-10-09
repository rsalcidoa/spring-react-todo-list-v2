import { test, expect } from 'playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Tag block layout', () => {
  test('tag search, option pills and create input do not pile up', async ({ page }) => {
    const email = `tagblock_${Date.now()}@test.com`;
    await page.goto(`${BASE}/register`);
    await expect(page.getByRole('heading', { name: /Registrarse/i })).toBeVisible({ timeout: 10000 });
    const inputs = page.locator('form input');
    await inputs.nth(0).fill(email);
    await inputs.nth(1).fill('Test123!');
    await page.getByRole('button', { name: /Registrarse/i }).click();
    await expect(page.getByText(/Todas las tareas/i)).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /\+ Tarea/i }).click();
    await expect(page.getByPlaceholder(/Título de la tarea/i)).toBeVisible({ timeout: 5000 });

    // Create a tag so the option list renders a pill.
    await page.getByPlaceholder(/Nueva etiqueta/i).fill('Work');
    await page.getByRole('button', { name: /^Crear$/i }).click();

    // Expand the tag dropdown.
    await page.getByRole('button', { name: /Etiquetas/i }).click();

    const search = page.getByPlaceholder('Buscar etiqueta');
    const list = page.getByRole('listbox', { name: /Etiquetas/i });
    const create = page.getByPlaceholder('Nueva etiqueta');
    const title = page.getByPlaceholder(/Título de la tarea/);
    const toggle = page.getByRole('button', { name: /Etiquetas/i });

    await expect(search).toBeVisible();
    await expect(list.getByRole('option', { name: 'Work' })).toBeVisible();

    const searchBox = (await search.boundingBox())!;
    const listBox = (await list.boundingBox())!;
    const createBox = (await create.boundingBox())!;
    const titleBox = (await title.boundingBox())!;
    const toggleBox = (await toggle.boundingBox())!;

    // The search field and the option list do not overlap.
    expect(searchBox.y + searchBox.height).toBeLessThanOrEqual(listBox.y + 1);

    // The dropdown block is separated from the create-new-tag row.
    const gap = createBox.y - (listBox.y + listBox.height);
    expect(gap).toBeGreaterThanOrEqual(4);

    // The tag control spans the block width (same as a full-width field).
    expect(Math.abs(toggleBox.width - titleBox.width)).toBeLessThanOrEqual(2);
  });
});
