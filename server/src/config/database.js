// Конфигурация базы данных
module.exports = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'secretplace',
  port: process.env.DB_PORT || 3306,
  connectionLimit: 10
}; 