import { Page, expect } from '@playwright/test';
import { ADMIN_CREDENTIALS } from './api-helpers';

/**
 * Логинится как админ через UI (форма входа)
 */
export async function loginAsAdminViaUI(page: Page): Promise<void> {
  await page.goto('/login');
  
  await page.fill('#identifier', ADMIN_CREDENTIALS.email);
  await page.fill('#password', ADMIN_CREDENTIALS.password);
  
  // Ждём успешный ответ от бэка перед редиректом
  const loginResponse = page.waitForResponse(
    res => res.url().includes('/auth/login') && res.status() === 200
  );
  
  await page.click('form button[type="submit"]');
  await loginResponse;
  
  // Ждём редирект в админку
  await page.waitForURL('/admin');
  await expect(page.locator('h1')).toContainText('Управление пользователями');
}

/**
 * Находит карточку пользователя по username в списке
 */
export async function findUserCard(page: Page, username: string) {
  const userCard = page.locator(`[class*="userCard"]:has-text("${username}")`).first();
  await expect(userCard).toBeVisible({ timeout: 10000 });
  return userCard;
}

/**
 * Удаляет пользователя через UI (клик по deleteArea → подтверждение)
 */
export async function deleteUserViaUI(page: Page, userCard: ReturnType<typeof page.locator>): Promise<void> {
  // Показываем зону удаления (hover)
  await userCard.hover();
  
  const deleteArea = userCard.locator('[class*="deleteArea"]');
  await expect(deleteArea).toBeVisible();
  await deleteArea.click();
  
  // Ждём модалку по тексту сообщения
  const confirmModal = page.locator('text=Вы уверены, что хотите удалить этого пользователя?');
  await expect(confirmModal).toBeVisible({ timeout: 10000 });
  
  // Кликаем "Удалить"
  await page.click('button:has-text("Удалить")');
  
  // Ждём исчезновения карточки
  await expect(userCard).not.toBeVisible({ timeout: 5000 });
}

/**
 * Меняет роль пользователя через UI (открытие модалки → выбор роли → сохранение)
 */
export async function changeUserRoleViaUI(
  page: Page, 
  userCard: ReturnType<typeof page.locator>,
  newRole: 'admin' | 'user'
): Promise<void> {
  // Кликаем по карточке → открывается UserModal
  await userCard.click();
  
  // Ждём модалку с информацией
  const userModal = page.locator('text=Информация о пользователе');
  await expect(userModal).toBeVisible({ timeout: 10000 });
  
  // Находим select с ролью и меняем значение
  const roleSelect = page.locator('select').first();
  await roleSelect.selectOption(newRole);
  
  // Кликаем "Сохранить"
  await page.click('button:has-text("Сохранить")');
  
  // Ждём закрытие модалки и уведомление об успехе
  await expect(userModal).not.toBeVisible({ timeout: 5000 });
  
  const successNotif = page.getByRole('alert').filter({ hasText: 'Роль пользователя успешно обновлена' });
  await expect(successNotif).toBeVisible();
}