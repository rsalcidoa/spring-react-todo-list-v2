import { test, expect } from 'playwright/test';

const BASE = 'http://localhost:5173';
const email = `e2e_${Date.now()}@test.com`;
const password = 'Test123!';

test.describe('Full E2E Flow (Repository-backed)', () => {
  test('register, create task with tag, verify tag refresh, delete task', async ({ page }) => {
    // --- Register + auto-login ---
    await page.goto(`${BASE}/register`);
    await expect(page.getByRole('heading', { name: /Registrarse/i })).toBeVisible({ timeout: 10000 });

    const emailInput = page.locator('label', { hasText: 'Correo' }).locator('..').locator('input');
    const passwordInput = page.locator('label', { hasText: 'Contraseña' }).locator('..').locator('input');
    await emailInput.fill(email);
    await passwordInput.fill(password);

    await page.getByRole('button', { name: /Registrarse/i }).click();

    // Auto-login should navigate to /tasks and show the board
    await expect(page.getByText(/Tablero/i)).toBeVisible({ timeout: 15000 });

    // --- Create a task via modal ---
    const uniqueTitle = `E2E Task ${Date.now()}`;
    await page.getByRole('button', { name: /\+ Tarea/i }).click();

    const titleInput = page.getByPlaceholder(/Título de la tarea/i);
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill(uniqueTitle);

    // Add a new tag via the tag input in the modal
    const tagName = `E2ETag_${Date.now()}`;
    await page.getByPlaceholder(/Nueva etiqueta/).fill(tagName);
    await page.getByRole('button', { name: 'Crear', exact: true }).click();
    await expect(
      page.getByRole('dialog').getByRole('button', { name: tagName, exact: true }),
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /Guardar/i }).click();

    // Task should appear on the board with its tag
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });
    const card = page.locator('[data-task]', { hasText: uniqueTitle }).first();
    await expect(card.getByText(tagName)).toBeVisible({ timeout: 10000 });

    // --- Search + clear (add-task-query) ---
    const search = page.getByPlaceholder(/Buscar tareas/i);
    await search.fill(uniqueTitle);
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });
    await search.fill('zzz-no-such-task');
    await expect(page.getByText(uniqueTitle)).not.toBeVisible({ timeout: 10000 });
    await search.fill('');
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });

    // --- View selector (add-board-views) ---
    await page.getByLabel('Vista').selectOption('overdue');
    await expect(page.getByText(uniqueTitle)).not.toBeVisible({ timeout: 10000 });
    await page.getByLabel('Vista').selectOption('all');
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });

    // --- Verify delete button exists ---
    const deleteBtn = card.locator('button[aria-label="Borrar tarea"]');
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });

    // --- Delete the task ---
    page.on('dialog', (dialog) => dialog.accept());
    await deleteBtn.click();

    // Task should disappear from the board
    await expect(page.getByText(uniqueTitle)).not.toBeVisible({ timeout: 10000 });
  });

  test('quick-add a task and move it with the keyboard', async ({ page }) => {
    const unique = `e2e_qk_${Date.now()}@test.com`;
    await page.goto(`${BASE}/register`);
    await expect(page.getByRole('heading', { name: /Registrarse/i })).toBeVisible({ timeout: 10000 });
    const inputs = page.locator('form input');
    await inputs.nth(0).fill(unique);
    await inputs.nth(1).fill(password);
    await page.getByRole('button', { name: /Registrarse/i }).click();
    await expect(page.getByText(/Tablero/i)).toBeVisible({ timeout: 15000 });

    // Empty board: create the first task through the CTA/modal so columns render.
    await page.getByRole('button', { name: /Crear tarea/i }).click();
    await page.getByPlaceholder(/Título de la tarea/i).fill('Seed task');
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(page.getByText('Seed task')).toBeVisible({ timeout: 10000 });

    const quick = page.getByPlaceholder('Añadir tarea').first();
    await quick.fill('Quick task');
    await quick.press('Enter');

    const card = page.locator('[data-task]', { hasText: 'Quick task' }).first();
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.focus();
    await page.keyboard.press('Alt+ArrowRight');

    await expect(page.getByRole('heading', { name: /En progreso 1/ })).toBeVisible({ timeout: 10000 });
  });
});
