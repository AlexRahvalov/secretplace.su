# Руководство по развертыванию SecretPlace.su

## Требования к системе

### Программное обеспечение
- Node.js 18+ LTS
- MySQL 8.0+
- Redis 6.0+ (для кэширования)
- Nginx (для прокси)

### Аппаратные требования
- CPU: 2+ ядра
- RAM: 4+ ГБ
- Диск: 20+ ГБ SSD

## Подготовка окружения

### 1. Установка Node.js
```bash
# Установка Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версии
node --version
npm --version
```

### 2. Установка MySQL
```bash
# Установка MySQL
sudo apt-get install mysql-server

# Настройка безопасности
sudo mysql_secure_installation
```

### 3. Установка Redis
```bash
# Установка Redis
sudo apt-get install redis-server

# Настройка Redis для работы как сервис
sudo systemctl enable redis-server
```

### 4. Установка Nginx
```bash
# Установка Nginx
sudo apt-get install nginx

# Включение и запуск сервиса
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Развертывание приложения

### 1. Клонирование репозитория
```bash
git clone https://github.com/your-username/secretplace.su.git
cd secretplace.su
```

### 2. Установка зависимостей
```bash
# Установка зависимостей сервера
cd server
npm install

# Установка зависимостей клиента
cd ../client
npm install
```

### 3. Настройка конфигурации

#### Создание .env файла
```bash
# В директории server
cp .env.example .env
```

Отредактируйте .env файл:
```env
# Основные настройки
NODE_ENV=production
PORT=3001

# База данных
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=secretplace

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Настройки Minecraft сервера
MC_SERVER_HOST=play.secretplace.su
MC_SERVER_PORT=25565
MC_UPDATE_INTERVAL=120000
```

### 4. Настройка базы данных
```bash
# Создание базы данных
mysql -u root -p
CREATE DATABASE secretplace;
CREATE USER 'secretplace'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON secretplace.* TO 'secretplace'@'localhost';
FLUSH PRIVILEGES;

# Применение миграций
cd server
npm run migrate
```

### 5. Сборка клиента
```bash
cd client
npm run build
```

### 6. Настройка Nginx

Создайте файл конфигурации:
```nginx
server {
    listen 80;
    server_name secretplace.su www.secretplace.su;

    # SSL configuration
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/secretplace.su/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/secretplace.su/privkey.pem;

    # Клиентская часть
    location / {
        root /var/www/secretplace.su/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. Настройка PM2 для управления процессами
```bash
# Установка PM2
npm install -g pm2

# Запуск сервера
cd server
pm2 start npm --name "secretplace-api" -- start

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска
pm2 startup
```

## Мониторинг и логирование

### Логи приложения
- API логи: `/var/log/secretplace/api.log`
- Nginx логи: `/var/log/nginx/secretplace.access.log`
- PM2 логи: `pm2 logs secretplace-api`

### Мониторинг
```bash
# Статус процессов
pm2 status

# Мониторинг ресурсов
pm2 monit

# Статус Nginx
systemctl status nginx

# Статус Redis
systemctl status redis
```

## Обновление приложения

```bash
# Остановка сервера
pm2 stop secretplace-api

# Получение обновлений
git pull

# Обновление зависимостей
npm install

# Применение миграций
npm run migrate

# Перезапуск сервера
pm2 restart secretplace-api
```

## Резервное копирование

### База данных
```bash
# Создание бэкапа
mysqldump -u root -p secretplace > backup.sql

# Восстановление из бэкапа
mysql -u root -p secretplace < backup.sql
```

### Файлы приложения
```bash
# Бэкап всего приложения
tar -czf secretplace-backup.tar.gz /var/www/secretplace.su
```

## Устранение неполадок

### Проверка статуса сервисов
```bash
# Проверка API
curl http://localhost:3001/api/health

# Проверка Redis
redis-cli ping

# Проверка MySQL
mysql -u root -p -e "SELECT VERSION();"
```

### Частые проблемы

1. **API недоступен**
   - Проверить логи: `pm2 logs secretplace-api`
   - Проверить порт: `netstat -tulpn | grep 3001`
   - Перезапустить сервер: `pm2 restart secretplace-api`

2. **Проблемы с кэшем**
   - Очистить Redis: `redis-cli FLUSHALL`
   - Перезапустить Redis: `systemctl restart redis`

3. **Ошибки базы данных**
   - Проверить подключение: `mysql -u secretplace -p`
   - Проверить логи MySQL: `tail -f /var/log/mysql/error.log` 