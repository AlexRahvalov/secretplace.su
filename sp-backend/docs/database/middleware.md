# Middleware для базы данных

В проекте SecretPlace.su реализованы специальные middleware для обработки ошибок и управления подключениями к базе данных при работе с Express-приложением.

## Расположение файлов

Middleware для базы данных находятся в директории `src/services/database/middleware/`.

## Middleware для обработки ошибок базы данных

### databaseErrorMiddleware

```typescript
export function databaseErrorMiddleware(err: any, req: Request, res: Response, next: NextFunction)
```

Middleware для централизованной обработки ошибок базы данных. Преобразует ошибки базы данных в структурированные HTTP-ответы с правильными статус-кодами.

**Параметры:**
- `err` - Объект ошибки.
- `req` - Объект запроса Express.
- `res` - Объект ответа Express.
- `next` - Функция для перехода к следующему middleware.

**Особенности:**
- Автоматически определяет тип ошибки базы данных.
- Устанавливает HTTP-статус в зависимости от типа ошибки.
- Формирует понятное сообщение для пользователя.
- В режиме разработки добавляет техническую информацию для отладки.

**Соответствие типов ошибок и HTTP-статусов:**
- `NOT_FOUND` → 404 (Not Found)
- `DUPLICATE_ENTRY` → 409 (Conflict)
- `CONNECTION_ERROR` → 503 (Service Unavailable)
- `CONNECTION_TIMEOUT` → 503 (Service Unavailable)
- `ACCESS_DENIED` → 503 (Service Unavailable)
- `QUERY_ERROR` → 400 (Bad Request)
- `FK_CONSTRAINT` → 409 (Conflict)
- `UNKNOWN` → 500 (Internal Server Error)

**Пример ответа:**
```json
{
  "status": "error",
  "message": "Запись с такими данными уже существует.",
  "code": 1062,
  "type": "DUPLICATE_ENTRY",
  "devInfo": {
    "sqlState": "23000",
    "sql": "INSERT INTO servers (name) VALUES ('Существующий сервер')"
  }
}
```

**Пример использования:**
```typescript
import express from 'express';
import { databaseErrorMiddleware } from './services/database/middleware/database-error-middleware';

const app = express();

// ... определение маршрутов ...

// Добавляем middleware для обработки ошибок БД в конце цепочки
app.use(databaseErrorMiddleware);
```

### catchDatabaseErrors

```typescript
export function catchDatabaseErrors(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void
```

Обертка для обработки ошибок в асинхронных обработчиках маршрутов. Позволяет автоматически перехватывать ошибки в асинхронных функциях и передавать их в цепочку middleware.

**Параметры:**
- `fn` - Асинхронная функция-обработчик маршрута.

**Возвращает:**
- Функцию-обертку, которая перехватывает ошибки и передает их в next().

**Пример использования:**
```typescript
import express from 'express';
import { catchDatabaseErrors } from './services/database/middleware/database-error-middleware';
import { DatabaseConnection } from './services/database/connection';

const app = express();

// Определение маршрута с обработкой ошибок БД
app.get('/api/servers', catchDatabaseErrors(async (req, res) => {
  const connection = DatabaseConnection.getInstance();
  const servers = await connection.query('SELECT * FROM servers');
  res.json({ status: 'success', data: servers });
}));

// Обработка ошибок в конце
app.use(databaseErrorMiddleware);
```

## Преимущества использования middleware

1. **Централизованная обработка ошибок**
   - Все ошибки базы данных обрабатываются в одном месте, что упрощает поддержку и отладку.
   - Единый формат ответа на ошибки для всех маршрутов.

2. **Корректные HTTP-статусы**
   - Каждый тип ошибки базы данных преобразуется в соответствующий HTTP-статус.
   - Клиенты получают понятные и стандартные коды ошибок.

3. **Безопасность**
   - В производственном режиме техническая информация скрывается от клиентов.
   - Пользователи получают только понятные сообщения об ошибках.

4. **Упрощение кода маршрутов**
   - Использование `catchDatabaseErrors` избавляет от необходимости писать try/catch блоки в каждом маршруте.
   - Код маршрутов становится чище и понятнее.

## Пример полной настройки Express-приложения с middleware

```typescript
import express from 'express';
import { databaseErrorMiddleware, catchDatabaseErrors } from './services/database/middleware/database-error-middleware';
import { DatabaseConnection } from './services/database/connection';

const app = express();
app.use(express.json());

// Маршруты с обработкой ошибок БД
app.get('/api/servers', catchDatabaseErrors(async (req, res) => {
  const connection = DatabaseConnection.getInstance();
  const servers = await connection.query('SELECT * FROM servers');
  res.json({ status: 'success', data: servers });
}));

app.post('/api/servers', catchDatabaseErrors(async (req, res) => {
  const { name, ip, port } = req.body;
  
  if (!name || !ip) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Необходимо указать name и ip сервера' 
    });
  }
  
  const connection = DatabaseConnection.getInstance();
  await connection.query(
    'INSERT INTO servers (name, ip, port) VALUES (?, ?, ?)',
    [name, ip, port || 25565]
  );
  
  res.status(201).json({ status: 'success', message: 'Сервер создан' });
}));

// Обработка ошибок БД
app.use(databaseErrorMiddleware);

// Общая обработка ошибок
app.use((err, req, res, next) => {
  console.error('Необработанная ошибка:', err);
  res.status(500).json({ 
    status: 'error',
    message: 'Произошла непредвиденная ошибка на сервере'
  });
});

// Запуск сервера
app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
``` 