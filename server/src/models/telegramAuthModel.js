// Модель для работы с авторизацией через Telegram
const db = require('../db');
const TABLES = require('../config/tables');
const crypto = require('crypto');

/**
 * Проверяет существование таблицы Telegram авторизации
 * @returns {Promise<boolean>} true, если таблица существует
 */
async function checkTableExists() {
  try {
    // Проверяем существование таблицы
    const tables = await db.query(`
      SHOW TABLES LIKE '${TABLES.TELEGRAM_AUTH}'
    `);
    
    return tables.length > 0;
  } catch (err) {
    console.error('Ошибка при проверке таблицы Telegram авторизации:', err);
    return false;
  }
}

/**
 * Создает таблицу для Telegram авторизации, если она не существует
 * @returns {Promise<boolean>} true, если таблица создана успешно
 */
async function createTableIfNotExists() {
  try {
    // Создаем таблицу, если она не существует
    await db.query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.TELEGRAM_AUTH} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        telegram_id BIGINT NOT NULL,
        link_code VARCHAR(10) NULL,
        link_code_expires DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX idx_username (username),
        UNIQUE INDEX idx_telegram_id (telegram_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    console.log(`Таблица ${TABLES.TELEGRAM_AUTH} успешно создана или уже существует`);
    return true;
  } catch (err) {
    console.error('Ошибка при создании таблицы Telegram авторизации:', err);
    return false;
  }
}

/**
 * Получает информацию о привязке Telegram по имени пользователя
 * @param {string} username - Имя пользователя
 * @returns {Promise<Object|null>} Информация о привязке или null
 */
async function getTelegramLinkByUsername(username) {
  try {
    const result = await db.query(`
      SELECT * FROM ${TABLES.TELEGRAM_AUTH} 
      WHERE username = ?
    `, [username]);
    
    return result.length > 0 ? result[0] : null;
  } catch (err) {
    console.error(`Ошибка при получении привязки Telegram для пользователя '${username}':`, err);
    return null;
  }
}

/**
 * Получает информацию о привязке Telegram по Telegram ID
 * @param {number} telegramId - ID пользователя в Telegram
 * @returns {Promise<Object|null>} Информация о привязке или null
 */
async function getTelegramLinkByTelegramId(telegramId) {
  try {
    const result = await db.query(`
      SELECT * FROM ${TABLES.TELEGRAM_AUTH} 
      WHERE telegram_id = ?
    `, [telegramId]);
    
    return result.length > 0 ? result[0] : null;
  } catch (err) {
    console.error(`Ошибка при получении привязки Telegram для ID '${telegramId}':`, err);
    return null;
  }
}

/**
 * Генерирует код для привязки Telegram аккаунта
 * @param {string} username - Имя пользователя
 * @returns {Promise<Object>} Результат генерации кода
 */
async function generateLinkCode(username) {
  try {
    // Генерируем случайный код
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Устанавливаем срок действия (30 минут)
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 30);
    
    // Проверяем, есть ли уже запись для этого пользователя
    const existingLink = await getTelegramLinkByUsername(username);
    
    if (existingLink) {
      // Обновляем существующую запись
      await db.query(`
        UPDATE ${TABLES.TELEGRAM_AUTH} 
        SET link_code = ?, link_code_expires = ?
        WHERE username = ?
      `, [code, expires, username]);
    } else {
      // Создаем новую запись
      await db.query(`
        INSERT INTO ${TABLES.TELEGRAM_AUTH} 
        (username, telegram_id, link_code, link_code_expires)
        VALUES (?, 0, ?, ?)
      `, [username, code, expires]);
    }
    
    return { 
      success: true, 
      code,
      expires: expires.toISOString()
    };
  } catch (err) {
    console.error(`Ошибка при генерации кода привязки для пользователя '${username}':`, err);
    return { 
      success: false, 
      error: 'Не удалось сгенерировать код привязки'
    };
  }
}

/**
 * Привязывает Telegram аккаунт к пользователю по коду
 * @param {string} code - Код привязки
 * @param {number} telegramId - ID пользователя в Telegram
 * @returns {Promise<Object>} Результат привязки
 */
