// authService.js - Сервис для работы с авторизацией
import { API_URL } from '../config.js';

/**
 * Получить информацию о системе аутентификации
 * @returns {Promise<Object>} Информация о доступных методах аутентификации
 */
export async function getAuthInfo() {
  try {
    const response = await fetch(`${API_URL}/auth/info`);
    if (!response.ok) {
      throw new Error('Не удалось получить информацию о системе аутентификации');
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении информации о системе аутентификации:', error);
    throw error;
  }
}

/**
 * Вход через логин и пароль
 * @param {string} username - Имя пользователя
 * @param {string} password - Пароль
 * @returns {Promise<Object>} Информация о пользователе
 */
export async function login(username, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка авторизации');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    throw error;
  }
}

/**
 * Вход через Telegram
 * @param {Object} telegramData - Данные аутентификации Telegram
 * @returns {Promise<Object>} Информация о пользователе
 */
export async function loginWithTelegram(telegramData) {
  try {
    const response = await fetch(`${API_URL}/auth/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(telegramData),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка авторизации через Telegram');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при авторизации через Telegram:', error);
    throw error;
  }
}

/**
 * Выход из аккаунта
 * @returns {Promise<Object>} Результат выхода
 */
export async function logout() {
  try {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при выходе из аккаунта');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при выходе из аккаунта:', error);
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
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Ошибка авторизации через Telegram Widget');
    }
    
    if (data.success) {
      // Сохраняем данные пользователя в localStorage
      localStorage.setItem('user', JSON.stringify({
        session: data.session,
        user: data.user
      }));
      
      return {
        session: data.session,
        user: data.user
      };
    } else {
      // Возвращаем данные для привязки аккаунта
      return {
        needsBinding: true,
        telegramData: data.telegramData,
        message: data.message
      };
    }
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
    const response = await fetch('/api/auth/telegram/widget-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ telegramData, username, password })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Не удалось привязать Telegram аккаунт');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
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