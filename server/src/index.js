// index.js - Точка входа для сервера
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Порт сервера
const PORT = process.env.PORT || 3001;

// Базовый путь к данным
const DATA_DIR = path.join(__dirname, 'data');

// Маршрутизация для API
const router = {
  // Получить версию приложения
  '/api/version': (req, res) => {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
      );
      
      sendJson(res, { version: packageJson.version });
    } catch (error) {
      sendError(res, 'Не удалось получить версию', 500);
    }
  },
  
  // Получить URL репозитория
  '/api/repository': (req, res) => {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
      );
      
      const repoUrl = packageJson.repository && packageJson.repository.url 
        ? packageJson.repository.url 
        : 'https://github.com';
      
      sendJson(res, { url: repoUrl });
    } catch (error) {
      sendError(res, 'Не удалось получить URL репозитория', 500);
    }
  },
  
  // Получить статус сервера
  '/api/server/status': (req, res) => {
    // В реальном приложении здесь был бы запрос к Minecraft серверу
    // Для демонстрации используем случайные данные
    const status = {
      onlinePlayers: Math.floor(Math.random() * 30),
      tps: (20 - Math.random()).toFixed(1),
      uptime: '99.8%'
    };
    
    sendJson(res, status);
  },
  
  // Получить последние новости
  '/api/news/latest': (req, res) => {
    try {
      const newsDir = path.join(DATA_DIR, 'news');
      
      // Создаем директорию для новостей, если ее нет
      if (!fs.existsSync(newsDir)) {
        fs.mkdirSync(newsDir, { recursive: true });
        
        // Создаем демо-новости
        const demoNews = [
          {
            id: '1',
            title: 'Открытие сервера',
            date: new Date().toISOString(),
            author: 'Администратор',
            excerpt: 'Мы рады сообщить об официальном открытии нашего сервера!'
          },
          {
            id: '2',
            title: 'Новые возможности',
            date: new Date(Date.now() - 86400000).toISOString(), // вчера
            author: 'Администратор',
            excerpt: 'Мы добавили множество новых возможностей и улучшений.'
          }
        ];
        
        demoNews.forEach(news => {
          fs.writeFileSync(
            path.join(newsDir, `${news.id}.json`),
            JSON.stringify(news, null, 2)
          );
        });
      }
      
      // Читаем все новости
      const newsFiles = fs.readdirSync(newsDir);
      const news = newsFiles
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const content = fs.readFileSync(path.join(newsDir, file), 'utf-8');
          return JSON.parse(content);
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Сортируем по дате (новые сначала)
      
      sendJson(res, news);
    } catch (error) {
      sendError(res, 'Не удалось получить новости', 500);
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

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
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
  if (router[pathname]) {
    router[pathname](req, res);
  } else {
    sendError(res, 'Маршрут не найден', 404);
  }
});

// Запускаем сервер
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  
  // Создаем директорию для данных, если ее нет
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}); 