import express from 'express';

const app = express();
const port = 3001;

// Middleware для парсинга JSON
app.use(express.json());

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({ message: 'Привет от Bun + Express!' });
});

// Пример маршрута API
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'success',
    data: {
      message: 'API работает'
    }
  });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});