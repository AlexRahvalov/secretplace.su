// authService.js - Сервис для работы с авторизацией

/**
 * Авторизует пользователя на сервере
 * @param {string} username - Имя пользователя
 * @param {string} password - Пароль
 * @returns {Promise<Object>} Данные пользователя
 */
export async function login(username, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка авторизации');
    }
    
    const userData = await response.json();
    
    // Сохраняем данные пользователя в localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    return userData;
  } catch (error) {
    throw error;
  }
}

/**
 * Авторизует пользователя через Telegram
 * @param {number} telegramId - ID пользователя в Telegram
 * @returns {Promise<Object>} Данные пользователя
 */
export async function loginWithTelegram(telegramId) {
  try {
    const response = await fetch('/api/auth/telegram/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ telegramId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка авторизации через Telegram');
    }
    
    const userData = await response.json();
    
    // Сохраняем данные пользователя в localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    return userData;
  } catch (error) {
    throw error;
  }
}

/**
 * Авторизует пользователя через Telegram Widget
 * @param {Object} userData - Данные пользователя от Telegram Widget
 * @returns {Promise<Object>} Данные пользователя
 */
export async function loginWithTelegramWidget(userData) {
  try {
    const response = await fetch('/api/auth/telegram/widget-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка авторизации через Telegram Widget');
    }
    
    const user = await response.json();
    
    // Сохраняем данные пользователя в localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    throw error;
  }
}

/**
 * Генерирует код для привязки Telegram к аккаунту
 * @param {string} username - Имя пользователя
 * @param {string} password - Пароль
 * @returns {Promise<Object>} Данные с кодом привязки
 */
export async function generateTelegramLinkCode(username, password) {
  try {
    const response = await fetch('/api/auth/telegram/generate-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Не удалось сгенерировать код');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * Привязывает Telegram к существующему аккаунту по данным из виджета
 * @param {Object} telegramData - Данные пользователя из виджета Telegram
 * @param {string} username - Имя пользователя
 * @param {string} password - Пароль
 * @returns {Promise<Object>} Результат привязки
 */
export async function bindTelegramWithWidget(telegramData, username, password) {
  try {
    const response = await fetch('/api/auth/telegram/bind-widget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ telegramData, username, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Не удалось привязать Telegram аккаунт');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * Выход пользователя из системы
 */
export function logout() {
  // Удаляем данные пользователя из localStorage
  localStorage.removeItem('user');
}

/**
 * Получает текущего авторизованного пользователя
 * @returns {Object|null} Данные пользователя или null, если пользователь не авторизован
 */
export function getCurrentUser() {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Проверяет, авторизован ли пользователь
 * @returns {boolean} true, если пользователь авторизован
 */
export function isAuthenticated() {
  return !!getCurrentUser();
}

/**
 * Получает информацию о системе авторизации
 * @returns {Promise<Object>} Информация о системе авторизации
 */
export async function getAuthInfo() {
  try {
    const response = await fetch('/api/auth/info');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Не удалось получить информацию об авторизации');
    }
    
    const data = await response.json();
    
    // Убедимся, что поле telegramEnabled существует
    if (data.telegramEnabled === undefined) {
      data.telegramEnabled = false;
    }
    
    return data;
  } catch (error) {
    return { 
      activeAdapter: 'Неизвестно', 
      availableAdapters: [],
      telegramEnabled: false
    };
  }
} 