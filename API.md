# API Documentation SecretPlace.su

## Основные эндпоинты

### Серверы

#### GET /api/server/main
Получение информации об основном сервере.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "server_name": "SecretPlace.su",
    "ip": "play.secretplace.su",
    "query_port": 25565,
    "description": "Основной сервер",
    "created_at": "2024-03-21T10:00:00.000Z",
    "updated_at": "2024-03-21T10:00:00.000Z"
  },
  "message": "Основной сервер успешно получен"
}
```

#### GET /api/server/info?id={serverId}
Получение информации о конкретном сервере.

**Параметры:**
- `id` (обязательный) - ID сервера

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "server_name": "SecretPlace.su",
    "ip": "play.secretplace.su",
    "query_port": 25565,
    "description": "Описание сервера",
    "created_at": "2024-03-21T10:00:00.000Z",
    "updated_at": "2024-03-21T10:00:00.000Z"
  },
  "message": "Информация о сервере успешно получена"
}
```

**Ошибки:**
- 400 Bad Request - Не указан ID сервера
- 404 Not Found - Сервер не найден

#### GET /api/server/status?id={serverId}
Получение текущего статуса сервера.

**Параметры:**
- `id` (обязательный) - ID сервера

**Ответ:**
```json
{
  "success": true,
  "data": {
    "online": true,
    "onlinePlayers": 10,
    "maxPlayers": 100,
    "tps": 20,
    "uptime": 99.9,
    "version": "1.20.4",
    "motd": "SecretPlace.su - Майнкрафт сервер для всех!",
    "lastUpdated": "2024-03-21T12:34:56.789Z",
    "serverIp": "play.secretplace.su"
  },
  "message": "Статус сервера успешно получен"
}
```

#### GET /api/server/history/{period}?id={serverId}
Получение истории статистики сервера за определенный период.

**Параметры:**
- `id` (обязательный) - ID сервера
- `period` (обязательный) - Период (day, week, month, year)

**Ответ:**
```json
{
  "success": true,
  "data": {
    "period": "day",
    "stats": [
      {
        "timestamp": "2024-03-21T12:00:00.000Z",
        "onlinePlayers": 15,
        "tps": 20,
        "uptime": 100
      }
    ]
  },
  "message": "История сервера успешно получена"
}
```

### Новости

#### GET /api/news/latest
Получение последних новостей.

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Обновление сервера",
      "content": "Текст новости",
      "created_at": "2024-03-21T10:00:00.000Z"
    }
  ],
  "message": "Новости успешно получены"
}
```

## Форматы ответов

### Успешный ответ
```json
{
  "success": true,
  "data": {}, // Данные ответа
  "message": "Сообщение об успехе"
}
```

### Ответ с ошибкой
```json
{
  "success": false,
  "error": {
    "message": "Описание ошибки",
    "code": "ERROR_CODE"
  }
}
```

## Коды ошибок

- `VALIDATION_ERROR` - Ошибка валидации входных данных
- `NOT_FOUND` - Запрашиваемый ресурс не найден
- `SERVER_ERROR` - Внутренняя ошибка сервера
- `AUTH_ERROR` - Ошибка авторизации 