// Адаптер для авторизации через AuthMe
const AuthAdapterInterface = require('../AuthAdapterInterface');
const db = require('../../db');
const crypto = require('crypto');

/**
 * Адаптер для работы с авторизацией AuthMe
 */
class AuthMeAdapter extends AuthAdapterInterface {
  constructor() {
    super();
    this.tableName = 'authme';
  }
  
  /**
   * Авторизация пользователя
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<Object|null>} - Данные пользователя или null при неудаче
   */
  async authenticateUser(username, password) {
    try {
      // Ищем пользователя в базе данных
      const users = await db.query(`
        SELECT id, username, password, ip, lastlogin, regdate, realname
        FROM ${this.tableName} 
        WHERE username = ?
      `, [username.toLowerCase()]);
      
      // Если пользователь не найден
      if (users.length === 0) {
        return null;
      }
      
      const user = users[0];
      
      // Проверяем пароль по алгоритму AuthMe
      // Примечание: AuthMe использует различные алгоритмы хеширования (SHA256, BCRYPT и т.д.)
      // В данном примере реализуем проверку для SHA256
      const isPasswordValid = await this.verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }
      
      // Генерируем UUID для совместимости
      const uuid = this.generateUuidFromUsername(user.username);
      
      // Возвращаем данные пользователя без приватной информации
      return {
        id: user.id,
        uuid: uuid,
        username: user.realname || user.username,
        displayName: user.realname || user.username,
        authType: 'authme',
        isAuthenticated: true
      };
    } catch (error) {
      console.error('Ошибка при авторизации пользователя через AuthMe:', error);
      return null;
    }
  }
  
  /**
   * Получить пользователя по UUID
   * @param {string} uuid - UUID пользователя (для AuthMe генерируется из имени)
   * @returns {Promise<Object|null>} - Данные пользователя или null при неудаче
   */
  async getUserByUuid(uuid) {
    try {
      // AuthMe не хранит UUID, поэтому находим соответствующее имя пользователя
      // на основе алгоритма генерации UUID
      // В реальном приложении здесь должна быть таблица соответствия UUID и имен пользователей
      
      // Заглушка: в данной реализации просто ищем пользователей
      const users = await db.query(`
        SELECT id, username, ip, lastlogin, regdate, realname
        FROM ${this.tableName} 
        LIMIT 1
      `);
      
      if (users.length === 0) {
        return null;
      }
      
      const user = users[0];
      const generatedUuid = this.generateUuidFromUsername(user.username);
      
      // Проверяем, совпадает ли сгенерированный UUID с запрошенным
      if (generatedUuid !== uuid) {
        return null;
      }
      
      return {
        id: user.id,
        uuid: generatedUuid,
        username: user.realname || user.username,
        displayName: user.realname || user.username,
        registrationDate: user.regdate ? new Date(user.regdate).toISOString() : null,
        lastAuthenticated: user.lastlogin ? new Date(user.lastlogin).toISOString() : null,
        authType: 'authme'
      };
    } catch (error) {
      console.error('Ошибка при получении пользователя по UUID через AuthMe:', error);
      return null;
    }
  }
  
  /**
   * Получить имя адаптера
   * @returns {string} - Имя адаптера
   */
  getName() {
    return 'AuthMe';
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
      console.error('Ошибка при проверке доступности AuthMe:', error);
      return false;
    }
  }
  
  /**
   * Проверка пароля по алгоритму AuthMe (SHA256)
   * @param {string} password - Пароль
   * @param {string} hash - Хеш из базы данных
   * @returns {Promise<boolean>} - true, если пароль верный
   */
  async verifyPassword(password, hash) {
    try {
      // Пример для SHA256 с солью
      // Формат: $SHA$salt$hash
      const parts = hash.split('$');
      
      if (parts.length !== 4 || parts[1] !== 'SHA') {
        // Неподдерживаемый формат хеша
        return false;
      }
      
      const salt = parts[2];
      const storedHash = parts[3];
      
      // Хешируем пароль
      const calculatedHash = crypto
        .createHash('sha256')
        .update(password + salt)
        .digest('hex');
      
      return calculatedHash === storedHash;
    } catch (error) {
      console.error('Ошибка при проверке пароля AuthMe:', error);
      return false;
    }
  }
  
  /**
   * Генерирует UUID на основе имени пользователя
   * @param {string} username - Имя пользователя
   * @returns {string} - UUID
   */
  generateUuidFromUsername(username) {
    // Генерация UUID версии 3 (на основе имени)
    const namespace = '1ba14bea-9583-45b1-9aeb-c8fc16f3026f'; // Случайный UUID для пространства имен
    
    const hash = crypto
      .createHash('md5')
      .update(namespace + username)
      .digest('hex');
    
    // Формат UUID v3
    let uuid = hash.substring(0, 8) + '-' +
               hash.substring(8, 12) + '-' +
               '3' + hash.substring(13, 16) + '-' +
               hash.substring(16, 20) + '-' +
               hash.substring(20, 32);
    
    return uuid;
  }
}

module.exports = AuthMeAdapter; 