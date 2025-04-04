import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  authControllerFactory,
  serverModule,
  DatabaseErrorHandler,
  DatabaseInitializer,
  mainDatabaseConnection,
  DatabaseConnection,
  DatabaseErrorType,
  databaseErrorMiddleware,
  catchDatabaseErrors
} from './src/services/database';
import { initializeMonitoring, serverStatusRoutes } from './src/services/monitoring';
import { AuthModule } from './src/services/auth';
import type { DatabaseConfig } from './src/services/database';
import type { AuthServiceConfig } from './src/services/auth/types/auth.types';
import fs from 'fs';
import path from 'path';

// Загружаем переменные окружения
dotenv.config();

// Создаем приложение Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({ message: 'SecretPlace.su API' });
});

// Конфигурация для модуля авторизации
const authConfig: AuthServiceConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  cookieName: 'auth_token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 часа
    sameSite: 'strict'
  }
};

// Инициализация и подключение модуля авторизации
const authModule = new AuthModule(mainDatabaseConnection, authConfig);
app.use('/api', authModule.getRouter());

// Пример маршрута для получения серверов
app.get('/api/servers', catchDatabaseErrors(async (req, res) => {
  const servers = await serverModule.getAllServers();
  res.json(servers);
}));

// Маршруты статуса серверов
app.use('/api/servers', serverStatusRoutes);

// Пример маршрута для аутентификации пользователя на сервере
app.post('/api/servers/:serverId/auth', catchDatabaseErrors(async (req, res) => {
  const { serverId } = req.params;
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Имя пользователя и пароль обязательны',
      code: 'MISSING_CREDENTIALS' 
    });
  }
  
  // Получаем контроллер для этого сервера
  const authController = await authControllerFactory.getAuthController(Number(serverId));
  
  // Выполняем аутентификацию
  const result = await authController.authenticate(username, password);
  
  res.json(result);
}));

// Middleware для обработки ошибок базы данных
app.use(databaseErrorMiddleware);

// Middleware для обработки других ошибок
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Необработанная ошибка:', err);
  
  res.status(500).json({
    status: 'error',
    message: 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV !== 'production' && {
      devInfo: {
        name: err.name,
        message: err.message,
        stack: err.stack
      }
    })
  });
});

