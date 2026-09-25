import { test, expect } from 'playwright/test';

const BASE = 'http://localhost:5173';
const email = `e2e_${Date.now()}@test.com`;
const password = 'Test123!';

test.describe('Full E2E Flow (Repository-backed)', () => {
  test('register, create task with tag, verify tag refresh, delete task', async ({ page }) => {
    // --- Register + auto-login ---
    await page.goto(`${BASE}/register`);
    await expect(page.getByRole('heading', { name: /register/i })).toBeVisible({ timeout: 10000 });

    const emailInput = page.locator('label', { hasText: 'Email' }).locator('..').locator('input');
    const passwordInput = page.locator('label', { hasText: 'Password' }).locator('..').locator('input');
    await emailInput.fill(email);
    await passwordInput.fill(password);

    await page.getByRole('button', { name: /register/i }).click();

    // Auto-login should navigate to /tasks and show the board
    await expect(page.getByText(/Task Board/i)).toBeVisible({ timeout: 15000 });

    // --- Create a task via modal ---
    const uniqueTitle = `E2E Task ${Date.now()}`;
    await page.getByRole('button', { name: /\+ Task/i }).click();

    const titleInput = page.getByPlaceholder(/Enter task title/i);
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill(uniqueTitle);

    // Add a new tag via the tag input in the modal (if present)
    const tagInput = page.locator('input[placeholder*="tag" i], input[name*="tag" i]').first();
    if (await tagInput.isVisible()) {
      const tagName = `E2ETag_${Date.now()}`;
      await tagInput.fill(tagName);
      await tagInput.press('Enter');
    }

    await page.getByRole('button', { name: /save/i }).click();

    // Task should appear on the board
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });

    // --- Verify delete button exists (new feature from this change) ---
    const card = page.locator('[data-task]', { hasText: uniqueTitle }).first();
    const deleteBtn = card.locator('button[aria-label="Delete task"]');
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });

    // --- Delete the task ---
    page.on('dialog', (dialog) => dialog.accept());
    await deleteBtn.click();

    // Task should disappear from the board
    await expect(page.getByText(uniqueTitle)).not.toBeVisible({ timeout: 10000 });
  });
});
