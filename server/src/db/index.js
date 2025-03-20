// Модуль для работы с базой данных
const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/database');
const TABLES = require('../config/tables');

// Создаем пул соединений
const pool = mariadb.createPool(dbConfig);

// Функция для выполнения SQL запросов
async function query(sql, params) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(sql, params);
    return rows;
  } catch (err) {
    console.error('Ошибка выполнения запроса:', err);
    throw err;
  } finally {
    if (conn) conn.release(); // Возвращаем соединение в пул
  }
}

// Проверка соединения с базой данных
async function testConnection() {
  try {
    await query('SELECT 1 as test');
    console.log('✅ Соединение с базой данных установлено');
    return true;
  } catch (err) {
    console.error('❌ Ошибка соединения с базой данных:', err);
    return false;
  }
}

// Инициализация базы данных
async function initDatabase() {
  console.log('Инициализация базы данных...');
  
  try {
    // Создаем базу данных, если она не существует
    try {
      await pool.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      console.log(`База данных ${dbConfig.database} создана или уже существует`);
    } catch (err) {
      console.error('Ошибка при создании базы данных:', err);
    }
    
    // Выбираем созданную базу данных
    await pool.query(`USE ${dbConfig.database}`);
    
    // Создаем таблицы, если они не существуют
    await createTables();
    
    return true;
  } catch (err) {
    console.error('Ошибка инициализации базы данных:', err);
    return false;
  }
}

