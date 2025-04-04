# Инициализатор базы данных (DatabaseInitializer)

Класс `DatabaseInitializer` отвечает за инициализацию баз данных в проекте SecretPlace.su. Он создает необходимые базы данных и таблицы, проверяет подключения и обеспечивает корректную структуру данных для функционирования приложения.

## Расположение файла

Класс `DatabaseInitializer` находится в файле `src/services/database/utils/database-initializer.ts`.

## Основные методы

### Проверка подключения к базе данных

```typescript
public static async testConnection(connection: DatabaseConnection): Promise<boolean>
```

Метод проверяет подключение к базе данных, выполняя простой SQL-запрос.

**Параметры:**
- `connection` - Объект подключения к базе данных.

**Возвращает:**
- `true`, если подключение установлено успешно.
- `false`, если произошла ошибка при подключении.

**Пример использования:**
```typescript
const connection = DatabaseConnection.createServerConnection(config);
const isConnected = await DatabaseInitializer.testConnection(connection);
if (isConnected) {
  console.log('Подключение к базе данных успешно установлено.');
} else {
  console.error('Ошибка подключения к базе данных.');
}
```

### Обеспечение существования базы данных

```typescript
public static async ensureDatabaseExists(rootConfig: DatabaseConfig, dbName: string): Promise<void>
```

Метод проверяет существование базы данных и создает её, если она не существует.

**Параметры:**
- `rootConfig` - Конфигурация для подключения к серверу БД (без указания базы данных).
- `dbName` - Имя базы данных для проверки/создания.

**Пример использования:**
```typescript
const rootConfig = { 
  host: 'localhost', 
  port: 3306, 
  user: 'root', 
  password: 'root_password',
  database: '', 
  connectionLimit: 1
};
await DatabaseInitializer.ensureDatabaseExists(rootConfig, 'my_database');
```

### Обеспечение существования таблицы

```typescript
public static async ensureTableExists(
  connection: DatabaseConnection, 
  tableName: string, 
  schemaPath: string, 
  skipInsert: boolean = false
): Promise<void>
```

Метод проверяет существование таблицы и создает её при необходимости, используя SQL-схему из файла.

**Параметры:**
- `connection` - Подключение к базе данных.
- `tableName` - Имя таблицы для проверки.
- `schemaPath` - Путь к SQL-файлу со схемой для создания таблицы.
- `skipInsert` - Пропустить операторы INSERT при применении схемы (по умолчанию `false`).

**Пример использования:**
```typescript
const connection = DatabaseConnection.createServerConnection(config);
const schemaPath = path.join(process.cwd(), 'src', 'services', 'database', 'schemas', 'site.sql');
await DatabaseInitializer.ensureTableExists(connection, 'servers', schemaPath, true);
```

### Инициализация основной базы данных сайта

```typescript
public static async initializeSiteDatabase(config: DatabaseConfig): Promise<void>
```

Метод инициализирует основную базу данных сайта, создавая необходимые таблицы.

**Параметры:**
- `config` - Конфигурация базы данных.

**Пример использования:**
```typescript
const config = {
  host: 'localhost',
  port: 3306,
  user: 'admin',
  password: 'admin_password',
  database: 'secretplace',
  connectionLimit: 10
};
await DatabaseInitializer.initializeSiteDatabase(config);
```

### Инициализация базы данных сервера

```typescript
public static async initializeServerDatabase(
  config: DatabaseConfig, 
  serverName: string,
  forceCreateEasyAuth: boolean = false
): Promise<void>
```

Метод инициализирует базу данных сервера Minecraft, проверяя подключение и создавая необходимые таблицы.

**Параметры:**
- `config` - Конфигурация БД сервера.
- `serverName` - Имя сервера (для логов).
- `forceCreateEasyAuth` - Принудительно создать таблицу EasyAuth (если известно, что мод не создаст её).

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
await DatabaseInitializer.initializeServerDatabase(serverConfig, 'SurvivalServer', true);
```

### Инициализация баз данных всех серверов

```typescript
public static async initializeAllServerDatabases(siteConnection: DatabaseConnection): Promise<void>
```

Метод инициализирует базы данных всех серверов, указанных в основной БД сайта.

**Параметры:**
- `siteConnection` - Подключение к основной БД сайта.

**Пример использования:**
```typescript
const siteConnection = DatabaseConnection.createServerConnection(siteConfig);
await DatabaseInitializer.initializeAllServerDatabases(siteConnection);
```

### Выполнение SQL-скрипта

```typescript
public static async executeSqlScript(
  connection: DatabaseConnection,
  sql: string,
  skipInsert: boolean = true
): Promise<void>
```

Метод применяет SQL-скрипт напрямую к базе данных.

**Параметры:**
- `connection` - Подключение к базе данных.
- `sql` - SQL-скрипт для выполнения.
- `skipInsert` - Пропустить операторы INSERT (по умолчанию `true`).

**Пример использования:**
```typescript
const connection = DatabaseConnection.createServerConnection(config);
const sqlScript = fs.readFileSync('path/to/script.sql', 'utf8');
await DatabaseInitializer.executeSqlScript(connection, sqlScript, true);
```

## Вспомогательные методы

### Вывод диагностической информации

```typescript
private static printDiagnosticInfo(error: any): void
```

Метод выводит детальную диагностическую информацию об ошибке подключения к базе данных, включая рекомендации по исправлению проблем.

### Проверка настроек подключения

```typescript
public static checkDatabaseConfig(): { 
  hasEnvFile: boolean; 
  hasRequiredFields: boolean;
  missingFields: string[];
}
```

Метод проверяет настройки подключения к базе данных в файле `.env`.

**Возвращает:**
- Объект с результатами проверки:
  - `hasEnvFile` - Существует ли файл `.env`.
  - `hasRequiredFields` - Содержит ли файл `.env` все необходимые поля.
  - `missingFields` - Список отсутствующих полей.

**Пример использования:**
```typescript
const configCheck = DatabaseInitializer.checkDatabaseConfig();
if (!configCheck.hasEnvFile) {
  console.error('Файл .env не найден!');
} else if (!configCheck.hasRequiredFields) {
  console.error('В файле .env отсутствуют следующие поля:', configCheck.missingFields);
} else {
  console.log('Конфигурация базы данных корректна.');
}
```

### Вывод информации о подключении

```typescript
public static printConnectionInfo(config: DatabaseConfig): void
```

Метод выводит подробную информацию о конфигурации подключения к базе данных, скрывая пароль.

**Параметры:**
- `config` - Конфигурация для подключения к базе данных.

**Пример использования:**
```typescript
const config = {
  host: 'localhost',
  port: 3306,
  user: 'admin',
  password: 'secret_password',
  database: 'secretplace',
  connectionLimit: 10
};
DatabaseInitializer.printConnectionInfo(config);
```

## Интеграция с проектом

Класс `DatabaseInitializer` используется при запуске приложения для создания и проверки структуры базы данных. Обычно вызов инициализации выполняется в файле `index.ts` при старте сервера или в специальном скрипте для инициализации базы данных. 