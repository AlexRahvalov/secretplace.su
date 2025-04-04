import { DatabaseConnection } from '../connection';
import type { DatabaseConfig } from '../connection';
import fs from 'fs';
import path from 'path';
import { DatabaseErrorHandler, DatabaseErrorType } from '../error-handlers/database-error-handler';
import { CREATE_SERVERS_TABLE, INSERT_TEST_SERVER } from './direct-sql';

export class DatabaseInitializer {
  /**
   * Проверяет подключение к базе данных
   * @param connection Подключение к базе данных
   * @returns true, если подключение успешно
   */
  public static async testConnection(connection: DatabaseConnection): Promise<boolean> {
    try {
      await connection.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Ошибка проверки подключения к базе данных:');
      this.printDiagnosticInfo(error);
      return false;
    }
  }

  /**
   * Выводит диагностическую информацию об ошибке подключения к базе данных
   * @param error Ошибка, возникшая при подключении
   */
  private static printDiagnosticInfo(error: any): void {
    try {
      const dbError = DatabaseErrorHandler.handleMariaDbError(error);
      
      console.error(`[Диагностика] Тип ошибки: ${dbError.type}`);
      console.error(`[Диагностика] Код ошибки: ${dbError.code}`);
      console.error(`[Диагностика] Сообщение: ${dbError.message}`);
      
      if (dbError.sqlState) {
        console.error(`[Диагностика] SQL State: ${dbError.sqlState}`);
      }
      
      // Выводим рекомендации по исправлению
      const solution = DatabaseErrorHandler.getSolutionMessage(dbError);
      console.error(`\n[Решение] ${solution}`);
      
      // Проверка наличия .env файла
      const envPath = path.join(process.cwd(), '.env');
      if (!fs.existsSync(envPath)) {
        console.error('\n[Решение] Файл .env не найден!');
        console.error('Создайте файл .env на основе .env.example с правильными учётными данными для базы данных.');
      } else {
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
          console.error('\n[Решение] Ошибка доступа к базе данных!');
          console.error('Проверьте логин/пароль в файле .env или создайте пользователя с указанными учётными данными в MariaDB/MySQL.');
          console.error('Пример команды для создания пользователя в MySQL:');
          console.error('  CREATE USER \'user\'@\'localhost\' IDENTIFIED BY \'password\';');
          console.error('  GRANT ALL PRIVILEGES ON *.* TO \'user\'@\'localhost\';');
          console.error('  FLUSH PRIVILEGES;');
        } else if (error.code === 'ECONNREFUSED') {
          console.error('\n[Решение] Не удалось подключиться к серверу базы данных!');
          console.error('Проверьте, что сервер MariaDB/MySQL запущен и доступен по указанному адресу и порту.');
        } else if (error.code === 'ER_GET_CONNECTION_TIMEOUT') {
          console.error('\n[Решение] Превышено время ожидания подключения!');
          console.error('Проверьте доступность сервера базы данных и сетевые настройки.');
        }
      }
    } catch (diagError) {
      console.error('Ошибка при выводе диагностической информации:', diagError);
    }
  }

  /**
   * Проверяет существование базы данных и создает её, если она не существует
   * @param rootConfig Конфигурация для подключения к серверу БД (без указания базы данных)
   * @param dbName Имя базы данных для проверки/создания
   */
  public static async ensureDatabaseExists(rootConfig: DatabaseConfig, dbName: string): Promise<void> {
    // Создаем временное подключение без указания базы данных
    const tempConfig: DatabaseConfig = { 
      ...rootConfig, 
      database: '', 
      connectionLimit: 1,   // Уменьшаем лимит соединений
      connectTimeout: 5000, // Уменьшаем таймаут подключения
    };
    
    let tempConnection;
    try {
      tempConnection = DatabaseConnection.createServerConnection(tempConfig);
      
      // Проверяем существование базы данных
      const [result] = await tempConnection.query(
        'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
        [dbName]
      );

      if (!result) {
        console.log(`База данных '${dbName}' не существует, создаем...`);
        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`База данных '${dbName}' успешно создана.`);
      } else {
        console.log(`База данных '${dbName}' уже существует.`);
      }
    } catch (error) {
      console.error(`Ошибка при проверке/создании базы данных '${dbName}':`);
      this.printDiagnosticInfo(error);
      throw error;
    } finally {
      if (tempConnection) {
        try {
          await tempConnection.end();
        } catch (endError) {
          console.error('Ошибка при закрытии временного подключения:', endError);
        }
      }
    }
  }

  /**
   * Проверяет существование таблицы и создает её при необходимости, используя SQL-схему
   * @param connection Подключение к базе данных
   * @param tableName Имя таблицы для проверки
   * @param schemaPath Путь к SQL-файлу со схемой для создания таблицы
   * @param skipInsert Пропустить операторы INSERT при применении схемы
   */
  public static async ensureTableExists(
    connection: DatabaseConnection, 
    tableName: string, 
    schemaPath: string, 
    skipInsert: boolean = false
  ): Promise<void> {
    try {
      // Проверяем существование таблицы
      const tableCheckQuery = `SHOW TABLES LIKE "${tableName}"`;
      console.log(`Выполняю запрос: ${tableCheckQuery}`);
      
      const results = await connection.query(tableCheckQuery);
      console.log(`Результат проверки таблицы: ${JSON.stringify(results)}`);
      
      // Таблица существует, если запрос вернул хотя бы одну строку
      const tableExists = Array.isArray(results) && results.length > 0;
      
      if (!tableExists) {
        console.log(`Таблица '${tableName}' не существует, создаем...`);
        
        // Проверяем существование файла схемы
        if (!fs.existsSync(schemaPath)) {
          throw new Error(`Файл схемы '${schemaPath}' не найден`);
        }
        
        // Читаем SQL-схему
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        console.log(`Содержимое файла схемы прочитано, размер: ${schemaContent.length} байт`);
        
        // Для большей надежности используем прямое выполнение SQL-скрипта
        await this.executeSqlScript(connection, schemaContent, skipInsert);
        
        console.log(`Таблица '${tableName}' успешно создана.`);
      } else {
        console.log(`Таблица '${tableName}' уже существует.`);
      }
    } catch (error) {
      console.error(`Ошибка при проверке/создании таблицы '${tableName}':`);
      this.printDiagnosticInfo(error);
      throw error;
    }
  }

  /**
   * Инициализирует основную базу данных сайта
   * @param config Конфигурация базы данных
   */
  public static async initializeSiteDatabase(config: DatabaseConfig): Promise<void> {
    try {
      // Создаем базу данных, если она не существует
      const rootConfig = { ...config, database: '' };
      await this.ensureDatabaseExists(rootConfig, config.database);
      
      // Подключаемся к базе данных
      const connection = DatabaseConnection.createServerConnection(config);
      
      // Проверяем/создаем таблицу серверов
      const schemaPath = path.join(process.cwd(), 'src', 'services', 'database', 'schemas', 'site.sql');
      await this.ensureTableExists(connection, 'servers', schemaPath);
      
      console.log('Инициализация базы данных сайта завершена.');
      await connection.end();
    } catch (error) {
      console.error('Ошибка инициализации базы данных сайта:', error);
      throw error;
    }
  }

  /**
   * Инициализирует базу данных сервера (проверяет подключение)
   * Таблицы для модов авторизации, таких как EasyAuth, могут создаваться самими модами при запуске
   * @param config Конфигурация БД сервера
   * @param serverName Имя сервера (для логов)
   * @param forceCreateEasyAuth Принудительно создать таблицу EasyAuth (если известно, что мод не создаст её)
   */
  public static async initializeServerDatabase(
    config: DatabaseConfig, 
    serverName: string,
    forceCreateEasyAuth: boolean = false
  ): Promise<void> {
    try {
      // Создаем базу данных, если она не существует
      const rootConfig = { ...config, database: '' };
      await this.ensureDatabaseExists(rootConfig, config.database);
      
      // Подключаемся к базе данных
      const connection = DatabaseConnection.createServerConnection(config);
      
      // Если нужно принудительно создать таблицу EasyAuth
      if (forceCreateEasyAuth) {
        const schemaPath = path.join(process.cwd(), 'src', 'services', 'database', 'schemas', 'easyauth.sql');
        await this.ensureTableExists(connection, 'easyauth', schemaPath, true); // true - пропускаем INSERT
      }
      
      console.log(`Инициализация базы данных сервера '${serverName}' завершена.`);
      await connection.end();
    } catch (error) {
      console.error(`Ошибка инициализации базы данных сервера '${serverName}':`, error);
      throw error;
    }
  }

  /**
   * Инициализирует все базы данных серверов, указанных в основной БД
   * @param siteConnection Подключение к основной БД сайта
   */
  public static async initializeAllServerDatabases(siteConnection: DatabaseConnection): Promise<void> {
    try {
      // Получаем список серверов
      const servers = await siteConnection.query(`
        SELECT id, name, auth_type as authType,
          db_host as host, db_port as port, db_user as user,
          db_password as password, db_name as database
        FROM servers
      `);
      
      if (!servers || !servers.length) {
        console.log('Серверы не найдены.');
        return;
      }
      
      // Инициализируем базу данных для каждого сервера
      for (const server of servers) {
        const serverConfig: DatabaseConfig = {
          host: server.host,
          port: server.port,
          user: server.user,
          password: server.password,
          database: server.database
        };
        
        // Определяем, нужно ли создавать таблицы для EasyAuth
        const forceCreateEasyAuth = server.authType.toLowerCase() === 'easyauth';
        
        await this.initializeServerDatabase(serverConfig, server.name, forceCreateEasyAuth);
      }
      
      console.log('Инициализация баз данных всех серверов завершена.');
    } catch (error) {
      console.error('Ошибка инициализации баз данных серверов:', error);
      throw error;
    }
  }

  /**
   * Проверяет настройки подключения к базе данных в файле .env
   * @returns Объект с результатами проверки
   */
  public static checkDatabaseConfig(): { 
    hasEnvFile: boolean; 
    hasRequiredFields: boolean;
    missingFields: string[];
  } {
    const result = {
      hasEnvFile: false,
      hasRequiredFields: true,
      missingFields: [] as string[]
    };

    // Проверяем наличие .env файла
    const envPath = path.join(process.cwd(), '.env');
    result.hasEnvFile = fs.existsSync(envPath);

    if (result.hasEnvFile) {
      // Проверяем наличие необходимых полей
      const requiredFields = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
      
      for (const field of requiredFields) {
        if (!process.env[field]) {
          result.hasRequiredFields = false;
          result.missingFields.push(field);
        }
      }
    }

    return result;
  }
  
  /**
   * Выводит подробную информацию о конфигурации подключения к базе данных
   * @param config Конфигурация для подключения к базе данных
   */
  public static printConnectionInfo(config: DatabaseConfig): void {
    console.log('\n[Информация о подключении к базе данных]');
    console.log(`Хост: ${config.host}`);
    console.log(`Порт: ${config.port}`);
    console.log(`Пользователь: ${config.user}`);
    console.log(`База данных: ${config.database}`);
    console.log(`Пароль: ${'*'.repeat(config.password?.length || 0)}`);
    console.log(`Лимит соединений: ${config.connectionLimit || 'не указан'}`);
    console.log('');
  }

  /**
   * Применяет SQL-скрипт напрямую к базе данных
   * @param connection Подключение к базе данных
   * @param sql SQL-скрипт для выполнения
   * @param skipInsert Пропустить операторы INSERT
   */
  public static async executeSqlScript(
    connection: DatabaseConnection,
    sql: string,
    skipInsert: boolean = true
  ): Promise<void> {
    try {
      console.log("Начинаю выполнение SQL запросов для таблицы servers");
      
      // Выполняем запрос на создание таблицы
      try {
        console.log("Выполняю CREATE TABLE запрос...");
        await connection.query(CREATE_SERVERS_TABLE);
        console.log("Таблица servers успешно создана!");
      } catch (createError) {
        console.error("Ошибка при создании таблицы servers:", createError);
        throw createError;
      }
      
      // Выполняем запрос на вставку данных (если не пропускаем)
      if (!skipInsert) {
        try {
          console.log("Выполняю INSERT запрос...");
          await connection.query(INSERT_TEST_SERVER);
          console.log("Тестовые данные успешно вставлены в таблицу servers!");
        } catch (insertError) {
          console.error("Ошибка при вставке данных в таблицу servers:", insertError);
          // Не выбрасываем ошибку, так как таблица уже может содержать данные
          console.log("Продолжаю выполнение, игнорируя ошибку вставки данных");
        }
      }
      
      // Проверяем, что таблица действительно создалась
      try {
        console.log("Проверяю, что таблица создана...");
        const tableCheck = await connection.query('SHOW TABLES LIKE "servers"');
        if (Array.isArray(tableCheck) && tableCheck.length > 0) {
          console.log("Таблица servers существует в базе данных!");
        } else {
          console.log("Таблица servers НЕ найдена в базе данных после выполнения SQL!");
          
          // Последняя попытка - выполнить прямой SQL без экранирования
          console.log("Пробую выполнить прямой SQL-запрос без форматирования...");
          await connection.query(`
            CREATE TABLE IF NOT EXISTS servers (
              id INT UNSIGNED NOT NULL AUTO_INCREMENT,
              name VARCHAR(100) NOT NULL,
              description TEXT,
              ip VARCHAR(255) NOT NULL,
              port INT NOT NULL DEFAULT 25565,
              status VARCHAR(20) NOT NULL DEFAULT 'offline',
              auth_type VARCHAR(50) NOT NULL,
              db_host VARCHAR(255) NOT NULL,
              db_port INT NOT NULL DEFAULT 3306,
              db_user VARCHAR(100) NOT NULL,
              db_password VARCHAR(255) NOT NULL,
              db_name VARCHAR(100) NOT NULL,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY name_UNIQUE (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
          `);
          console.log("Прямой SQL-запрос выполнен!");
        }
      } catch (checkError) {
        console.error("Ошибка при проверке существования таблицы:", checkError);
      }
    } catch (error) {
      console.error('Ошибка при выполнении SQL-скрипта:');
      this.printDiagnosticInfo(error);
      throw error;
    }
  }
} 