// Инициализация базы данных и запуск сервера
async function startServer() {
  try {
    // Проверяем наличие .env файла и требуемых параметров
    const configCheck = DatabaseInitializer.checkDatabaseConfig();
    
    if (!configCheck.hasEnvFile) {
      console.error('Файл .env не найден! Запустите команду:');
      console.error('   bun run init-db');
      process.exit(1);
    }
    
    if (!configCheck.hasRequiredFields) {
      console.error(`В файле .env отсутствуют следующие обязательные параметры: ${configCheck.missingFields.join(', ')}`);
      console.error('Отредактируйте файл .env и запустите приложение снова.');
      process.exit(1);
    }

    // Создаем подключение с меньшим таймаутом для проверки
    const dbConfig: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'secretplace',
      connectionLimit: 1,
      connectTimeout: 5000
    };
    
    // Выводим информацию о подключении
    DatabaseInitializer.printConnectionInfo(dbConfig);
    
    // Проверяем подключение к базе данных сервера (без указания базы данных)
    console.log('Проверка подключения к серверу базы данных...');
    const rootConfig: DatabaseConfig = { ...dbConfig, database: '' };
    const rootConnection = DatabaseConnection.createServerConnection(rootConfig);
    const isRootConnected = await DatabaseInitializer.testConnection(rootConnection);
    
    if (!isRootConnected) {
      console.error('\nНе удалось подключиться к серверу базы данных. Проверьте, запущен ли сервер MySQL/MariaDB.');
      process.exit(1);
    }
    
    console.log('Подключение к серверу базы данных установлено.');
    
    // Проверяем существование базы данных и создаем её, если она не существует
    try {
      await DatabaseInitializer.ensureDatabaseExists(rootConfig, dbConfig.database);
      await rootConnection.end();
    } catch (dbError) {
      console.error('Ошибка при создании базы данных:', dbError);
      process.exit(1);
    }
    
    // Теперь пытаемся подключиться к созданной базе данных
    console.log('Подключение к базе данных приложения...');
    const connection = DatabaseConnection.createServerConnection(dbConfig);
    const isConnected = await DatabaseInitializer.testConnection(connection);
    
    if (!isConnected) {
      console.error('\nНе удалось подключиться к базе данных приложения после её создания. Запустите скрипт инициализации:');
      console.error('   bun run init-db');
      process.exit(1);
    }
    
    // Проверяем наличие таблицы servers и создаем её при необходимости
    console.log('Проверка наличия таблицы servers...');
    try {
      const schemaPath = path.join(process.cwd(), 'src', 'services', 'database', 'schemas', 'site.sql');
      
      // Проверяем, что файл схемы существует
      if (!fs.existsSync(schemaPath)) {
        console.error(`Файл схемы '${schemaPath}' не найден!`);
        
        // Выводим содержимое директории schemas
        const schemasDir = path.join(process.cwd(), 'src', 'services', 'database', 'schemas');
        if (fs.existsSync(schemasDir)) {
          console.log('Содержимое директории schemas:');
          const files = fs.readdirSync(schemasDir);
          files.forEach(file => console.log(`- ${file}`));
        } else {
          console.error(`Директория '${schemasDir}' не найдена!`);
        }
        
        process.exit(1);
      }
      
      console.log(`Файл схемы найден: ${schemaPath}`);
      
      // Проверка таблицы и её создание
      await DatabaseInitializer.ensureTableExists(connection, 'servers', schemaPath);
      
      // Дополнительная проверка - просто попробуем выполнить запрос к таблице
      try {
        const tablesResult = await connection.query('SHOW TABLES');
        console.log('Таблицы в базе данных:', JSON.stringify(tablesResult));
        
        const serversExists = Array.isArray(tablesResult) && 
          tablesResult.some((row: any) => {
            // Получаем первое значение из каждой строки (имя таблицы)
            const tableName = Object.values(row)[0];
            return tableName === 'servers';
          });
        
        if (!serversExists) {
          console.log('Таблица servers не найдена в результатах SHOW TABLES. Применяю SQL напрямую...');
          
          // Читаем SQL и выполняем напрямую
          const sqlContent = fs.readFileSync(schemaPath, 'utf8');
          await DatabaseInitializer.executeSqlScript(connection, sqlContent);
          
          // Проверяем еще раз
          const checkResult = await connection.query('SHOW TABLES');
          console.log('Таблицы после прямого применения SQL:', JSON.stringify(checkResult));
        } else {
          console.log('Таблица servers найдена в SHOW TABLES.');
          const checkServers = await connection.query('SELECT * FROM servers LIMIT 1');
          console.log('Проверка запроса к таблице servers:', 
            Array.isArray(checkServers) && checkServers.length > 0 ? 'Есть записи' : 'Нет записей');
        }
      } catch (queryError) {
        console.error('Ошибка при проверке таблицы servers запросом:', queryError);
        
        // Если проверка не удалась, попробуем выполнить SQL напрямую
        try {
          console.log('Попытка прямого применения SQL-схемы...');
          const sqlContent = fs.readFileSync(schemaPath, 'utf8');
          await DatabaseInitializer.executeSqlScript(connection, sqlContent);
        } catch (directSqlError) {
          console.error('Ошибка при прямом применении SQL-схемы:', directSqlError);
        }
      }
      
      console.log('Таблица servers проверена/создана успешно.');
    } catch (tableError) {
      console.error('Ошибка при проверке/создании таблицы servers:', tableError);
      console.error('Запустите полную инициализацию базы данных:');
      console.error('   bun run init-db');
      process.exit(1);
    }
    
    await connection.end();
    
    console.log('Таблица servers проверена/создана успешно.');
    
    // Инициализируем мониторинг серверов
    await initializeMonitoring();
    
    console.log('Подключение к базе данных установлено и структура проверена.');
    
    // Запускаем сервер Express
    app.listen(port, () => {
      console.log(`SecretPlace.su API запущен на порту ${port}`);
    });
  } catch (error) {
    console.error('Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

// Запуск сервера
startServer();