# Сервис авторизации

## Общее описание

Сервис авторизации предоставляет API для аутентификации пользователей в игровых серверах Minecraft. Система построена на базе EasyAuth и поддерживает множественные сервера. Регистрация пользователей происходит автоматически при первом входе на сервер через игровой клиент.

## Основные возможности

- Аутентификация существующих пользователей
- Верификация JWT токенов
- Управление статусом онлайн пользователей
- Поддержка множественных серверов
- Защита от перебора паролей

## API Endpoints

### Авторизация
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "serverId": number
}
```

**Ответ:**
```json
{
  "success": boolean,
  "message": "string",
  "token": "string" // JWT токен при успешной авторизации
}
```

### Выход
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "success": boolean,
  "message": "string"
}
```

### Верификация токена
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "success": boolean,
  "message": "string"
}
```

## Безопасность

- Пароли хешируются с использованием bcrypt (salt rounds: 12)
- Аутентификация через JWT токены
- Токены имеют срок действия 24 часа
- Отслеживание неудачных попыток входа
- Защита от перебора паролей

## JWT Токен

Токен содержит следующую информацию:
```json
{
  "username": "string",
  "serverId": number,
  "iat": number,
  "exp": number
}
```

## Интеграция с базой данных

Сервис использует две базы данных:
1. **Основная база данных** - хранит информацию о серверах и их конфигурации
2. **База данных сервера** - каждый сервер имеет свою базу данных с таблицей `easyauth`

### Структура таблицы easyauth

```sql
CREATE TABLE easyauth (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  username_lower VARCHAR(255) NOT NULL,
  uuid VARCHAR(36) NOT NULL,
  data JSON NOT NULL,
  UNIQUE KEY username_lower_unique (username_lower)
);
```

Поле `data` содержит JSON объект со следующей структурой:
```json
{
  "password": "string", // Хешированный пароль
  "last_ip": "string",
  "last_authenticated_date": "string",
  "login_tries": number,
  "last_kicked_date": "string",
  "online_account": "string",
  "registration_date": "string",
  "data_version": number,
  "is_online": boolean
}
```

## Обработка ошибок

Сервис предоставляет информативные сообщения об ошибках:
- Неверные учетные данные
- Сервер не найден
- Пользователь не существует
- Ошибки подключения к базе данных
- Ошибки сервера

## Пример использования

### Авторизация
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'player123',
    password: 'securepass',
    serverId: 1
  })
});

const data = await response.json();
// Сохраните token для последующих запросов
```

## Важные замечания

1. Регистрация пользователей происходит **только** через игровой клиент Minecraft при первом входе на сервер
2. API не предоставляет возможности регистрации через веб-интерфейс
3. Все операции с пользователями (создание, удаление) должны выполняться через игровой сервер
4. Сервис авторизации предоставляет только функционал аутентификации и управления сессиями 