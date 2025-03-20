// Адаптер для авторизации через EasyAuth
const AuthAdapterInterface = require('../AuthAdapterInterface');
const db = require('../../db');
const { verifyPassword } = require('../../crypto/argon2');

/**
 * Адаптер для работы с авторизацией EasyAuth
 */
class EasyAuthAdapter extends AuthAdapterInterface {
  constructor() {
    super();
    this.tableName = 'easyauth';
  }
  
  /**
   * Авторизация пользователя
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<Object|null>} - Данные пользователя или null при неудаче
   */
  async authenticateUser(username, password) {
    try {
      console.log(`Попытка авторизации пользователя: ${username}`);
      
      // Ищем пользователя в базе данных
      const users = await db.query(`
        SELECT id, uuid, username, data 
        FROM ${this.tableName} 
        WHERE username_lower = ?
      `, [username.toLowerCase()]);
      
      // Если пользователь не найден
      if (users.length === 0) {
        console.log(`Пользователь не найден: ${username}`);
        return null;
      }
      
      const user = users[0];
      console.log(`Пользователь найден: ${user.username}, ID: ${user.id}`);
      
      // Получаем данные пользователя
      let userData;
      
      // Проверяем тип данных - если это уже объект, используем его напрямую
      if (typeof user.data === 'object' && user.data !== null) {
        console.log('Данные пользователя уже являются объектом');
        userData = user.data;
      } else {
        // Иначе пытаемся распарсить JSON
        try {
          userData = JSON.parse(user.data);
          console.log(`Данные пользователя успешно разобраны из JSON`);
        } catch (jsonError) {
          console.error(`Ошибка при разборе JSON данных пользователя:`, jsonError);
          console.log(`Исходные данные:`, user.data);
          return null;
        }
      }
      
      // Если у пользователя нет пароля
      if (!userData.password) {
        console.log(`У пользователя ${username} отсутствует пароль`);
        return null;
      }
      
      console.log(`Проверка пароля для пользователя ${username}`);
      
      // Проверяем пароль с использованием Argon2
      const isPasswordValid = await verifyPassword(userData.password, password);
      
      if (!isPasswordValid) {
        console.log(`Неверный пароль для пользователя ${username}`);
        return null;
      }
      
      console.log(`Пользователь ${username} успешно авторизован`);
      
      // Возвращаем данные пользователя без приватной информации
      return {
        id: user.id,
        uuid: user.uuid,
        username: user.username || userData.username || '',
        displayName: userData.display_name || userData.username || user.username || '',
        authType: 'easyauth',
        isAuthenticated: true
      };
    } catch (error) {
      console.error('Ошибка при авторизации пользователя через EasyAuth:', error);
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
      const users = await db.query(`
        SELECT id, uuid, username, data 
        FROM ${this.tableName} 
        WHERE uuid = ?
      `, [uuid]);
      
      if (users.length === 0) {
        return null;
      }
      
      const user = users[0];
      
      // Получаем данные пользователя
      let userData;
      
      // Проверяем тип данных - если это уже объект, используем его напрямую
      if (typeof user.data === 'object' && user.data !== null) {
        userData = user.data;
      } else {
        // Иначе пытаемся распарсить JSON
        try {
          userData = JSON.parse(user.data);
        } catch (jsonError) {
          console.error(`Ошибка при разборе JSON данных пользователя:`, jsonError);
          return null;
        }
      }
      
      return {
        id: user.id,
        uuid: user.uuid,
        username: user.username || userData.username || '',
        displayName: userData.display_name || userData.username || user.username || '',
        registrationDate: userData.registration_date || null,
        lastAuthenticated: userData.last_authenticated_date || null,
        authType: 'easyauth'
      };
    } catch (error) {
      console.error('Ошибка при получении пользователя по UUID через EasyAuth:', error);
      return null;
    }
  }
  
  /**
   * Получить имя адаптера
   * @returns {string} - Имя адаптера
   */
  getName() {
    return 'EasyAuth';
  }
  
  /**
   * Проверка доступности адаптера
   * @returns {Promise<boolean>} - true, если адаптер доступен
   */
  async isAvailable() {
    try {
      // Проверяем наличие таблицы в базе данных
      const result = await db.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = ?
      `, [this.tableName]);
      
      return result[0].count > 0;
    } catch (error) {
      console.error('Ошибка при проверке доступности EasyAuth:', error);
      return false;
    }
  }
}

module.exports = EasyAuthAdapter; 