import dotenv from 'dotenv';
import { DatabaseInitializer, mainDatabaseConnection, DatabaseConnection } from '../src/services/database';
import type { DatabaseConfig } from '../src/services/database';
import fs from 'fs';
import path from 'path';

// Загружаем переменные окружения
dotenv.config();

/**
 * Скрипт для инициализации баз данных
 */
async function main() {
  try {
    console.log('=== Начало инициализации баз данных ===');

    // Проверяем наличие файла .env и требуемых параметров
    const configCheck = DatabaseInitializer.checkDatabaseConfig();
    
    if (!configCheck.hasEnvFile) {
      console.error('Файл .env не найден!');
      console.error('Создайте файл .env на основе .env.example с правильными учётными данными для базы данных.');
      
      // Копируем .env.example в .env, если он существует
      const examplePath = path.join(process.cwd(), '.env.example');
      if (fs.existsSync(examplePath)) {
        const envPath = path.join(process.cwd(), '.env');
        fs.copyFileSync(examplePath, envPath);
        console.log('Создан файл .env на основе .env.example.');
        console.log('Пожалуйста, отредактируйте файл .env и укажите правильные параметры подключения к базе данных.');
      }
      
      process.exit(1);
    }
    
    if (!configCheck.hasRequiredFields) {
      console.error(`В файле .env отсутствуют следующие обязательные параметры: ${configCheck.missingFields.join(', ')}`);
      console.error('Добавьте эти параметры в файл .env и запустите скрипт снова.');
      process.exit(1);
    }

    // Конфигурация для основной базы данных сайта
    const siteDbConfig: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'secretplace',
      connectionLimit: 1,
      connectTimeout: 5000
    };

    // Выводим информацию о подключении
    DatabaseInitializer.printConnectionInfo(siteDbConfig);

    // Проверяем подключение к серверу БД
    console.log('Проверка подключения к серверу базы данных...');
    const rootConfig: DatabaseConfig = { 
      ...siteDbConfig, 
      database: '',
      connectionLimit: 1,
      connectTimeout: 5000
    };
    const tempConnection = DatabaseConnection.createServerConnection(rootConfig);
    
    const isConnected = await DatabaseInitializer.testConnection(tempConnection);
    if (!isConnected) {
      console.error('Не удалось подключиться к серверу базы данных.');
      process.exit(1);
    }
    
    console.log('Подключение к серверу базы данных установлено.');
    await tempConnection.end();

    // Инициализация базы данных сайта
    console.log('\n=== Инициализация базы данных сайта ===');
    await DatabaseInitializer.initializeSiteDatabase(siteDbConfig);

    // Проверяем, что база данных сайта создана и таблицы существуют
    console.log('\nПроверка подключения к базе данных сайта...');
    const siteConnection = DatabaseConnection.createServerConnection(siteDbConfig);
    const isMainDbConnected = await DatabaseInitializer.testConnection(siteConnection);
    
    if (isMainDbConnected) {
      console.log('Подключение к базе данных сайта успешно.');
      
      // Инициализация баз данных серверов
      console.log('\n=== Инициализация баз данных серверов ===');
      await DatabaseInitializer.initializeAllServerDatabases(siteConnection);
      await siteConnection.end();
    } else {
      console.error('Не удалось подключиться к базе данных сайта после её инициализации.');
      process.exit(1);
    }

    console.log('\n=== Инициализация баз данных успешно завершена ===');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при инициализации баз данных:', error);
    process.exit(1);
  }
}

// Запускаем скрипт
main(); 