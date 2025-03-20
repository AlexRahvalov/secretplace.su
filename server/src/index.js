// index.js - Точка входа для сервера
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// Загружаем переменные окружения из файла .env
require('dotenv').config();

// Импортируем модуль для работы с базой данных
const db = require('./db');

// Импортируем модели
const newsModel = require('./models/newsModel');
const configModel = require('./models/configModel');

// Импортируем менеджер авторизации
const authManager = require('./auth/AuthManager');

// Импортируем модуль Telegram бота
const telegramBot = require('./telegram/bot');

// Порт сервера
const PORT = process.env.PORT || 3001;

// Функция для хеширования данных и проверки подписи от Telegram Widget
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

// Функция для проверки данных аутентификации Telegram Login Widget
const verifyTelegramAuth = (telegramData) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN не найден в переменных окружения');
      return false;
    }

    // Создаем строку для проверки, отсортировав все поля в алфавитном порядке
    const allowedFields = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date'];
    const checkString = Object.keys(telegramData)
      .filter(key => allowedFields.includes(key))
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
};

// Маршрутизация для API
const router = {
  // Получить версию приложения
  '/api/version': async (req, res) => {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8')
      );
      
      sendJson(res, { version: packageJson.version });
    } catch (error) {
      console.error('Ошибка при чтении package.json:', error);
      sendError(res, 'Не удалось получить версию', 500);
    }
  },
  
  // Специальный файл для подтверждения домена в Telegram
  '/.well-known/telegram-domain-verification.html': async (req, res) => {
    try {
      // Получаем имя бота из переменных окружения
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || '';
      
      // HTML содержимое файла верификации
      const content = `
        <html>
          <head>
            <title>Telegram Domain Verification</title>
            <meta name="telegram:domain-verification" content="telegram-domain-verification">
          </head>
          <body>
            Telegram verification page
          </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.statusCode = 200;
      res.end(content);
    } catch (error) {
      console.error('Ошибка при обработке запроса верификации Telegram домена:', error);
      sendError(res, 'Ошибка при верификации домена', 500);
    }
  },
  
  // Получить URL репозитория
  '/api/repository': async (req, res) => {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
      );
      
      const repoUrl = packageJson.repository && packageJson.repository.url 
        ? packageJson.repository.url 
        : 'https://github.com';
      
      sendJson(res, { url: repoUrl });
    } catch (error) {
      console.error('Ошибка при получении URL репозитория:', error);
      sendError(res, 'Не удалось получить URL репозитория', 500);
    }
  },
  
  // Получить статус сервера
  '/api/server/status': async (req, res) => {
    try {
    // В реальном приложении здесь был бы запрос к Minecraft серверу
    // Для демонстрации используем случайные данные
    const status = {
        online: true,
      onlinePlayers: Math.floor(Math.random() * 30),
        maxPlayers: 100,
      tps: (20 - Math.random()).toFixed(1),
        uptime: '99.8%',
        version: '1.20.1'
    };
    
    sendJson(res, status);
    } catch (error) {
      console.error('Ошибка при получении статуса сервера:', error);
      sendError(res, 'Не удалось получить статус сервера', 500);
    }
  },
  
  // Получить последние новости
  '/api/news/latest': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const limit = parsedUrl.query.limit ? parseInt(parsedUrl.query.limit) : 5;
      
      const news = await newsModel.getLatestNews(limit);
      sendJson(res, news);
    } catch (error) {
      console.error('Ошибка при получении последних новостей:', error);
      sendError(res, 'Не удалось получить новости', 500);
    }
  },
  
  // Получить все новости
  '/api/news': async (req, res) => {
    try {
      const news = await newsModel.getAllNews();
      sendJson(res, news);
    } catch (error) {
      console.error('Ошибка при получении всех новостей:', error);
      sendError(res, 'Не удалось получить новости', 500);
    }
  },
  
  // Получить новость по ID
  '/api/news/byId': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const id = parsedUrl.query.id;
      
      if (!id) {
        return sendError(res, 'Не указан ID новости', 400);
      }
      
      const news = await newsModel.getNewsById(id);
      
      if (!news) {
        return sendError(res, 'Новость не найдена', 404);
      }
      
      sendJson(res, news);
    } catch (error) {
      console.error('Ошибка при получении новости по ID:', error);
      sendError(res, 'Не удалось получить новость', 500);
    }
  },
  
  // Получить конфигурацию сайта
  '/api/config': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const name = parsedUrl.query.name;
      
      if (name) {
        // Если указано имя параметра, возвращаем его значение
        const value = await configModel.getConfigByName(name);
        
        if (value === null) {
          return sendError(res, `Параметр '${name}' не найден`, 404);
        }
        
        sendJson(res, { name, value });
      } else {
        // Если имя не указано, возвращаем все параметры
        const config = await configModel.getAllConfig();
        sendJson(res, config);
      }
    } catch (error) {
      console.error('Ошибка при получении конфигурации:', error);
      sendError(res, 'Не удалось получить конфигурацию', 500);
    }
  },
  
  // Получить несколько параметров конфигурации
  '/api/config/multiple': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const namesParam = parsedUrl.query.names;
      
      if (!namesParam) {
        return sendError(res, 'Не указаны имена параметров', 400);
      }
      
      // Разбиваем строку имен в массив
      const names = namesParam.split(',').map(name => name.trim());
      
      if (names.length === 0) {
        return sendError(res, 'Пустой список имен параметров', 400);
      }
      
      const config = await configModel.getConfigByNames(names);
      sendJson(res, config);
    } catch (error) {
      console.error('Ошибка при получении множественной конфигурации:', error);
      sendError(res, 'Не удалось получить конфигурацию', 500);
    }
  },
  
  // Установить параметр конфигурации
  '/api/config/set': async (req, res) => {
    try {
      // Проверяем, что это POST запрос
      if (req.method !== 'POST') {
        return sendError(res, 'Метод не поддерживается', 405);
      }
      
      // Получаем данные из запроса
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          // Парсим JSON
          const { name, value, description } = JSON.parse(body);
          
          // Проверяем наличие обязательных полей
          if (!name || value === undefined) {
            return sendError(res, 'Не указано имя или значение параметра', 400);
          }
          
          // Устанавливаем параметр конфигурации
          const result = await configModel.setConfig(name, value, description);
          
          // Отправляем результат
          sendJson(res, result);
        } catch (error) {
          console.error('Ошибка обработки данных установки параметра:', error);
          sendError(res, 'Ошибка обработки данных', 400);
        }
      });
    } catch (error) {
      console.error('Ошибка при установке параметра конфигурации:', error);
      sendError(res, 'Ошибка при установке параметра', 500);
    }
  },
  
  // Получить информацию о системе авторизации
  '/api/auth/info': async (req, res) => {
    try {
      // Получаем настройку для включения Telegram авторизации
      const telegramEnabled = (await configModel.getConfigByName('auth_enable_telegram')) === 'true';
      
      const authInfo = {
        activeAdapter: authManager.getActiveAdapterName(),
        availableAdapters: authManager.getAvailableAdapters(),
        telegramEnabled: telegramEnabled
      };
      sendJson(res, authInfo);
    } catch (error) {
      console.error('Ошибка при получении информации об авторизации:', error);
      sendError(res, 'Не удалось получить информацию о системе авторизации', 500);
    }
  },
  
  // Авторизация пользователя
  '/api/auth/login': async (req, res) => {
    try {
      // Проверяем, что это POST запрос
      if (req.method !== 'POST') {
        return sendError(res, 'Метод не поддерживается', 405);
      }
      
      // Получаем данные из запроса
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          // Парсим JSON
          const { username, password } = JSON.parse(body);
          
          // Проверяем наличие обязательных полей
          if (!username || !password) {
            return sendError(res, 'Не указано имя пользователя или пароль', 400);
          }
          
          // Проверяем учетные данные через менеджер авторизации
          const user = await authManager.authenticateUser(username, password);
          
          if (!user) {
            return sendError(res, 'Неверное имя пользователя или пароль', 401);
          }
          
          // Отправляем данные пользователя
          sendJson(res, user);
        } catch (error) {
          console.error('Ошибка обработки данных авторизации:', error);
          sendError(res, 'Ошибка обработки данных', 400);
        }
      });
    } catch (error) {
      console.error('Ошибка при авторизации:', error);
      sendError(res, 'Ошибка авторизации', 500);
    }
  },
  
  // Получить данные пользователя по UUID
  '/api/user': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const uuid = parsedUrl.query.uuid;
      
      if (!uuid) {
        return sendError(res, 'Не указан UUID пользователя', 400);
      }
      
      // Получаем пользователя через менеджер авторизации
      const user = await authManager.getUserByUuid(uuid);
      
      if (!user) {
        return sendError(res, 'Пользователь не найден', 404);
      }
      
      sendJson(res, user);
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
      sendError(res, 'Не удалось получить данные пользователя', 500);
    }
  },
  
  // Служебный эндпоинт для отладки - получение информации о пользователе из базы данных
  // ВАЖНО: только для диагностики, не использовать в продакшене!
  '/api/debug/user': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const username = parsedUrl.query.username;
      
      if (!username) {
        return sendError(res, 'Не указано имя пользователя', 400);
      }
      
      // Получаем данные пользователя из базы
      let users = [];
      try {
        // Пробуем сначала искать в EasyAuth
        users = await db.query(`
          SELECT id, uuid, username, data 
          FROM easyauth 
          WHERE username_lower = ?
        `, [username.toLowerCase()]);
      } catch (err) {
        console.error('Ошибка при поиске в easyauth:', err);
      }
      
      if (users.length === 0) {
        try {
          // Если не нашли, пробуем искать в AuthMe
          users = await db.query(`
            SELECT id, username, password 
            FROM authme 
            WHERE username = ?
          `, [username.toLowerCase()]);
        } catch (err) {
          console.error('Ошибка при поиске в authme:', err);
        }
      }
      
      if (users.length === 0) {
        return sendError(res, 'Пользователь не найден в базе данных', 404);
      }
      
      // Возвращаем основную информацию без паролей для безопасности
      const user = users[0];
      const result = {
        found: true,
        username: user.username,
        id: user.id,
        uuid: user.uuid || null,
        source: user.data ? 'easyauth' : 'authme'
      };
      
      sendJson(res, result);
    } catch (error) {
      console.error('Ошибка при отладке информации о пользователе:', error);
      sendError(res, 'Ошибка при получении отладочной информации', 500);
    }
  },
  
  // Генерировать код для привязки Telegram
  '/api/auth/telegram/generate-code': async (req, res) => {
    try {
      // Проверяем, что это POST запрос
      if (req.method !== 'POST') {
        return sendError(res, 'Метод не поддерживается', 405);
      }
      
      // Проверяем, включена ли авторизация через Telegram
      const telegramEnabled = (await configModel.getConfigByName('auth_enable_telegram')) === 'true';
      
      if (!telegramEnabled) {
        return sendError(res, 'Авторизация через Telegram отключена', 400);
      }
      
      // Получаем данные из запроса
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          // Парсим JSON
          const { username, password } = JSON.parse(body);
          
          // Проверяем наличие обязательных полей
          if (!username || !password) {
            return sendError(res, 'Не указано имя пользователя или пароль', 400);
          }
          
          // Пытаемся авторизоваться
          const adapter = authManager.getActiveAdapter();
          const user = await adapter.authenticateUser(username, password);
          
          if (!user) {
            return sendError(res, 'Неверное имя пользователя или пароль', 401);
          }
          
          // Получаем адаптер для Telegram авторизации
          const telegramAdapter = authManager.getAdapterByName('TelegramAuth');
          
          if (!telegramAdapter) {
            return sendError(res, 'Авторизация через Telegram недоступна', 500);
          }
          
          // Генерируем код привязки
          const result = await telegramAdapter.generateLinkCode(username);
          
          // Отправляем результат
          if (result.success) {
            sendJson(res, { success: true, code: result.code });
          } else {
            sendError(res, result.error || 'Не удалось сгенерировать код привязки', 500);
          }
        } catch (error) {
          console.error('Ошибка обработки данных для генерации кода привязки:', error);
          sendError(res, 'Ошибка обработки данных', 400);
        }
      });
    } catch (error) {
      console.error('Ошибка при генерации кода привязки Telegram:', error);
      sendError(res, 'Ошибка при генерации кода привязки', 500);
    }
  },
  
  // Проверка кода для привязки Telegram
  '/api/auth/telegram/link': async (req, res) => {
    try {
      // Проверяем, что это POST запрос
      if (req.method !== 'POST') {
        return sendError(res, 'Метод не поддерживается', 405);
      }
      
      // Получаем данные из запроса
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          // Парсим JSON
          const { code, telegramId } = JSON.parse(body);
          
          // Проверяем наличие обязательных полей
          if (!code || !telegramId) {
            return sendError(res, 'Не указан код или Telegram ID', 400);
          }
          
          // Получаем модель для работы с Telegram
          const telegramAuthModel = require('./models/telegramAuthModel');
          
          // Используем код
          const result = await telegramAuthModel.useCode(code, telegramId);
          
          if (!result.success) {
            return sendError(res, result.message, 400);
          }
          
          // Отправляем результат успешной привязки
          sendJson(res, {
            success: true,
            username: result.username,
            telegramId: result.telegramId,
            linkedAt: result.linkedAt
          });
        } catch (error) {
          console.error('Ошибка обработки данных привязки Telegram:', error);
          sendError(res, 'Ошибка обработки данных', 400);
        }
      });
    } catch (error) {
      console.error('Ошибка при привязке Telegram:', error);
      sendError(res, 'Ошибка при привязке Telegram', 500);
    }
  },
  
  // Авторизация через Telegram ID
  '/api/auth/telegram/login': async (req, res) => {
    try {
      // Проверяем, что это POST запрос
      if (req.method !== 'POST') {
        return sendError(res, 'Метод не поддерживается', 405);
      }
      
      // Получаем данные из запроса
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          // Парсим JSON
          const { telegramId } = JSON.parse(body);
          
          // Проверяем наличие обязательных полей
          if (!telegramId) {
            return sendError(res, 'Не указан Telegram ID', 400);
          }
          
          // Ищем адаптер для Telegram
          const telegramAdapter = authManager.getAdapterByName('TelegramAuth');
          
          if (!telegramAdapter) {
            return sendError(res, 'Авторизация через Telegram не поддерживается', 404);
          }
          
          // Авторизуем пользователя по Telegram ID
          const user = await telegramAdapter.authenticateByTelegramId(telegramId);
          
          if (!user) {
            return sendError(res, 'Аккаунт с данным Telegram ID не найден', 404);
          }
          
          // Отправляем данные пользователя
          sendJson(res, user);
        } catch (error) {
          console.error('Ошибка обработки данных авторизации через Telegram:', error);
          sendError(res, 'Ошибка обработки данных', 400);
        }
      });
    } catch (error) {
      console.error('Ошибка при авторизации через Telegram:', error);
      sendError(res, 'Ошибка авторизации через Telegram', 500);
    }
  },
  
  // Проверка статуса привязки Telegram
  '/api/auth/telegram/status': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const username = parsedUrl.query.username;
      
      if (!username) {
        return sendError(res, 'Не указано имя пользователя', 400);
      }
      
      // Получаем модель для работы с Telegram
      const telegramAuthModel = require('./models/telegramAuthModel');
      
      // Проверяем статус привязки
      const isLinked = await telegramAuthModel.isTelegramLinked(username);
      
      // Если аккаунт привязан, получаем подробную информацию
      if (isLinked) {
        const linkInfo = await telegramAuthModel.getTelegramLinkByUsername(username);
        
        sendJson(res, {
          linked: true,
          username: linkInfo.username,
          telegramId: linkInfo.telegram_id,
          linkedAt: linkInfo.linked_at
        });
      } else {
        sendJson(res, {
          linked: false,
          username
        });
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса привязки Telegram:', error);
      sendError(res, 'Ошибка при проверке статуса привязки', 500);
    }
  },
  
  // Получить информацию о Telegram боте
  '/api/auth/telegram/info': async (req, res) => {
    try {
      // Проверяем, включена ли авторизация через Telegram
      const telegramEnabled = (await configModel.getConfigByName('auth_enable_telegram')) === 'true';
      
      if (!telegramEnabled) {
        return sendJson(res, { success: false, error: 'Авторизация через Telegram отключена' });
      }
      
      // Получаем имя пользователя бота
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'your_bot_username';
      
      sendJson(res, { 
        success: true, 
        botUsername: botUsername,
        telegramEnabled: telegramEnabled
      });
    } catch (error) {
      console.error('Ошибка при получении информации о Telegram боте:', error);
      sendError(res, 'Не удалось получить информацию о Telegram боте', 500);
    }
  },
  
  // Авторизация через Telegram Login Widget
  '/api/auth/telegram/widget-login': async (req, res) => {
    try {
      const telegramData = req.body;
      console.log('Получены данные Telegram Login Widget:', telegramData);

      if (!telegramData || !telegramData.id || !telegramData.hash) {
        return res.status(400).json({ success: false, message: 'Неверные данные аутентификации Telegram' });
      }

      // Проверяем подлинность данных
      const isValid = verifyTelegramAuth(telegramData);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Недействительные данные аутентификации Telegram' });
      }

      // Проверяем, есть ли пользователь с таким Telegram ID в базе данных
      const telegramId = telegramData.id.toString();
      const authManager = new AuthManager(db);
      const telegramAdapter = authManager.getAdapterByName('TelegramAuth');
      
      if (!telegramAdapter) {
        return res.status(500).json({ success: false, message: 'Адаптер Telegram не найден' });
      }

      // Пытаемся аутентифицировать пользователя по Telegram ID
      const userData = await telegramAdapter.authenticateByTelegramId(telegramId);
      
      if (userData && userData.success) {
        // Пользователь найден, создаем сессию
        const sessionId = generateSessionId();
        const sessionExpiration = new Date();
        sessionExpiration.setDate(sessionExpiration.getDate() + 7); // Сессия на 7 дней
        
        const session = {
          id: sessionId,
          userId: userData.user.id,
          uuid: userData.user.uuid,
          username: userData.user.username,
          expiration: sessionExpiration,
          adapter: 'TelegramAuth'
        };
        
        sessions[sessionId] = session;
        
        return res.json({
          success: true,
          message: 'Успешная аутентификация через Telegram',
          session: { 
            id: sessionId,
            username: userData.user.username,
            expiration: sessionExpiration.toISOString()
          },
          user: {
            uuid: userData.user.uuid,
            username: userData.user.username,
            isOperator: userData.user.isOperator || false
          }
        });
      } else {
        // Пользователь не привязан, возвращаем данные для регистрации/привязки
        return res.json({
          success: false,
          message: 'Аккаунт Telegram не привязан к учетной записи',
          telegramData: {
            id: telegramData.id,
            username: telegramData.username,
            first_name: telegramData.first_name,
            last_name: telegramData.last_name
          }
        });
      }
    } catch (error) {
      console.error('Ошибка при авторизации через Telegram Widget:', error);
      res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  },
  
  // Привязка аккаунта через Telegram Login Widget
  '/api/auth/telegram/bind-widget': async (req, res) => {
    try {
      // Проверяем, что это POST запрос
      if (req.method !== 'POST') {
        return sendError(res, 'Метод не поддерживается', 405);
      }
      
      // Получаем данные из запроса
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          // Парсим JSON
          const { telegramData, username, password } = JSON.parse(body);
          
          // Проверяем наличие обязательных полей
          if (!telegramData || !telegramData.id || !username || !password) {
            return sendError(res, 'Не указаны обязательные параметры', 400);
          }
          
          // Проверяем учетные данные
          const user = await authManager.authenticateUser(username, password);
          
          if (!user) {
            return sendError(res, 'Неверное имя пользователя или пароль', 401);
          }
          
          // Получаем модель для работы с Telegram
          const telegramAuthModel = require('./models/telegramAuthModel');
          
          // Проверяем, не привязан ли уже этот Telegram ID к другому аккаунту
          const existingTgLink = await telegramAuthModel.getTelegramLinkByTelegramId(telegramData.id);
          
          if (existingTgLink && existingTgLink.username !== username) {
            return sendError(res, 'Этот Telegram аккаунт уже привязан к другому пользователю', 400);
          }
          
          // Привязываем Telegram ID к аккаунту напрямую
          const result = await telegramAuthModel.linkTelegramAccountDirect(username, telegramData.id);
          
          if (!result.success) {
            return sendError(res, result.error, 500);
          }
          
          // Отправляем результат успешной привязки
          sendJson(res, {
            success: true,
            username: username,
            telegramId: telegramData.id,
            userData: {
              ...user,
              telegramId: telegramData.id,
              authType: 'telegram'
            }
          });
        } catch (error) {
          console.error('Ошибка обработки данных привязки Telegram:', error);
          sendError(res, 'Ошибка обработки данных', 400);
        }
      });
    } catch (error) {
      console.error('Ошибка при привязке Telegram:', error);
      sendError(res, 'Ошибка при привязке Telegram', 500);
    }
  }
};

// Функция для отправки JSON
function sendJson(res, data) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify(data));
}

// Функция для отправки ошибок
function sendError(res, message, statusCode = 400) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(JSON.stringify({ error: message }));
}

// Добавляем CORS заголовки
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 часа
}

// Обработчик запросов
async function handleRequest(req, res) {
  // Добавляем CORS заголовки
  setCorsHeaders(res);
  
  // Обрабатываем preflight запросы
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // Парсим URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Проверяем, существует ли обработчик для данного пути
  let handler = router[pathname];
  
  // Проверяем обработчик для URL с параметрами
  if (!handler) {
    if (pathname.startsWith('/api/news/byId')) {
      handler = router['/api/news/byId'];
    } else if (pathname.startsWith('/api/user')) {
      handler = router['/api/user'];
    }
  }
  
  if (handler) {
    await handler(req, res);
  } else {
    sendError(res, 'Маршрут не найден', 404);
  }
}

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
    const server = http.createServer(handleRequest);

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