// Создание необходимых таблиц
async function createTables() {
  // Создаем таблицу новостей
  await query(`
    CREATE TABLE IF NOT EXISTS ${TABLES.NEWS} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      excerpt VARCHAR(500),
      author VARCHAR(100) NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      image_url VARCHAR(255),
      is_published BOOLEAN DEFAULT TRUE
    )
  `);
  console.log(`✅ Таблица ${TABLES.NEWS} создана или уже существует`);
  
  // Проверяем, есть ли записи в таблице новостей
  const newsCount = await query(`SELECT COUNT(*) as count FROM ${TABLES.NEWS}`);
  
  // Если новостей нет, добавляем демо-данные
  if (newsCount[0].count === 0) {
    await addDemoNews();
  }
  
  // Создаем таблицу конфигурации сайта
  await query(`
    CREATE TABLE IF NOT EXISTS ${TABLES.CONFIG} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description VARCHAR(255),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log(`✅ Таблица ${TABLES.CONFIG} создана или уже существует`);
  
  // Проверяем, есть ли записи в таблице конфигурации
  const configCount = await query(`SELECT COUNT(*) as count FROM ${TABLES.CONFIG}`);
  
  // Если конфигураций нет, добавляем базовые настройки
  if (configCount[0].count === 0) {
    await addDefaultConfig();
  } else {
    // Если конфигурации уже есть, проверяем наличие новых настроек и обновляем существующие
    await updateDefaultConfigs();
  }
}

// Добавление демо-новостей
async function addDemoNews() {
  console.log('Добавление демо-новостей...');
  
  const demoNews = [
    {
      title: 'Открытие сервера SecretPlace.su',
      content: '<p>Мы рады сообщить об официальном открытии нашего сервера! Приглашаем всех игроков присоединиться к нашему сообществу и исследовать уникальный мир Minecraft.</p><p>На нашем сервере вы найдете дружелюбное сообщество, интересные события и захватывающие приключения.</p>',
      excerpt: 'Мы рады сообщить об официальном открытии нашего сервера!',
      author: 'Администратор',
      date: new Date().toISOString().slice(0, 19).replace('T', ' ')
    },
    {
      title: 'Обновление сервера до версии 0.0.2.0',
      content: '<p>Мы выпустили новое обновление, которое включает множество улучшений:</p><ul><li>Реализована интеграция с базой данных MariaDB</li><li>Улучшена структура серверной части</li><li>Исправлены API-эндпоинты</li><li>Добавлена автоматическая инициализация БД</li></ul><p>Обновление уже доступно всем игрокам!</p>',
      excerpt: 'Мы выпустили новое обновление с улучшенной производительностью и стабильностью.',
      author: 'Администратор',
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 19).replace('T', ' ') // вчера
    }
  ];
  
  for (const news of demoNews) {
    await query(`
      INSERT INTO ${TABLES.NEWS} (title, content, excerpt, author, date)
      VALUES (?, ?, ?, ?, ?)
    `, [news.title, news.content, news.excerpt, news.author, news.date]);
  }
  
  console.log('✅ Демо-новости добавлены');
}

// Добавление базовых конфигураций сайта
async function addDefaultConfig() {
  console.log('Добавление базовых конфигураций сайта...');
  
  const defaultConfigs = [
    {
      name: 'site_name',
      value: 'SecretPlace.su',
      description: 'Название сайта'
    },
    {
      name: 'site_description',
      value: 'Уютный Minecraft сервер с дружелюбным сообществом',
      description: 'Описание сайта'
    },
    {
      name: 'minecraft_server_ip',
      value: 'play.secretplace.su',
      description: 'IP-адрес Minecraft сервера'
    },
    {
      name: 'minecraft_server_port',
      value: '25565',
      description: 'Порт Minecraft сервера'
    },
    // Настройки системы авторизации
    {
      name: 'auth_default_adapter',
      value: 'easyauth',
      description: 'Адаптер авторизации по умолчанию (easyauth, authme и т.д.)'
    },
    {
      name: 'auth_enable_multiple_adapters',
      value: 'true',
      description: 'Разрешить использование нескольких адаптеров авторизации'
    },
    // Обновленные/дополненные контактные данные с полными URL
    {
      name: 'contact_discord',
      value: 'https://discord.com/invite/Q9sSfEpZrb',
      description: 'Ссылка на Discord сервер'
    },
    {
      name: 'contact_telegram',
      value: 'https://t.me/+VlOy7UKB6Ng2ZTdi',
      description: 'Ссылка на Telegram канал/группу'
    },
    {
      name: 'contact_email',
      value: 'info@secretplace.su',
      description: 'Email для связи'
    },
    {
      name: 'maintenance_mode',
      value: 'false',
      description: 'Режим технического обслуживания (true/false)'
    }
  ];
  
  // Получаем существующие конфигурации
  const existingConfigs = await query(`SELECT name FROM ${TABLES.CONFIG}`);
  const existingConfigNames = existingConfigs.map(config => config.name);
  
  // Для каждой конфигурации из списка
  for (const config of defaultConfigs) {
    // Проверяем, существует ли уже такая конфигурация
    if (existingConfigNames.includes(config.name)) {
      // Если конфигурация уже существует, пропускаем или можно обновить
      console.log(`Конфигурация ${config.name} уже существует`);
    } else {
      // Если конфигурации нет, добавляем ее
      await query(`
        INSERT INTO ${TABLES.CONFIG} (name, value, description)
        VALUES (?, ?, ?)
      `, [config.name, config.value, config.description]);
      
      console.log(`✅ Добавлена конфигурация: ${config.name}`);
    }
  }
  
  console.log('✅ Базовые конфигурации проверены/добавлены');
}

// Функция для обновления конфигураций и добавления отсутствующих
async function updateDefaultConfigs() {
  console.log('Проверка и обновление конфигураций сайта...');
  
  const defaultConfigs = [
    // Настройки системы авторизации
    {
      name: 'auth_default_adapter',
      value: 'easyauth',
      description: 'Адаптер авторизации по умолчанию (easyauth, authme и т.д.)'
    },
    {
      name: 'auth_enable_multiple_adapters',
      value: 'true',
      description: 'Разрешить использование нескольких адаптеров авторизации'
    },
    // Контактные данные с полными URL
    {
      name: 'contact_discord',
      value: 'https://discord.com/invite/Q9sSfEpZrb',
      description: 'Ссылка на Discord сервер'
    },
    {
      name: 'contact_telegram',
      value: 'https://t.me/+VlOy7UKB6Ng2ZTdi',
      description: 'Ссылка на Telegram канал/группу'
    },
    {
      name: 'contact_email',
      value: 'info@secretplace.su',
      description: 'Email для связи'
    }
  ];
  
  // Получаем существующие конфигурации
  const existingConfigs = await query(`SELECT name FROM ${TABLES.CONFIG}`);
  const existingConfigNames = existingConfigs.map(config => config.name);
  
  // Для каждой конфигурации из списка
  for (const config of defaultConfigs) {
    // Проверяем, существует ли уже такая конфигурация
    if (existingConfigNames.includes(config.name)) {
      // Обновляем существующую конфигурацию только для настроек авторизации и контактов
      if (config.name.startsWith('auth_') || config.name.startsWith('contact_')) {
        await query(`
          UPDATE ${TABLES.CONFIG} 
          SET value = ?, description = ?
          WHERE name = ?
        `, [config.value, config.description, config.name]);
        console.log(`✅ Обновлена конфигурация: ${config.name}`);
      }
    } else {
      // Если конфигурации нет, добавляем ее
      await query(`
        INSERT INTO ${TABLES.CONFIG} (name, value, description)
        VALUES (?, ?, ?)
      `, [config.name, config.value, config.description]);
      console.log(`✅ Добавлена новая конфигурация: ${config.name}`);
    }
  }
  
  console.log('✅ Конфигурации проверены и обновлены');
}

module.exports = {
  query,
  testConnection,
  initDatabase,
  createTables
}; 