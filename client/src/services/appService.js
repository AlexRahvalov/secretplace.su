// appService.js - Сервис для получения информации о приложении

/**
 * Получает версию приложения из package.json
 * @returns {Promise<string>} Версия приложения
 */
export async function getVersion() {
  try {
    const response = await fetch('/api/version');
    if (!response.ok) {
      throw new Error('Не удалось получить версию приложения');
    }
    const data = await response.json();
    return data.version;
  } catch (error) {
    console.error('Ошибка при получении версии:', error);
    return 'Неизвестная версия';
  }
}

/**
 * Получает URL репозитория GitHub
 * @returns {Promise<string>} URL репозитория
 */
export async function getRepositoryUrl() {
  try {
    const response = await fetch('/api/repository');
    if (!response.ok) {
      throw new Error('Не удалось получить URL репозитория');
    }
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Ошибка при получении URL репозитория:', error);
    return '#';
  }
} 