// Модель для работы с новостями
const db = require('../db');
const TABLES = require('../config/tables');

// Получить все новости
async function getAllNews() {
  try {
    const news = await db.query(`
      SELECT id, title, excerpt, content, author, 
             DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') as date, 
             image_url 
      FROM ${TABLES.NEWS} 
      WHERE is_published = TRUE 
      ORDER BY date DESC
    `);
    return news;
  } catch (err) {
    console.error('Ошибка при получении новостей:', err);
    throw err;
  }
}

// Получить последние новости (ограниченное количество)
async function getLatestNews(limit = 5) {
  try {
    const news = await db.query(`
      SELECT id, title, excerpt, author, 
             DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') as date, 
             image_url 
      FROM ${TABLES.NEWS} 
      WHERE is_published = TRUE 
      ORDER BY date DESC 
      LIMIT ?
    `, [limit]);
    return news;
  } catch (err) {
    console.error('Ошибка при получении последних новостей:', err);
    throw err;
  }
}

// Получить новость по ID
async function getNewsById(id) {
  try {
    const news = await db.query(`
      SELECT id, title, content, excerpt, author, 
             DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') as date, 
             image_url 
      FROM ${TABLES.NEWS} 
      WHERE id = ? AND is_published = TRUE
    `, [id]);
    
    return news.length > 0 ? news[0] : null;
  } catch (err) {
    console.error(`Ошибка при получении новости с ID ${id}:`, err);
    throw err;
  }
}

// Добавить новость
async function addNews(newsData) {
  try {
    const result = await db.query(`
      INSERT INTO ${TABLES.NEWS} (title, content, excerpt, author, image_url)
      VALUES (?, ?, ?, ?, ?)
    `, [
      newsData.title,
      newsData.content,
      newsData.excerpt || newsData.content.substring(0, 200) + '...',
      newsData.author,
      newsData.image_url || null
    ]);
    
    return { id: result.insertId, ...newsData };
  } catch (err) {
    console.error('Ошибка при добавлении новости:', err);
    throw err;
  }
}

// Обновить новость
async function updateNews(id, newsData) {
  try {
    await db.query(`
      UPDATE ${TABLES.NEWS} 
      SET title = ?, 
          content = ?, 
          excerpt = ?, 
          author = ?, 
          image_url = ?
      WHERE id = ?
    `, [
      newsData.title,
      newsData.content,
      newsData.excerpt || newsData.content.substring(0, 200) + '...',
      newsData.author,
      newsData.image_url || null,
      id
    ]);
    
    return { id, ...newsData };
  } catch (err) {
    console.error(`Ошибка при обновлении новости с ID ${id}:`, err);
    throw err;
  }
}

// Удалить новость
async function deleteNews(id) {
  try {
    await db.query(`DELETE FROM ${TABLES.NEWS} WHERE id = ?`, [id]);
    return { success: true, id };
  } catch (err) {
    console.error(`Ошибка при удалении новости с ID ${id}:`, err);
    throw err;
  }
}

module.exports = {
  getAllNews,
  getLatestNews,
  getNewsById,
  addNews,
  updateNews,
  deleteNews
}; 