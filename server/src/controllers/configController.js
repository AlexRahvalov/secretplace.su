// Контроллер для работы с конфигурацией сайта
const configModel = require('../models/configModel');

/**
 * Получить все конфигурации сайта
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
async function getConfig(req, res) {
  try {
    const config = await configModel.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Ошибка при получении настроек сайта:', error);
    res.status(500).json({ error: 'Не удалось получить настройки сайта' });
  }
}

/**
 * Получить одну конфигурацию по имени
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 * @param {string} req.params.name - Имя конфигурации
 */
async function getConfigByName(req, res) {
  try {
    const name = req.params.name;
    const config = await configModel.getConfigByName(name);
    
    if (!config) {
      return res.status(404).json({ error: 'Конфигурация не найдена' });
    }
    
    res.json(config);
  } catch (error) {
    console.error(`Ошибка при получении конфигурации ${req.params.name}:`, error);
    res.status(500).json({ error: 'Не удалось получить конфигурацию' });
  }
}

module.exports = {
  getConfig,
  getConfigByName
}; 