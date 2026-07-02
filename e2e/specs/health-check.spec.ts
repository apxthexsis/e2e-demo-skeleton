import { test, expect } from '@playwright/test';

test(
  'Health check - app responds and renders the shell',
  { tag: ['@app-health-check', '@ci'] },
  async ({ page }) => {
    const response = await page.request.get('/health');
    expect(response.ok()).toBeTruthy();

    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  }
);
