import { test, expect, Response } from '@playwright/test';
import { 
  createTestUserViaAPI, 
  getAdminToken, 
  checkUserExists,
  ADMIN_CREDENTIALS 
} from './fixtures/api-helpers';
import { 
  loginAsAdminViaUI, 
  findUserCard, 
  deleteUserViaUI, 
  changeUserRoleViaUI 
} from './fixtures/ui-helpers';

const API_URL = 'http://localhost:8000';

async function tryChangeOwnRoleViaUI(page: any, newRole: 'admin' | 'user') {
  // Открываем модалку (кликаем по своей карточке)
  const adminCard = page.locator(`[class*="userCard"]:has-text("${ADMIN_CREDENTIALS.name}")`).first();
  await adminCard.click();
  
  // Ждём модалку
  const userModal = page.locator('text=Информация о пользователе');
  await expect(userModal).toBeVisible({ timeout: 10000 });
  
  // Меняем роль в select
  const roleSelect = page.locator('select').first();
  await roleSelect.selectOption(newRole);
  
  // Перехватываем ошибку от бэка
    const errorResponse = page.waitForResponse(
    (res: Response) => res.url().includes('/admin/users/') && 
            res.request().method() === 'PATCH' &&
            (res.status() === 400 || res.status() === 403)
    );
  
  // Кликаем "Сохранить"
  await page.click('button:has-text("Сохранить")');
  await errorResponse;
  
  // Проверяем уведомление об ошибке
  const errorNotif = page.getByRole('alert').filter({ hasText: 'нельзя изменить свою собственную роль' });
  await expect(errorNotif).toBeVisible({ timeout: 5000 });
  
  // Фолбэк, если текст уведомления другой
  if (!(await errorNotif.isVisible())) {
    const fallback = page.locator('[class*="notification"][class*="error"]');
    await expect(fallback).toBeVisible();
  }
  
  // Возвращаем модалку, чтобы тест мог её закрыть
  return userModal;
}


async function closeModal(page: any, modal: any) {
  // Пробуем закрыть по кнопке
  const closeButton = page.locator('button:has-text("Закрыть")').first();
  if (await closeButton.isVisible()) {
    await closeButton.click();
  } else {
    // Фолбэк: клик по оверлею
    await page.locator('[class*="overlay"]').first().click();
  }
  await expect(modal).not.toBeVisible({ timeout: 5000 });
}



test.describe('Действия админа с пользователями', () => {
  
  // ТЕСТ 1: Изменение роли другому пользователю (успех)
  test('админ может изменить роль другого пользователя', async ({ page, request }) => {
    
    // SETUP: Создаём тестового юзера
    const testUser = await createTestUserViaAPI(request, 'role');
    console.log(`Создан: ${testUser.username} (ID: ${testUser.id})`);
    
    // ШАГ 1: Логинимся как админ
    await loginAsAdminViaUI(page);
    
    // ШАГ 2: Находим карточку тестового пользователя
    const userCard = await findUserCard(page, testUser.username);
    
    // ШАГ 3: Меняем роль (пользователь → админ)
    await changeUserRoleViaUI(page, userCard, 'admin');
    
    // ШАГ 4: Проверяем, что в карточке теперь "Админ"
    await expect(userCard).toContainText('Админ');
    
    // ШАГ 5: Проверяем через API, что роль действительно изменилась
    const adminToken = await getAdminToken(request);
    const checkResponse = await request.get(`${API_URL}/admin/users/${testUser.id}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    
    expect(checkResponse.status()).toBe(200);
    const userData = await checkResponse.json();
    expect(userData.role).toBe('admin');
    
    console.log(`Роль ${testUser.username} изменена на "admin"`);
  });

  // ТЕСТ 2: Попытка изменить свою роль (ошибка + модалка не закрывается)
  test('админ не может изменить свою собственную роль', async ({ page }) => {
    
    await loginAsAdminViaUI(page);
    
    // Пытаемся изменить свою роль
    const modal = await tryChangeOwnRoleViaUI(page, 'user');
    
    // Модалка ВСЁ ЕЩЁ открыта (не закрылась автоматически)
    await expect(modal).toBeVisible();
    
    // Закрываем модалку вручную, чтобы не мешала следующим тестам
    await closeModal(page, modal);
    
    console.log('Защита от смены своей роли работает');
  });

  // ТЕСТ 3: Удаление пользователя (цепочка: создали в тесте 1 → удаляем здесь)
  test('админ может удалить пользователя после изменения его роли', async ({ page, request }) => {
    
    // SETUP: Создаём нового тестового юзера (или можно переиспользовать из теста 1, но лучше новый для изоляции)
    const testUser = await createTestUserViaAPI(request, 'del');
    console.log(` Создан для удаления: ${testUser.username} (ID: ${testUser.id})`);
    
    await loginAsAdminViaUI(page);
    
    // Находим карточку
    const userCard = await findUserCard(page, testUser.username);
    
    // Опционально: сначала меняем роль, потом удаляем (полная цепочка)
    await changeUserRoleViaUI(page, userCard, 'admin');
    await expect(userCard).toContainText('Админ');
    
    // Удаляем через UI
    await deleteUserViaUI(page, userCard);
    
    // Проверяем через API, что пользователь удалён
    const adminToken = await getAdminToken(request);
    const exists = await checkUserExists(request, testUser.id, adminToken);
    expect(exists).toBe(false);
    
    console.log(`Пользователь ${testUser.username} удалён`);
  });

  // ТЕСТ 4: Попытка удалить самого себя (ошибка)
  test('админ не может удалить самого себя', async ({ page }) => {
    
    await loginAsAdminViaUI(page);
    
    // Находим карточку админа по name
    const adminCard = page.locator(`[class*="userCard"]:has-text("${ADMIN_CREDENTIALS.name}")`).first();
    await expect(adminCard).toBeVisible();
    
    // Наводим и кликаем на зону удаления
    await adminCard.hover();
    const deleteArea = adminCard.locator('[class*="deleteArea"]');
    await expect(deleteArea).toBeVisible();
    await deleteArea.click();
    
    // Ждём модалку подтверждения
    const confirmModal = page.locator('text=Вы уверены, что хотите удалить этого пользователя?');
    await expect(confirmModal).toBeVisible({ timeout: 10000 });
    
    // Перехватываем ошибку от бэка (400/403)
    const errorResponse = page.waitForResponse(
      res => res.request().method() === 'DELETE' && 
             res.url().includes('/admin/users/') &&
             (res.status() === 400 || res.status() === 403)
    );
    
    // Кликаем "Удалить" в модалке
    await page.click('button:has-text("Удалить")');
    await errorResponse;
    
    // Проверяем уведомление об ошибке
    const errorNotif = page.getByRole('alert').filter({ hasText: 'нельзя удалить самого себя' });
    await expect(errorNotif).toBeVisible({ timeout: 5000 });
    
    // Фолбэк, если текст уведомления другой
    if (!(await errorNotif.isVisible())) {
      const fallback = page.locator('[class*="notification"][class*="error"]');
      await expect(fallback).toBeVisible();
    }
    
    // Карточка админа ВСЁ ЕЩЁ на месте
    await expect(adminCard).toBeVisible();
    
    // Модалка закрылась (в отличие от смены роли, здесь она закрывается после ошибки)
    await expect(confirmModal).not.toBeVisible();
    
    console.log('Защита от self-delete работает');
  });
});