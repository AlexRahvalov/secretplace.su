// Модуль для шифрования паролей с использованием Argon2
const argon2 = require('argon2');

/**
 * Хеширует пароль с использованием алгоритма Argon2
 * @param {string} password - Пароль, который нужно захешировать
 * @returns {Promise<string>} Хешированный пароль
 */
async function hashPassword(password) {
  try {
    // Используем стандартные настройки Argon2i для совместимости с EasyAuth
    const hash = await argon2.hash(password, {
      type: argon2.argon2i,
      memoryCost: 65536, // 64MB в килобайтах
      timeCost: 10,      // Количество итераций
      parallelism: 1     // Количество потоков
    });
    
    return hash;
  } catch (error) {
    console.error('Ошибка при хешировании пароля:', error);
    throw new Error('Не удалось захешировать пароль');
  }
}

/**
 * Проверяет, соответствует ли пароль хешу
 * @param {string} hash - Хеш, с которым сравнивается пароль
 * @param {string} password - Пароль для проверки
 * @returns {Promise<boolean>} Результат проверки
 */
async function verifyPassword(hash, password) {
  try {
    // Очищаем хеш от экранирования для совместимости с EasyAuth
    let cleanHash = hash;
    
    // Удаляем экранирование Unicode
    if (cleanHash.includes('\\u003d')) {
      cleanHash = cleanHash.replace(/\\u003d/g, '=');
    }
    
    // Удаляем двойное экранирование обратных слешей
    if (cleanHash.includes('\\\\')) {
      cleanHash = cleanHash.replace(/\\\\/g, '\\');
    }
    
    // Решение проблемы с формата Argon для Java-версии EasyAuth
    if (!cleanHash.startsWith('$argon2')) {
      cleanHash = cleanHash.replace('argon2i$v', '$argon2i$v');
    }
    
    console.log('Проверка пароля с хешем:', cleanHash);
    
    return await argon2.verify(cleanHash, password);
  } catch (error) {
    console.error('Ошибка при проверке пароля:', error, 'Хеш:', hash);
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword
}; 