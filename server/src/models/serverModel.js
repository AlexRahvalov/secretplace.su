// Модель для работы с серверами
const db = require('../db/index');
const TABLES = require('../config/tables');

/**
 * Получить список всех серверов
 * @returns {Promise<Array>} Массив серверов
 */
async function getAllServers() {
  try {
    return await db.query(`
      SELECT id, server_name, ip, query_port, description, created_at, updated_at
      FROM ${TABLES.SERVERS}
      ORDER BY id ASC
    `);
  } catch (error) {
    console.error('Ошибка при получении списка серверов:', error);
    throw error;
  }
}

/**
 * Получить сервер по ID
 * @param {number} id ID сервера
 * @returns {Promise<Object|null>} Информация о сервере или null, если сервер не найден
 */
async function getServerById(id) {
  try {
    const servers = await db.query(`
      SELECT id, server_name, ip, query_port, description, created_at, updated_at
      FROM ${TABLES.SERVERS}
      WHERE id = ?
    `, [id]);
    
    return servers.length > 0 ? servers[0] : null;
  } catch (error) {
    console.error('Ошибка при получении сервера по ID:', error);
    throw error;
  }
}

/**
 * Получить основной сервер (первый в списке)
 * @returns {Promise<Object|null>} Информация об основном сервере или null, если серверов нет
 */
async function getMainServer() {
  try {
    const servers = await db.query(`
      SELECT id, server_name, ip, query_port, description, created_at, updated_at
      FROM ${TABLES.SERVERS}
      ORDER BY id ASC
      LIMIT 1
    `);
    
    return servers.length > 0 ? servers[0] : null;
  } catch (error) {
    console.error('Ошибка при получении основного сервера:', error);
    throw error;
  }
}

/**
 * Добавить новый сервер
 * @param {Object} serverData Данные сервера
 * @returns {Promise<Object>} Результат операции
 */
async function addServer(serverData) {
  try {
    // Проверяем наличие обязательных полей
    if (!serverData.server_name || !serverData.ip) {
      throw new Error('Не указаны обязательные поля: имя сервера и IP-адрес');
    }
    
    // Устанавливаем порт по умолчанию, если не указан
    const queryPort = serverData.query_port || 25565;
    
    const result = await db.query(`
      INSERT INTO ${TABLES.SERVERS} 
      (server_name, ip, query_port, rcon_port, rcon_password, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      serverData.server_name,
      serverData.ip,
      queryPort,
      serverData.rcon_port || null,
      serverData.rcon_password || null,
      serverData.description || null
    ]);
    
    return {
      success: true,
      id: result.insertId,
      message: 'Сервер успешно добавлен'
    };
  } catch (error) {
    console.error('Ошибка при добавлении сервера:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Обновить информацию о сервере
 * @param {number} id ID сервера
 * @param {Object} serverData Новые данные сервера
 * @returns {Promise<Object>} Результат операции
 */
async function updateServer(id, serverData) {
  try {
    // Проверяем существование сервера
    const server = await getServerById(id);
    if (!server) {
      return {
        success: false,
        error: 'Сервер не найден'
      };
    }
    
    // Обновляем данные
    await db.query(`
      UPDATE ${TABLES.SERVERS}
      SET server_name = ?, ip = ?, query_port = ?, rcon_port = ?, 
          rcon_password = ?, description = ?
      WHERE id = ?
    `, [
      serverData.server_name || server.server_name,
      serverData.ip || server.ip,
      serverData.query_port || server.query_port,
      serverData.rcon_port !== undefined ? serverData.rcon_port : server.rcon_port,
      serverData.rcon_password !== undefined ? serverData.rcon_password : server.rcon_password,
      serverData.description !== undefined ? serverData.description : server.description,
      id
    ]);
    
    return {
      success: true,
      message: 'Информация о сервере обновлена'
    };
  } catch (error) {
    console.error('Ошибка при обновлении сервера:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Удалить сервер
 * @param {number} id ID сервера
 * @returns {Promise<Object>} Результат операции
 */
async function deleteServer(id) {
  try {
    // Проверяем существование сервера
    const server = await getServerById(id);
    if (!server) {
      return {
        success: false,
        error: 'Сервер не найден'
      };
    }
    
    // Удаляем сервер
    await db.query(`
      DELETE FROM ${TABLES.SERVERS}
      WHERE id = ?
    `, [id]);
    
    return {
      success: true,
      message: 'Сервер успешно удален'
    };
  } catch (error) {
    console.error('Ошибка при удалении сервера:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getAllServers,
  getServerById,
  getMainServer,
  addServer,
  updateServer,
  deleteServer
}; 