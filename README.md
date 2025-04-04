# SecretPlace.su

Официальный сайт Minecraft сервера SecretPlace.su

## Структура проекта

Проект разделен на две основные части:

### Backend (`sp-backend/`)
Серверная часть приложения, написанная на TypeScript с использованием Bun и Express.js.

### Frontend (`sp-frontend/`)
Клиентская часть приложения, написанная на React с использованием Vite.

## Установка и запуск

### Backend
```bash
cd sp-backend
bun install
bun run dev
```

### Frontend
```bash
cd sp-frontend
bun install
bun run client:dev
```

## Требования

- Bun >= 1.2.8
- Node.js >= 18
- MariaDB

## Лицензия

ISC 