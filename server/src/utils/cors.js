// Утилиты для обработки CORS

/**
 * Устанавливает CORS заголовки для ответа
 * @param {Object} res - Объект ответа HTTP
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
}

module.exports = {
  setCorsHeaders
}; 