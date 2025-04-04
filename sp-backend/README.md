# SecretPlace.su

Веб-сайт и API для Minecraft сервера SecretPlace.su.

![Версия](https://img.shields.io/badge/версия-0.2.0--beta-blue)
[Заметки о версии](./docs/VERSION-NOTES.md)

## Установка зависимостей

```bash
bun install
```

## Запуск проекта

### Режим разработки

```bash
bun run dev
```

### Режим production

```bash
bun run start
```

### Инициализация базы данных

```bash
bun run init-db
```

## Документация

### База данных

Документация по работе с базой данных доступна в директории [docs/database](./docs/database):

- [Общая информация](./docs/database/README.md) - Обзор структуры базы данных
- [Инициализатор базы данных](./docs/database/initializer.md) - Документация по классу DatabaseInitializer
- [Подключение к базе данных](./docs/database/connection.md) - Документация по работе с подключениями
- [Обработка ошибок](./docs/database/error-handling.md) - Документация по обработке ошибок базы данных
- [Middleware](./docs/database/middleware.md) - Документация по работе с middleware для базы данных

### Мониторинг

Проект включает систему мониторинга Minecraft серверов:

- Автоматическая проверка статуса серверов
- Адаптивный интервал проверки (30 секунд для онлайн, 60 секунд для оффлайн)
- Увеличение интервала до 5 минут после 5 последовательных ошибок
- Классификация и обработка ошибок мониторинга
- Рекомендации по устранению проблем с серверами
- API для получения статуса серверов

Документация по мониторингу доступна в директории [docs/monitoring](./docs/monitoring):

- [Общая информация](./docs/monitoring/README.md) - Обзор системы мониторинга
- [Обработка ошибок](./docs/monitoring/error-handling.md) - Документация по обработке ошибок мониторинга

API-эндпоинты мониторинга:
- `GET /api/servers/status` - Получить статус всех серверов
- `GET /api/servers/:id/status` - Получить статус конкретного сервера
- `GET /api/servers/errors` - Получить информацию о серверах с ошибками

## О проекте

Этот проект использует [Bun](https://bun.sh) - быстрый JavaScript рантайм.

## История изменений

Все значимые изменения в проекте документируются в [CHANGELOG.md](./CHANGELOG.md).
