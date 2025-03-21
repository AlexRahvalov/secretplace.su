// Контроллер для работы с информацией о сервере
const serverModel = require('../models/serverModel');
const serverStatus = require('../models/serverStatus');
const { createNotFoundError, createValidationError } = require('../utils/ErrorHandler');

/**
 * Получить информацию о сервере
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 * @param {Function} next - Функция next для передачи управления следующему middleware
 */
async function getServerInfo(req, res, next) {
  try {
    // Получаем ID сервера из query параметра
    const serverId = parseInt(req.query.id);
    
    if (!serverId || isNaN(serverId)) {
      throw createValidationError('Не указан корректный ID сервера');
    }
    
    // Получаем информацию о сервере
    const server = await serverModel.getServerById(serverId);
    
    if (!server) {
      throw createNotFoundError(`Сервер с ID ${serverId} не найден`, 'server');
    }
    
    // Возвращаем информацию о сервере
    res.sendSuccess(server, 'Информация о сервере успешно получена');
  } catch (error) {
    next(error);
  }
}

/**
 * Получить историю онлайна сервера
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 * @param {Function} next - Функция next для передачи управления следующему middleware
 */
async function getServerHistory(req, res, next) {
  try {
    // Получаем ID сервера из query параметра (по умолчанию 1)
    const serverId = parseInt(req.query.id || 1);
    
    // Получаем параметр периода
    const period = req.params.period || 'day';
    
    // Проверяем, что период корректный
    const validPeriods = ['day', 'week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      throw createValidationError(
        'Некорректный период. Допустимые значения: day, week, month, year',
        { parameter: 'period', received: period, allowed: validPeriods }
      );
    }
    
    // Получаем историю сервера
    const history = await serverModel.getServerHistory(serverId, period);
    
    // Возвращаем историю сервера
    res.sendSuccess(history, `История сервера за период ${period} успешно получена`);
  } catch (error) {
    next(error);
  }
}

/**
 * Получить текущий статус сервера
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 * @param {Function} next - Функция next для передачи управления следующему middleware
 */
async function getServerStatus(req, res, next) {
  try {
    // Получаем ID сервера из query параметра
    const serverId = parseInt(req.query.id);
    
    if (!serverId || isNaN(serverId)) {
      throw createValidationError('Не указан корректный ID сервера');
    }
    
    // Получаем текущий статус сервера из нового модуля
    const status = await serverStatus.getServerStatus(serverId);
    
    if (!status) {
      throw createNotFoundError(`Статус сервера с ID ${serverId} не найден`, 'server_status');
    }
    
    // Возвращаем статус сервера
    res.sendSuccess(status, 'Статус сервера успешно получен');
  } catch (error) {
    console.error('Ошибка при получении статуса сервера:', error);
    next(error);
  }
}

/**
 * Обновить конфигурацию сервера
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 * @param {Function} next - Функция next для передачи управления следующему middleware
 */
async function updateServerConfig(req, res, next) {
  try {
    const serverId = parseInt(req.query.id);
    const configData = req.body;
    
    if (!serverId || isNaN(serverId)) {
      throw createValidationError('Не указан корректный ID сервера');
    }
    
    if (!configData || Object.keys(configData).length === 0) {
      throw createValidationError('Не предоставлены данные для обновления');
    }
    
    const updatedServer = await serverModel.updateServerConfig(serverId, configData);
    
    if (!updatedServer) {
      throw createNotFoundError(`Сервер с ID ${serverId} не найден`, 'server');
    }
    
    res.sendSuccess(updatedServer, 'Конфигурация сервера успешно обновлена');
  } catch (error) {
    next(error);
  }
}

/**
 * Получить основной сервер
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 * @param {Function} next - Функция next для передачи управления следующему middleware
 */
async function getMainServer(req, res, next) {
  try {
    // Получаем основной сервер
    const server = await serverModel.getMainServer();
    
    if (!server) {
      throw createNotFoundError('Основной сервер не найден', 'server');
    }
    
    // Возвращаем информацию об основном сервере
    res.sendSuccess(server, 'Основной сервер успешно получен');
  } catch (error) {
    next(error);
  }
}

// Экспортируем функции
module.exports = {
  getMainServer,
  getServerInfo,
  getServerHistory,
  getServerStatus,
  updateServerConfig
}; 