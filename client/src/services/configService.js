// configService.js - Сервис для работы с конфигурацией сайта

/**
 * Получает значение конфигурации по имени
 * @param {string} name - Имя параметра конфигурации
 * @returns {Promise<string>} Значение параметра
 */
export async function getConfig(name) {
  try {
    const response = await fetch(`/api/config?name=${encodeURIComponent(name)}`);
    
    if (!response.ok) {
      throw new Error(`Ошибка при получении конфигурации ${name}`);
    }
    
    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error(`Ошибка при получении конфигурации ${name}:`, error);
    throw error;
  }
}

/**
 * Получает несколько значений конфигурации по именам
 * @param {string[]} names - Массив имен параметров
 * @returns {Promise<Object>} Объект с параметрами {name: value, ...}
 */
export async function getMultipleConfigs(names) {
  try {
    if (!Array.isArray(names) || names.length === 0) {
      return {};
    }
    
    const namesParam = names.join(',');
    const response = await fetch(`/api/config/multiple?names=${encodeURIComponent(namesParam)}`);
    
    if (!response.ok) {
      throw new Error('Ошибка при получении конфигураций');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении конфигураций:', error);
    throw error;
  }
}

/**
 * Получает все параметры конфигурации
 * @returns {Promise<Array>} Массив всех параметров
 */
export async function getAllConfigs() {
  try {
    const response = await fetch('/api/config');
    
    if (!response.ok) {
      throw new Error('Ошибка при получении конфигураций');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении всех конфигураций:', error);
    throw error;
  }
} 