async function linkTelegramAccount(code, telegramId) {
  try {
    // Получаем запись по коду
    const result = await db.query(`
      SELECT * FROM ${TABLES.TELEGRAM_AUTH} 
      WHERE link_code = ? AND link_code_expires > NOW()
    `, [code]);
    
    if (result.length === 0) {
      return { 
        success: false, 
        error: 'Неверный или устаревший код привязки'
      };
    }
    
    const linkRecord = result[0];
    
    // Проверяем, не привязан ли уже этот Telegram ID к другому аккаунту
    const existingTgLink = await getTelegramLinkByTelegramId(telegramId);
    
    if (existingTgLink && existingTgLink.username !== linkRecord.username) {
      return { 
        success: false, 
        error: 'Этот Telegram аккаунт уже привязан к другому пользователю'
      };
    }
    
    // Обновляем запись с новым Telegram ID и сбрасываем код
    await db.query(`
      UPDATE ${TABLES.TELEGRAM_AUTH} 
      SET telegram_id = ?, link_code = NULL, link_code_expires = NULL
      WHERE link_code = ?
    `, [telegramId, code]);
    
    // Получаем информацию о пользователе
    const userAdapter = require('../auth/AuthManager').getActiveAdapter();
    const user = await userAdapter.getUserByUsername(linkRecord.username);
    
    return { 
      success: true, 
      user: user || { username: linkRecord.username, displayName: linkRecord.username }
    };
  } catch (err) {
    console.error(`Ошибка при привязке Telegram аккаунта для кода '${code}':`, err);
    return { 
      success: false, 
      error: 'Не удалось привязать Telegram аккаунт'
    };
  }
}

/**
 * Отвязывает Telegram аккаунт от пользователя
 * @param {string} username - Имя пользователя
 * @returns {Promise<Object>} Результат отвязки
 */
async function unlinkTelegramAccount(username) {
  try {
    // Получаем существующую запись
    const existingLink = await getTelegramLinkByUsername(username);
    
    if (!existingLink) {
      return { 
        success: false, 
        error: 'Telegram аккаунт не был привязан к этому пользователю'
      };
    }
    
    // Обновляем запись, сбрасывая Telegram ID
    await db.query(`
      UPDATE ${TABLES.TELEGRAM_AUTH} 
      SET telegram_id = 0, link_code = NULL, link_code_expires = NULL
      WHERE username = ?
    `, [username]);
    
    return { success: true };
  } catch (err) {
    console.error(`Ошибка при отвязке Telegram аккаунта для пользователя '${username}':`, err);
    return { 
      success: false, 
      error: 'Не удалось отвязать Telegram аккаунт'
    };
  }
}

/**
 * Привязывает Telegram аккаунт к пользователю напрямую (без кода)
 * @param {string} username - Имя пользователя
 * @param {number} telegramId - ID пользователя в Telegram
 * @returns {Promise<Object>} Результат привязки
 */
async function linkTelegramAccountDirect(username, telegramId) {
  try {
    // Проверяем, есть ли уже запись для этого пользователя
    const existingLink = await getTelegramLinkByUsername(username);
    
    if (existingLink) {
      // Обновляем существующую запись
      await db.query(`
        UPDATE ${TABLES.TELEGRAM_AUTH} 
        SET telegram_id = ?, link_code = NULL, link_code_expires = NULL
        WHERE username = ?
      `, [telegramId, username]);
    } else {
      // Создаем новую запись
      await db.query(`
        INSERT INTO ${TABLES.TELEGRAM_AUTH} 
        (username, telegram_id, link_code, link_code_expires)
        VALUES (?, ?, NULL, NULL)
      `, [username, telegramId]);
    }
    
    return { success: true };
  } catch (err) {
    console.error(`Ошибка при прямой привязке Telegram для пользователя '${username}':`, err);
    return { 
      success: false, 
      error: 'Не удалось привязать Telegram аккаунт'
    };
  }
}

// Создаем таблицу при инициализации модуля
createTableIfNotExists().catch(console.error);

module.exports = {
  checkTableExists,
  createTableIfNotExists,
  getTelegramLinkByUsername,
  getTelegramLinkByTelegramId,
  generateLinkCode,
  linkTelegramAccount,
  unlinkTelegramAccount,
  linkTelegramAccountDirect
}; 