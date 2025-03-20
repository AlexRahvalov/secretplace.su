// Адаптер для авторизации через Telegram
const AuthAdapterInterface = require('../AuthAdapterInterface');
const db = require('../../db');
const telegramAuthModel = require('../../models/telegramAuthModel');
const easyAuthAdapter = require('./EasyAuthAdapter');
const TABLES = require('../../config/tables');

/**
 * Адаптер для работы с авторизацией через Telegram
 */
class TelegramAuthAdapter extends AuthAdapterInterface {
  constructor() {
    super();
    this.easyAuthAdapter = new easyAuthAdapter();
  }
  
  /**
   * Авторизация пользователя через Telegram ID
   * @param {number} telegramId - ID пользователя в Telegram
   * @returns {Promise<Object|null>} - Данные пользователя или null при неудаче
   */
  async authenticateByTelegramId(telegramId) {
    try {
      // Получаем информацию о привязке Telegram
      const telegramLink = await telegramAuthModel.getTelegramLinkByTelegramId(telegramId);
      
      if (!telegramLink) {
        return null;
      }
      
      // Получаем пользователя через EasyAuth адаптер
      const user = await this.easyAuthAdapter.getUserByUsername(telegramLink.username);
      
      if (!user) {
        return null;
      }
      
      // Возвращаем данные пользователя с информацией о привязке
      return {
        ...user,
        authType: 'telegram',
        telegramId: telegramLink.telegram_id,
        isAuthenticated: true
      };
    } catch (error) {
      console.error('Ошибка при авторизации пользователя через Telegram:', error);
      return null;
    }
  }
  
  /**
   * Авторизация пользователя по логину и паролю
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<Object|null>} - Данные пользователя или null при неудаче
   */
  async authenticateUser(username, password) {
    try {
      // Используем авторизацию через EasyAuth
      const user = await this.easyAuthAdapter.authenticateUser(username, password);
      
      if (!user) {
        return null;
      }
      
      // Проверяем, есть ли привязка к Telegram
      const telegramLink = await telegramAuthModel.getTelegramLinkByUsername(username);
      
      if (!telegramLink || !telegramLink.telegram_id) {
        // Если нет привязки, просто возвращаем данные пользователя
        return user;
      }
      
      // Если есть привязка, добавляем информацию о ней
      return {
        ...user,
        telegramId: telegramLink.telegram_id,
        telegramLinked: true,
        linkedAt: telegramLink.linked_at
      };
    } catch (error) {
      console.error('Ошибка при авторизации пользователя через Telegram Adapter:', error);
      return null;
    }
  }
  
  /**
   * Получить пользователя по UUID
   * @param {string} uuid - UUID пользователя
   * @returns {Promise<Object|null>} - Данные пользователя или null при неудаче
   */
  async getUserByUuid(uuid) {
    try {
      // Используем EasyAuth для получения пользователя
      const user = await this.easyAuthAdapter.getUserByUuid(uuid);
      
      if (!user) {
        return null;
      }
      
      // Проверяем, есть ли привязка к Telegram
      const telegramLink = await telegramAuthModel.getTelegramLinkByUsername(user.username);
      
      if (!telegramLink || !telegramLink.telegram_id) {
        // Если нет привязки, просто возвращаем данные пользователя
        return user;
      }
      
      // Если есть привязка, добавляем информацию о ней
      return {
        ...user,
        telegramId: telegramLink.telegram_id,
        telegramLinked: true,
        linkedAt: telegramLink.linked_at
      };
    } catch (error) {
      console.error('Ошибка при получении пользователя по UUID через Telegram Adapter:', error);
      return null;
    }
  }
  
  /**
   * Получить пользователя по имени пользователя
   * @param {string} username - Имя пользователя
   * @returns {Promise<Object|null>} - Данные пользователя или null при неудаче
   */
  async getUserByUsername(username) {
    try {
      // Используем EasyAuth для получения пользователя
      const user = await this.easyAuthAdapter.getUserByUsername(username);
      
      if (!user) {
        return null;
      }
      
      // Проверяем, есть ли привязка к Telegram
      const telegramLink = await telegramAuthModel.getTelegramLinkByUsername(username);
      
      if (!telegramLink || !telegramLink.telegram_id) {
        // Если нет привязки, просто возвращаем данные пользователя
        return user;
      }
      
      // Если есть привязка, добавляем информацию о ней
      return {
        ...user,
        telegramId: telegramLink.telegram_id,
        telegramLinked: true,
        linkedAt: telegramLink.linked_at
      };
    } catch (error) {
      console.error('Ошибка при получении пользователя по имени через Telegram Adapter:', error);
      return null;
    }
  }
  
  /**
   * Генерация кода для привязки Telegram
   * @param {string} username - Имя пользователя
   * @returns {Promise<Object>} - Объект с кодом и сроком действия
   */
  async generateLinkCode(username) {
    try {
      // Сначала проверяем, существует ли пользователь
      const user = await this.easyAuthAdapter.getUserByUsername(username);
      
      if (!user) {
        return { success: false, message: 'Пользователь не найден' };
      }
      
      // Генерируем случайный код
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Устанавливаем срок действия кода (15 минут)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      // Сохраняем код в базе данных
      const result = await telegramAuthModel.createLinkCode(username, code, expiresAt);
      
      if (!result) {
        return { success: false, message: 'Ошибка при создании кода' };
      }
      
      return {
        success: true,
        code,
        expiresAt,
        username
      };
    } catch (error) {
      console.error('Ошибка при генерации кода для привязки Telegram:', error);
      return { success: false, message: 'Ошибка сервера' };
    }
  }
  
  /**
   * Получить имя адаптера
   * @returns {string} - Имя адаптера
   */
  getName() {
    return 'TelegramAuth';
  }
  
  /**
   * Проверка доступности адаптера
   * @returns {Promise<boolean>} - true, если адаптер доступен
   */
  async isAvailable() {
    try {
      // Проверяем наличие таблицы Telegram Auth в базе данных
      const telegramTable = await db.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = ?
      `, [TABLES.TELEGRAM_AUTH]);
      
      // Проверяем доступность базового адаптера EasyAuth
      const easyAuthAvailable = await this.easyAuthAdapter.isAvailable();
      
      return telegramTable[0].count > 0 && easyAuthAvailable;
    } catch (error) {
      console.error('Ошибка при проверке доступности Telegram Auth:', error);
      return false;
    }
  }
}

module.exports = TelegramAuthAdapter; 