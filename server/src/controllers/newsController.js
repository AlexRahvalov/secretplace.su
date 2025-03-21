// Контроллер для работы с новостями
const newsModel = require('../models/newsModel');

/**
 * Получить все новости
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
async function getAllNews(req, res) {
  try {
    const news = await newsModel.getAllNews();
    res.json(news);
  } catch (error) {
    console.error('Ошибка при получении списка новостей:', error);
    res.status(500).json({ error: 'Не удалось получить список новостей' });
  }
}

/**
 * Получить последние новости
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 * @param {number} req.params.limit - Количество новостей (по умолчанию 3)
 */
async function getLatestNews(req, res) {
  try {
    const limit = parseInt(req.params.limit) || 3;
    const news = await newsModel.getLatestNews(limit);
    res.json(news);
  } catch (error) {
    console.error('Ошибка при получении последних новостей:', error);
    res.status(500).json({ error: 'Не удалось получить последние новости' });
  }
}

/**
 * Получить новость по ID
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 * @param {string} req.params.id - ID новости
 */
async function getNewsById(req, res) {
  try {
    const id = req.params.id;
    const news = await newsModel.getNewsById(id);
    
    if (!news) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }
    
    res.json(news);
  } catch (error) {
    console.error(`Ошибка при получении новости с ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Не удалось получить новость' });
  }
}

module.exports = {
  getAllNews,
  getLatestNews,
  getNewsById
}; 