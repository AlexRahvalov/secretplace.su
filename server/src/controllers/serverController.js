// Контроллер для работы с информацией о сервере
const serverModel = require('../models/serverModel');
const { generateServerOnlineHistory } = require('../utils/serverStats');

/**
 * Получить информацию о сервере
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
async function getServerInfo(req, res) {
  try {
    const serverInfo = await serverModel.getServerInfo();
    res.json(serverInfo);
  } catch (error) {
    console.error('Ошибка при получении данных о сервере:', error);
    res.status(500).json({ error: 'Не удалось получить информацию о сервере' });
  }
}

/**
 * Получить историю онлайна сервера
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 * @param {string} req.params.period - Период (день, неделя, месяц)
 */
async function getServerHistory(req, res) {
  try {
    const period = req.params.period || 'day';
    const history = generateServerOnlineHistory(period);
    res.json(history);
  } catch (error) {
    console.error('Ошибка при получении истории онлайна сервера:', error);
    res.status(500).json({ error: 'Не удалось получить историю онлайна сервера' });
  }
}

/**
 * Получить статус сервера (онлайн/офлайн, количество игроков)
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
async function getServerStatus(req, res) {
  try {
    const status = await serverModel.getServerStatus();
    res.json(status);
  } catch (error) {
    console.error('Ошибка при получении статуса сервера:', error);
    res.status(500).json({ error: 'Не удалось получить статус сервера' });
  }
}

module.exports = {
  getServerInfo,
  getServerHistory,
  getServerStatus
}; 