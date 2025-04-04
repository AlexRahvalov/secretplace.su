# Подключение к базе данных (DatabaseConnection)

Класс `DatabaseConnection` предоставляет интерфейс для работы с подключениями к базам данных в проекте SecretPlace.su. Он реализует паттерн Singleton для основного подключения к базе данных сайта и позволяет создавать отдельные подключения к базам данных серверов.

## Расположение файла

Класс `DatabaseConnection` находится в файле `src/services/database/connection.ts`.

## Конфигурация подключения

Для настройки подключения к базе данных используется интерфейс `DatabaseConfig`:

```typescript
export interface DatabaseConfig {
  host: string;       // Хост базы данных
  port: number;       // Порт базы данных
  user: string;       // Имя пользователя
  password: string;   // Пароль
  database: string;   // Имя базы данных
  connectionLimit?: number;  // Максимальное количество соединений в пуле
  connectTimeout?: number;   // Таймаут подключения (в мс)
}
```

## Основные методы

### Получение экземпляра для основной БД сайта

```typescript
public static getInstance(): DatabaseConnection
```

Метод реализует паттерн Singleton и возвращает единственный экземпляр подключения к основной базе данных сайта. Конфигурация читается из переменных окружения (`.env` файла).

**Возвращает:**
- Экземпляр `DatabaseConnection` для основной БД сайта.

**Пример использования:**
```typescript
const mainConnection = DatabaseConnection.getInstance();
const servers = await mainConnection.query('SELECT * FROM servers');
```

### Создание подключения к БД сервера

```typescript
public static createServerConnection(config: DatabaseConfig): DatabaseConnection
```

Метод создает новое подключение к базе данных сервера на основе переданной конфигурации.

**Параметры:**
- `config` - Объект конфигурации подключения.

**Возвращает:**
- Новый экземпляр `DatabaseConnection` для БД сервера.

**Пример использования:**
```typescript
const serverConfig = {
  host: 'localhost',
  port: 3306,
  user: 'server_user',
  password: 'server_password',
  database: 'minecraft_server',
  connectionLimit: 5
};
const serverConnection = DatabaseConnection.createServerConnection(serverConfig);
```

### Получение соединения из пула

```typescript
public async getConnection(): Promise<PoolConnection>
```

Метод получает соединение из пула для выполнения запросов. После использования соединение необходимо освободить с помощью `conn.release()`.

**Возвращает:**
- Объект `PoolConnection` для работы с базой данных.

**Пример использования:**
```typescript
const connection = DatabaseConnection.getInstance();
const conn = await connection.getConnection();
try {
  const result = await conn.query('SELECT * FROM servers WHERE id = ?', [1]);
  // Работа с результатом
} finally {
  await conn.release(); // Важно освободить соединение
}
```

### Выполнение запроса

```typescript
public async query(sql: string, params?: any[]): Promise<any>
```

Метод выполняет SQL-запрос и автоматически освобождает соединение после выполнения.

**Параметры:**
- `sql` - SQL-запрос в виде строки.
- `params` - Массив параметров для запроса (опционально).

**Возвращает:**
- Результат выполнения запроса.

**Пример использования:**
```typescript
const connection = DatabaseConnection.getInstance();

// Запрос без параметров
const allServers = await connection.query('SELECT * FROM servers');

// Запрос с параметрами
const specificServer = await connection.query(
  'SELECT * FROM servers WHERE name = ?', 
  ['SurvivalServer']
);
```

### Завершение работы с пулом соединений

```typescript
public async end(): Promise<void>
```

Метод завершает работу с пулом соединений, закрывая все активные соединения.

**Пример использования:**
```typescript
const connection = DatabaseConnection.createServerConnection(config);
try {
  // Работа с базой данных
} finally {
  await connection.end(); // Закрываем соединения
}
```

## Экспортируемые объекты

### mainDatabaseConnection

```typescript
export const mainDatabaseConnection = DatabaseConnection.getInstance();
```

Предварительно созданный экземпляр подключения к основной базе данных сайта, который можно импортировать напрямую.

**Пример использования:**
```typescript
import { mainDatabaseConnection } from '../services/database/connection';

async function getServers() {
  return await mainDatabaseConnection.query('SELECT * FROM servers');
}
```

## Работа с транзакциями

Для работы с транзакциями необходимо получить соединение из пула и использовать его методы `beginTransaction()`, `commit()` и `rollback()`.

**Пример использования:**
```typescript
const connection = DatabaseConnection.getInstance();
const conn = await connection.getConnection();

try {
  await conn.beginTransaction();
  
  // Выполняем запросы в рамках транзакции
  await conn.query('INSERT INTO servers (name, ip) VALUES (?, ?)', ['NewServer', '192.168.1.1']);
  await conn.query('UPDATE servers SET status = ? WHERE id = ?', ['online', 1]);
  
  // Фиксируем изменения
  await conn.commit();
} catch (error) {
  // В случае ошибки откатываем изменения
  await conn.rollback();
  console.error('Ошибка выполнения транзакции:', error);
  throw error;
} finally {
  // Освобождаем соединение
  await conn.release();
}
```

## Обработка ошибок

При возникновении ошибок при работе с базой данных используйте механизмы обработки ошибок, предоставляемые классом `DatabaseErrorHandler`. Это позволит получить детальную информацию о причинах ошибок и рекомендации по их устранению.

**Пример использования:**
```typescript
import { DatabaseConnection } from '../services/database/connection';
import { DatabaseErrorHandler } from '../services/database/error-handlers/database-error-handler';

async function executeQuery() {
  try {
    const connection = DatabaseConnection.getInstance();
    return await connection.query('SELECT * FROM servers');
  } catch (error) {
    const dbError = DatabaseErrorHandler.handleMariaDbError(error);
    console.error(`[Ошибка БД] ${dbError.type}: ${dbError.message}`);
    const solution = DatabaseErrorHandler.getSolutionMessage(dbError);
    console.error(`[Решение] ${solution}`);
    throw error;
  }
}
``` 