// Маршруты для веб-страниц
const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Специальный файл для подтверждения домена в Telegram
router.get('/.well-known/telegram-domain-verification.html', async (req, res) => {
  try {
    // Получаем токен верификации из переменных окружения
    const verificationToken = process.env.TELEGRAM_DOMAIN_VERIFICATION_TOKEN || '';
    
    if (!verificationToken) {
      console.warn('TELEGRAM_DOMAIN_VERIFICATION_TOKEN не найден в переменных окружения');
    }
    
    // HTML содержимое файла верификации
    const content = `
      <html>
        <head>
          <title>Telegram Domain Verification</title>
          <meta name="telegram:domain-verification" content="${verificationToken}">
        </head>
        <body>
          Telegram verification page
        </body>
      </html>
    `;
    
    res.type('html');
    res.send(content);
  } catch (error) {
    console.error('Ошибка при обработке запроса верификации Telegram домена:', error);
    res.status(500).send('Ошибка при верификации домена');
  }
});

// Обслуживание статических файлов клиентского приложения
router.use(express.static(path.join(__dirname, '../../../client/dist')));

// Маршрут для всех остальных запросов - отдаем index.html
router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../client/dist/index.html'));
});

module.exports = router; 