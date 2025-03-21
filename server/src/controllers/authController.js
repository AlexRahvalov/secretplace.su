// Контроллер для работы с аутентификацией
const authManager = require('../auth/AuthManager');
const { verifyTelegramAuth } = require('../utils/telegramAuth');

/**
 * Аутентификация через Telegram
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
async function authTelegram(req, res) {
  try {
    const telegramData = req.body;
    
    // Проверяем данные от Telegram Login Widget
    const isValid = verifyTelegramAuth(telegramData);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Недействительные данные аутентификации Telegram' });
    }
    
    // Успешная аутентификация
    res.json({
      success: true,
      user: {
        id: telegramData.id,
        username: telegramData.username,
        firstName: telegramData.first_name,
        lastName: telegramData.last_name || '',
        photoUrl: telegramData.photo_url || '',
        authMethod: 'telegram'
      }
    });
  } catch (error) {
    console.error('Ошибка при аутентификации через Telegram:', error);
    res.status(500).json({ error: 'Ошибка аутентификации' });
  }
}

/**
 * Создание HTTP-only cookie для аутентификации
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 * @param {string} token - Токен пользователя
 * @param {number} expiresIn - Время жизни токена в секундах (по умолчанию 24 часа)
 */
function setAuthCookie(req, res, token, expiresIn = 86400) {
  // Установка HTTP-only cookie
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: expiresIn * 1000,
    sameSite: 'strict',
    path: '/'
  });
}

/**
 * Выход пользователя (удаление cookie)
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
function logout(req, res) {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Вы успешно вышли из системы' });
}

module.exports = {
  authTelegram,
  setAuthCookie,
  logout
}; 