// Утилиты для проверки данных аутентификации Telegram
const crypto = require('crypto');

/**
 * Проверяет данные аутентификации Telegram Login Widget
 * @param {Object} telegramData - данные от Telegram Login Widget
 * @returns {boolean} - результат проверки
 */
function verifyTelegramAuth(telegramData) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN не найден в переменных окружения');
      return false;
    }

    // Убеждаемся, что хеш присутствует
    if (!telegramData || !telegramData.hash) {
      return false;
    }

    // Создаем строку для проверки, отсортировав все поля в алфавитном порядке
    const allowedFields = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date'];
    const checkString = Object.keys(telegramData)
      .filter(key => key !== 'hash' && allowedFields.includes(key))
      .sort()
      .map(key => `${key}=${telegramData[key]}`)
      .join('\n');

    // Вычисляем секретный ключ (SHA256 от токена бота)
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    
    // Вычисляем HMAC-SHA256 хеш от строки проверки
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    // Проверяем хеш
    const isValid = calculatedHash === telegramData.hash;
    
    // Проверяем, не устарела ли авторизация (не более 24 часов)
    const authTime = parseInt(telegramData.auth_date);
    const currentTime = Math.floor(Date.now() / 1000);
    const isNotExpired = (currentTime - authTime) < 86400; // 24 часа
    
    return isValid && isNotExpired;
  } catch (error) {
    console.error('Ошибка при проверке аутентификации Telegram:', error);
    return false;
  }
}

/**
 * Функция для хеширования данных и проверки подписи от Telegram Widget
 * @param {Object} data - данные для проверки
 * @returns {boolean} - результат проверки
 */
function verifyTelegramHash(data) {
  if (!data || !data.hash) {
    return false;
  }
  
  // Получаем секретный ключ бота
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('Отсутствует токен Telegram бота в переменных окружения');
    return false;
  }
  
  // Создаем секретный ключ
  const secretKey = crypto.createHash('sha256')
    .update(botToken)
    .digest();
  
  // Собираем проверочную строку, сортируя поля
  const dataCheckArr = Object.keys(data)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${data[key]}`);
    
  const dataCheckString = dataCheckArr.join('\n');
  
  // Вычисляем хеш с помощью HMAC-SHA-256
  const computedHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  // Сравниваем хеши
  return data.hash === computedHash;
}

module.exports = {
  verifyTelegramAuth,
  verifyTelegramHash
}; 