// Модель для работы с пользователями и авторизацией
const db = require('../db');
const { verifyPassword } = require('../crypto/argon2');

// Имя таблицы EasyAuth
const TABLE_EASYAUTH = 'easyauth';

/**
 * Авторизация пользователя
 * @param {string} username - Имя пользователя
 * @param {string} password - Пароль
 * @returns {Promise<Object|null>} Данные пользователя или null при неудаче
 */
async function authenticateUser(username, password) {
  try {
    // Ищем пользователя в базе данных
    const users = await db.query(`
      SELECT id, uuid, username, data 
      FROM ${TABLE_EASYAUTH} 
      WHERE username_lowercase = ?
    `, [username.toLowerCase()]);
    
    // Если пользователь не найден
    if (users.length === 0) {
      return null;
    }
    
    const user = users[0];
    
    // Разбираем JSON данные пользователя
    const userData = JSON.parse(user.data);
    
    // Если у пользователя нет пароля
    if (!userData.password) {
      return null;
    }
    
    // Проверяем пароль
    const isPasswordValid = await verifyPassword(userData.password, password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // Возвращаем данные пользователя без приватной информации
    return {
      id: user.id,
      uuid: user.uuid,
      username: user.username || userData.username || '',
      displayName: userData.display_name || userData.username || user.username || '',
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Ошибка при авторизации пользователя:', error);
    return null;
  }
}

/**
 * Получить пользователя по UUID
 * @param {string} uuid - UUID пользователя
 * @returns {Promise<Object|null>} Данные пользователя или null при неудаче
 */
async function getUserByUuid(uuid) {
  try {
    const users = await db.query(`
      SELECT id, uuid, username, data 
      FROM ${TABLE_EASYAUTH} 
      WHERE uuid = ?
    `, [uuid]);
    
    if (users.length === 0) {
      return null;
    }
    
    const user = users[0];
    const userData = JSON.parse(user.data);
    
    return {
      id: user.id,
      uuid: user.uuid,
      username: user.username || userData.username || '',
      displayName: userData.display_name || userData.username || user.username || '',
      registrationDate: userData.registration_date || null,
      lastAuthenticated: userData.last_authenticated_date || null
    };
  } catch (error) {
    console.error('Ошибка при получении пользователя по UUID:', error);
    return null;
  }
}

module.exports = {
  authenticateUser,
  getUserByUuid
}; 