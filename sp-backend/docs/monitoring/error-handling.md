# Обработка ошибок в системе мониторинга

## Содержание
1. [Общая информация](#общая-информация)
2. [Типы ошибок](#типы-ошибок)
3. [Класс MonitoringErrorHandler](#класс-monitoringerrorhandler)
4. [Примеры использования](#примеры-использования)
5. [Рекомендации по устранению проблем](#рекомендации-по-устранению-проблем)

## Общая информация

Система мониторинга Minecraft серверов включает в себя комплексный механизм обработки ошибок, который позволяет:
- Классифицировать ошибки по типам
- Логировать структурированную информацию об ошибках
- Предоставлять рекомендации по устранению проблем
- Адаптировать интервалы проверки в зависимости от частоты ошибок

Этот механизм реализован в классе `MonitoringErrorHandler` и используется всеми компонентами системы мониторинга.

## Типы ошибок

Система классифицирует ошибки мониторинга по следующим типам:

| Тип ошибки | Описание | Возможные причины |
|------------|----------|-------------------|
| `CONNECTION_REFUSED` | Подключение отклонено сервером | Сервер не запущен, порт закрыт, брандмауэр блокирует |
| `CONNECTION_TIMEOUT` | Превышено время ожидания подключения | Высокая нагрузка на сервер, проблемы с сетью |
| `CONNECTION_RESET` | Соединение сброшено сервером | Сбой сервера, проблемы с сетевым подключением |
| `UNKNOWN_HOST` | Не удалось найти хост | Недействительный IP-адрес или доменное имя |
| `INVALID_RESPONSE` | Некорректный ответ от сервера | Несовместимая версия протокола, это не Minecraft сервер |
| `SERVER_OFFLINE` | Сервер не в сети | Сервер был выключен или перезагружается |
| `DATABASE_ERROR` | Ошибка базы данных | Проблемы с подключением к БД, нарушение целостности данных |
| `UNKNOWN_ERROR` | Неизвестная ошибка | Непредвиденные ситуации |

## Класс MonitoringErrorHandler

Класс `MonitoringErrorHandler` предоставляет методы для обработки ошибок и получения рекомендаций по их устранению.

### Основные методы

#### handleError

```typescript
public static handleError(
  error: any, 
  serverInfo?: { id?: number; name?: string; ip?: string; port?: number }
): MonitoringError
```

Метод анализирует ошибку и преобразует её в структурированный объект типа `MonitoringError`.

**Параметры:**
- `error` - Исходная ошибка
- `serverInfo` - Дополнительная информация о сервере (опционально)

**Возвращает:**
- Объект `MonitoringError` с детальной информацией об ошибке

#### getTroubleshootingTips

```typescript
public static getTroubleshootingTips(error: MonitoringError): string
```

Метод возвращает рекомендации по устранению проблемы в зависимости от типа ошибки.

**Параметры:**
- `error` - Объект ошибки типа `MonitoringError`

**Возвращает:**
- Строку с рекомендациями по устранению проблемы

### Структура MonitoringError

```typescript
interface MonitoringError {
  type: MonitoringErrorType;
  code?: string;
  message: string;
  serverId?: number;
  serverName?: string;
  serverIp?: string;
  serverPort?: number;
  originalError?: Error;
  timestamp: Date;
}
```

## Примеры использования

### Обработка ошибок при пинге сервера

```typescript
try {
  const result = await mc.status(ip, port, { timeout: 5000 });
  // Обработка успешного результата
} catch (error) {
  // Обрабатываем ошибку с помощью нашего обработчика
  const monitoringError = MonitoringErrorHandler.handleError(error, {
    id: serverId,
    name: serverName,
    ip: serverIp,
    port: serverPort
  });
  
  // Выводим рекомендации по устранению проблемы
  const tips = MonitoringErrorHandler.getTroubleshootingTips(monitoringError);
  console.log(`[Мониторинг] Рекомендации: ${tips}`);
  
  // Обработка ошибки
}
```

### Интеграция с API

```typescript
// Получение информации о серверах с ошибками
app.get('/api/servers/errors', async (req, res) => {
  const offlineServers = await connection.query('SELECT * FROM servers WHERE status = "offline"');
  
  const serversWithErrors = offlineServers.map(server => {
    // Определяем тип ошибки
    let errorType = MonitoringErrorType.SERVER_OFFLINE;
    
    // Создаем объект ошибки
    const error = {
      type: errorType,
      message: `Сервер ${server.name} не в сети`,
      serverId: server.id,
      serverName: server.name,
      serverIp: server.ip,
      serverPort: server.port,
      timestamp: new Date()
    };
    
    // Получаем рекомендации
    const troubleshootingTips = MonitoringErrorHandler.getTroubleshootingTips(error);
    
    return {
      ...server,
      errorType,
      troubleshootingTips
    };
  });
  
  res.json({ status: 'success', data: serversWithErrors });
});
```

## Рекомендации по устранению проблем

Система предоставляет следующие рекомендации по устранению проблем в зависимости от типа ошибки:

### CONNECTION_REFUSED
"Проверьте, что сервер запущен и порт открыт. Возможно, брандмауэр блокирует подключение."

### CONNECTION_TIMEOUT
"Проверьте сетевое подключение. Возможно, сервер перегружен или сеть нестабильна."

### CONNECTION_RESET
"Сервер прервал соединение. Возможно, произошла ошибка на стороне сервера или у него проблемы с сетью."

### UNKNOWN_HOST
"Не удалось определить IP-адрес по указанному хосту. Проверьте правильность указанного адреса сервера."

### INVALID_RESPONSE
"Сервер отправил некорректный ответ. Возможно, версия протокола не поддерживается или это не Minecraft сервер."

### SERVER_OFFLINE
"Сервер не в сети. Это нормальное состояние, если сервер был выключен или перезагружается."

### DATABASE_ERROR
"Произошла ошибка при работе с базой данных. Проверьте подключение к БД и корректность запросов."

### UNKNOWN_ERROR
"Неизвестная ошибка. Проверьте логи сервера для более подробной информации." 