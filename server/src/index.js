// index.js - Точка входа для сервера
require('dotenv').config();

// Импортируем необходимые модули
const http = require('http');
const db = require('./db');
const authManager = require('./auth/AuthManager');
const configModel = require('./models/configModel');
const telegramBot = require('./telegram/bot');
const app = require('./server');

// Порт сервера
const PORT = process.env.PORT || 3001;

// Запуск сервера
async function startServer() {
  try {
    // Инициализируем базу данных
    const dbInitialized = await db.initDatabase();
    
    if (!dbInitialized) {
      console.error('❌ Не удалось инициализировать базу данных. Сервер не будет запущен.');
      process.exit(1);
    }
    
    // Инициализируем менеджер авторизации
    console.log('Инициализация системы авторизации...');
    const authInitialized = await authManager.init();
    
    if (!authInitialized) {
      console.error('❌ Не удалось инициализировать систему авторизации. Сервер не будет запущен.');
      process.exit(1);
    }
    
    // Инициализируем бота Telegram, если включена соответствующая настройка
    const telegramEnabled = (await configModel.getConfigByName('auth_enable_telegram')) === 'true';
    if (telegramEnabled) {
      telegramBot.initBot();
    }
    
    // Создаем HTTP сервер
    const server = http.createServer(app);

    // Запускаем сервер
    server.listen(PORT, () => {
      console.log(`✅ Сервер запущен на порту ${PORT}`);
      console.log(`📚 API доступно по адресу: http://localhost:${PORT}/api`);
      console.log(`🔐 Активный адаптер авторизации: ${authManager.getActiveAdapterName()}`);
    });
    
    // Обрабатываем ошибки сервера
    server.on('error', (error) => {
      console.error('❌ Ошибка запуска сервера:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Критическая ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

// Запускаем сервер
startServer(); 