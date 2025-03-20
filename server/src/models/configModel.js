// Модель для работы с конфигурацией сайта
const db = require('../db');
const TABLES = require('../config/tables');

// Получить все настройки
async function getAllConfig() {
  try {
    const config = await db.query(`
      SELECT id, name, value, description, 
             DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at 
      FROM ${TABLES.CONFIG} 
      ORDER BY name
    `);
    return config;
  } catch (err) {
    console.error('Ошибка при получении настроек:', err);
    throw err;
  }
}

// Получить значение конфигурации по имени
async function getConfigByName(name) {
  try {
    const config = await db.query(`
      SELECT value 
      FROM ${TABLES.CONFIG} 
      WHERE name = ?
    `, [name]);
    
    return config.length > 0 ? config[0].value : null;
  } catch (err) {
    console.error(`Ошибка при получении настройки '${name}':`, err);
    throw err;
  }
}

// Получить несколько настроек по массиву имен
async function getConfigByNames(names) {
  try {
    if (!Array.isArray(names) || names.length === 0) {
      return {};
    }
    
    const placeholders = names.map(() => '?').join(',');
    const config = await db.query(`
      SELECT name, value 
      FROM ${TABLES.CONFIG} 
      WHERE name IN (${placeholders})
    `, names);
    
    // Преобразуем массив в объект для удобства
    const result = {};
    config.forEach(item => {
      result[item.name] = item.value;
    });
    
    return result;
  } catch (err) {
    console.error('Ошибка при получении нескольких настроек:', err);
    throw err;
  }
}

// Обновить или создать настройку
async function setConfig(name, value, description = null) {
  try {
    // Проверяем, существует ли настройка
    const exists = await db.query(`
      SELECT id FROM ${TABLES.CONFIG} WHERE name = ?
    `, [name]);
    
    if (exists.length > 0) {
      // Обновляем существующую настройку
      await db.query(`
        UPDATE ${TABLES.CONFIG} 
        SET value = ?, 
            description = COALESCE(?, description)
        WHERE name = ?
      `, [value, description, name]);
    } else {
      // Создаем новую настройку
      await db.query(`
        INSERT INTO ${TABLES.CONFIG} (name, value, description)
        VALUES (?, ?, ?)
      `, [name, value, description]);
    }
    
    return { name, value, description };
  } catch (err) {
    console.error(`Ошибка при установке настройки '${name}':`, err);
    throw err;
  }
}

// Удалить настройку
async function deleteConfig(name) {
  try {
    await db.query(`
      DELETE FROM ${TABLES.CONFIG} WHERE name = ?
    `, [name]);
    return { success: true, name };
  } catch (err) {
    console.error(`Ошибка при удалении настройки '${name}':`, err);
    throw err;
  }
}

module.exports = {
  getAllConfig,
  getConfigByName,
  getConfigByNames,
  setConfig,
  deleteConfig
}; 