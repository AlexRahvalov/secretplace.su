# Обработка ошибок базы данных

В проекте SecretPlace.su реализован комплексный механизм обработки ошибок базы данных, который позволяет идентифицировать тип ошибки, получать подробную диагностическую информацию и рекомендации по устранению проблемы.

## Основные компоненты

### 1. DatabaseErrorType

Перечисление, определяющее типы ошибок базы данных:

```typescript
export enum DatabaseErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  QUERY_ERROR = 'QUERY_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  FK_CONSTRAINT = 'FK_CONSTRAINT',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN'
}
```

### 2. DatabaseError

Интерфейс, описывающий структуру объекта ошибки базы данных:

```typescript
export interface DatabaseError {
  type: DatabaseErrorType;
  code?: string | number;
  message: string;
  originalError?: Error;
  details?: string;
  sqlState?: string;
  sql?: string;
}
```

### 3. DatabaseErrorHandler

Класс, отвечающий за обработку и классификацию ошибок базы данных.

## Обработка ошибок MariaDB/MySQL

```typescript
public static handleMariaDbError(error: any): DatabaseError
```

Метод анализирует ошибку MariaDB/MySQL и преобразует её в объект `DatabaseError` с определенным типом ошибки, сообщением и дополнительной информацией.

**Параметры:**
- `error` - Исходная ошибка, полученная при работе с базой данных.

**Возвращает:**
- Объект `DatabaseError` с типизированной информацией об ошибке.

**Пример использования:**
```typescript
try {
  await connection.query('SELECT * FROM non_existent_table');
} catch (error) {
  const dbError = DatabaseErrorHandler.handleMariaDbError(error);
  console.error(`Тип ошибки: ${dbError.type}`);
  console.error(`Код ошибки: ${dbError.code}`);
  console.error(`Сообщение: ${dbError.message}`);
}
```

## Получение пользовательского сообщения

```typescript
public static logAndGetUserMessage(error: DatabaseError): string
```

Метод логирует ошибку с полными деталями и возвращает сообщение для пользователя в зависимости от типа ошибки.

**Параметры:**
- `error` - Объект ошибки базы данных.

**Возвращает:**
- Строку с сообщением для пользователя.

**Пример использования:**
```typescript
try {
  await connection.query('INSERT INTO servers (name) VALUES (?)', ['Existing Server']);
} catch (error) {
  const dbError = DatabaseErrorHandler.handleMariaDbError(error);
  const userMessage = DatabaseErrorHandler.logAndGetUserMessage(dbError);
  res.status(400).json({ error: userMessage });
}
```

## Получение рекомендаций по решению проблемы

```typescript
public static getSolutionMessage(error: DatabaseError): string
```

Метод предоставляет рекомендации по решению проблемы в зависимости от типа ошибки.

**Параметры:**
- `error` - Объект ошибки базы данных.

**Возвращает:**
- Строку с рекомендациями по решению проблемы.

**Пример использования:**
```typescript
try {
  await connection.query('SELECT * FROM servers');
} catch (error) {
  const dbError = DatabaseErrorHandler.handleMariaDbError(error);
  const solution = DatabaseErrorHandler.getSolutionMessage(dbError);
  console.error(`Рекомендация: ${solution}`);
}
```

## Middleware для обработки ошибок базы данных

В проекте реализован middleware `catchDatabaseErrors`, который автоматически обрабатывает ошибки базы данных в маршрутах Express:

```typescript
export function catchDatabaseErrors(handler: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      const dbError = DatabaseErrorHandler.handleMariaDbError(error);
      const userMessage = DatabaseErrorHandler.logAndGetUserMessage(dbError);
      
      res.status(500).json({
        status: 'error',
        error: {
          type: dbError.type,
          message: userMessage
        }
      });
    }
  };
}
```

**Пример использования:**
```typescript
// Маршрут с автоматической обработкой ошибок базы данных
app.get('/api/servers', catchDatabaseErrors(async (req, res) => {
  const connection = DatabaseConnection.getInstance();
  const servers = await connection.query('SELECT * FROM servers');
  res.json({ status: 'success', data: servers });
}));
```

## Диагностика ошибок подключения

Для ошибок подключения к базе данных в проекте реализована детальная диагностика, включающая:

1. Проверку наличия `.env` файла
2. Проверку правильности учетных данных
3. Рекомендации по созданию пользователя в MySQL/MariaDB
4. Проверку доступности сервера базы данных

Пример диагностической информации:

```
[Диагностика] Тип ошибки: CONNECTION_ERROR
[Диагностика] Код ошибки: ECONNREFUSED
[Диагностика] Сообщение: Не удалось подключиться к серверу MySQL по адресу localhost:3306

[Решение] Убедитесь, что сервер MariaDB/MySQL запущен и правильно настроен. 
Проверьте параметры подключения (host, port) в файле .env.

[Решение] Не удалось подключиться к серверу базы данных!
Проверьте, что сервер MariaDB/MySQL запущен и доступен по указанному адресу и порту.
```

## Типы ошибок и их обработка

### CONNECTION_ERROR

Ошибки связанные с невозможностью установить соединение с сервером базы данных:

- Коды: ECONNREFUSED, ETIMEDOUT, EPIPE, PROTOCOL_CONNECTION_LOST, 1040, 1042, 1043, 1129
- Решение: Проверить запуск сервера базы данных, сетевые настройки и доступность.

### CONNECTION_TIMEOUT

Ошибки таймаута подключения:

- Коды: ER_GET_CONNECTION_TIMEOUT
- Решение: Увеличить таймауты подключения или проверить нагрузку на сервер.

### ACCESS_DENIED

Ошибки доступа (неправильные учетные данные):

- Коды: ER_ACCESS_DENIED_ERROR, 1045
- Решение: Проверить логин/пароль в файле .env или создать пользователя с указанными учетными данными.

### QUERY_ERROR

Ошибки выполнения запросов:

- Коды: 1064 (Syntax error), 1146 (Table doesn't exist), 1054 (Unknown column)
- Решение: Проверить синтаксис SQL-запроса и существование таблиц/полей.

### DUPLICATE_ENTRY

Ошибки при попытке вставить дублирующееся значение:

- Коды: 1062
- Решение: Использовать уникальные значения для полей с ограничением уникальности.

### FK_CONSTRAINT

Ошибки нарушения ограничения внешнего ключа:

- Коды: 1216, 1217, 1451, 1452
- Решение: Проверить связанные записи в других таблицах перед выполнением операции.

### NOT_FOUND

Ошибки отсутствия запрашиваемых данных:

- Решение: Убедиться, что запрашиваемая запись существует в базе данных.

### UNKNOWN

Неизвестные ошибки:

- Решение: Проверить логи сервера для получения дополнительной информации. 