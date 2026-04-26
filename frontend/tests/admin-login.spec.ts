import { test, expect } from '@playwright/test';


const TEST_ADMIN = {
  email: 'test_admin@example.com',
  password: 'TestAdmin123!',
};

test.describe('Вход админа в систему', () => {
  
  test('успешный вход с главной страницы', async ({ page }) => {
    
    await page.goto('/');
    
    // Проверяем, что заголовок страницы загрузился
    await expect(page.locator('h1')).toContainText('Попробуйте этот веб-сервис');
    
    // Используем getByRole — это устойчивый селектор (доступность)
    await page.getByRole('button', { name: 'Начать работу' }).click();
    
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h2')).toContainText('Вход');
    
    await page.fill('#identifier', TEST_ADMIN.email);
    await page.fill('#password', TEST_ADMIN.password);
    
    const loginResponse = page.waitForResponse(
      response => response.url().includes('/auth/login') && response.status() === 200
    );

    // Кликаем по кнопке с type="submit" внутри формы
    await page.click('form button[type="submit"]');
    await loginResponse;
    
    // waitForURL ждёт, пока адрес не станет /admin (с учётом возможных параметров)
    await page.waitForURL('/admin');
    
    await expect(page.locator('h1')).toContainText('Управление пользователями');
    
    // Проверяем, что таблица/список пользователей отобразился
    await expect(page.locator('[class*="usersList"]')).toBeVisible();
  });

  test('ошибка при неверном пароле', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Вход');
    
    await page.fill('#identifier', TEST_ADMIN.email);
    await page.fill('#password', 'wrongpassword123');
    
    const failedLoginResponse = page.waitForResponse(
      response => 
        response.url().includes('/auth/login') && 
        response.status() === 401
    );

    await page.click('form button[type="submit"]');

    await failedLoginResponse;

    await expect(page).toHaveURL('/login');
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Ошибка входа');
  });
});