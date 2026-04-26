import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Расширяем тесты своими фикстурами
export const test = base.extend<{
  loggedInPage: Page;
}>({
  loggedInPage: async ({ page }, use) => {
    // Логинимся один раз и передаём страницу в тест
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await use(page);
  },
});

export { expect };