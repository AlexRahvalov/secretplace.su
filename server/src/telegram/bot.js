const TelegramBot = require('node-telegram-bot-api');
const telegramAuthModel = require('../models/telegramAuthModel');
const authManager = require('../auth/AuthManager');

// Токен бота
const token = process.env.TELEGRAM_BOT_TOKEN;

// Создаем экземпляр бота
let bot = null;

/**
 * Инициализирует Telegram бота
 */
function initBot() {
  // Проверяем наличие токена
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN не указан в переменных окружения');
    return false;
  }

  try {
    // Создаем бота с опцией polling
    bot = new TelegramBot(token, { polling: true });
    
    console.log('Telegram бот успешно запущен');
    
    // Настраиваем обработчики сообщений
    setupMessageHandlers();
    
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации Telegram бота:', error);
    return false;
  }
}

/**
 * Настраивает обработчики сообщений
 */
function setupMessageHandlers() {
  // Обработка команды /start
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, 
      'Привет! Я бот для авторизации на сервере SecretPlace.su.\n\n' +
      'Используйте /login для входа на сайт\n' +
      'Используйте /bind <код> для привязки аккаунта'
    );
  });
  
  // Обработка команды /login
  bot.onText(/\/login/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    
    try {
      // Получаем адаптер для Telegram авторизации
      const telegramAdapter = authManager.getAdapterByName('TelegramAuth');
      
      if (!telegramAdapter) {
        return bot.sendMessage(chatId, 'Авторизация через Telegram в данный момент недоступна');
      }
      
      // Пытаемся авторизоваться по Telegram ID
      const user = await telegramAdapter.authenticateByTelegramId(telegramId);
      
      if (user) {
        bot.sendMessage(chatId, 
          `✅ Успешный вход!\n\nИмя: ${user.displayName}\nЛогин: ${user.username}\n\n` +
          'Теперь вы можете использовать сайт.'
        );
      } else {
        bot.sendMessage(chatId, 
          'Ваш Telegram аккаунт не привязан к учетной записи на сайте.\n\n' +
          'Чтобы привязать аккаунт, выполните следующие шаги:\n' +
          '1. Войдите на сайт с помощью логина и пароля\n' +
          '2. Нажмите на кнопку "Привязать Telegram"\n' +
          '3. Введите полученный код здесь с помощью команды /bind <код>'
        );
      }
    } catch (error) {
      console.error('Ошибка при авторизации через Telegram:', error);
      bot.sendMessage(chatId, 'Произошла ошибка при авторизации. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработка команды /bind <код>
  bot.onText(/\/bind (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const code = match[1].trim();
    
    try {
      // Проверяем код и привязываем Telegram
      const result = await telegramAuthModel.linkTelegramAccount(code, telegramId);
      
      if (result.success) {
        bot.sendMessage(chatId, 
          `✅ Аккаунт успешно привязан!\n\nИмя: ${result.user.displayName}\nЛогин: ${result.user.username}\n\n` +
          'Теперь вы можете использовать команду /login для входа.'
        );
      } else {
        bot.sendMessage(chatId, 
          '❌ Неверный или устаревший код привязки.\n\n' +
          'Пожалуйста, убедитесь, что вы ввели правильный код, или получите новый на сайте.'
        );
      }
    } catch (error) {
      console.error('Ошибка при привязке Telegram аккаунта:', error);
      bot.sendMessage(chatId, 'Произошла ошибка при привязке аккаунта. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработка всех остальных сообщений
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    
    // Игнорируем команды, которые уже обработаны
    if (msg.text && (
      msg.text.startsWith('/start') || 
      msg.text.startsWith('/login') || 
      msg.text.startsWith('/bind')
    )) {
      return;
    }
    
    // Отправляем справку по командам
    bot.sendMessage(chatId, 
      'Доступные команды:\n\n' +
      '/start - Начать работу с ботом\n' +
      '/login - Войти на сайт через Telegram\n' +
      '/bind <код> - Привязать Telegram к аккаунту на сайте'
    );
  });
}

/**
 * Отправляет сообщение указанному пользователю
 * @param {number} chatId - ID чата пользователя
 * @param {string} message - Текст сообщения
 * @returns {Promise<Message>} Отправленное сообщение
 */
async function sendMessage(chatId, message) {
  if (!bot) {
    console.error('Telegram бот не инициализирован');
    return null;
  }
  
  try {
    return await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Ошибка при отправке сообщения в Telegram:', error);
    return null;
  }
}

/**
 * Генерирует и отправляет QR-код для авторизации
 * @param {number} telegramId - ID пользователя в Telegram
 * @returns {Promise<string>} URL QR-кода или null в случае ошибки
 */
async function generateAuthQrCode(telegramId) {
  if (!bot) {
    console.error('Telegram бот не инициализирован');
    return null;
  }
  
  try {
    // Здесь можно добавить логику для генерации QR-кода
    // с данными для авторизации
    return `tg://resolve?domain=${bot.botInfo.username}&start=auth_${telegramId}`;
  } catch (error) {
    console.error('Ошибка при генерации QR-кода для Telegram:', error);
    return null;
  }
}

module.exports = {
  initBot,
  sendMessage,
  generateAuthQrCode
}; 