// Маршруты API
const express = require('express');
const path = require('path');
const fs = require('fs');

// Импортируем контроллеры
const newsController = require('../controllers/newsController');
const configController = require('../controllers/configController');
const serverController = require('../controllers/serverController');
const authController = require('../controllers/authController');

const router = express.Router();

// Маршруты для версии приложения
router.get('/version', async (req, res) => {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', '..', '..', 'package.json'), 'utf-8')
    );
    
    res.json({ version: packageJson.version });
  } catch (error) {
    console.error('Ошибка при чтении package.json:', error);
    res.status(500).json({ error: 'Не удалось получить версию' });
  }
});

// Маршруты для сервера
router.get('/server/info', serverController.getServerInfo);
router.get('/server/history/:period', serverController.getServerHistory);
router.get('/server/status', serverController.getServerStatus);

// Маршруты для новостей
router.get('/news', newsController.getAllNews);
router.get('/news/latest/:limit?', newsController.getLatestNews);
router.get('/news/:id', newsController.getNewsById);

// Маршруты для конфигурации
router.get('/config', configController.getConfig);
router.get('/config/:name', configController.getConfigByName);

// Маршруты для аутентификации
router.post('/auth/telegram', authController.authTelegram);
router.post('/auth/logout', authController.logout);

module.exports = router; 