// Константы таблиц из .env
module.exports = {
  NEWS: process.env.TABLE_NEWS || 'news',
  CONFIG: process.env.TABLE_CONFIG || 'site_config',
  TELEGRAM_AUTH: process.env.TABLE_TELEGRAM_AUTH || 'easyauth_telegram'
}; 