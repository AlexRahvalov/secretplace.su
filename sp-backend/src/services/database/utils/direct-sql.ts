/**
 * Константа с SQL-запросом для создания таблицы servers
 */
export const CREATE_SERVERS_TABLE = `
CREATE TABLE IF NOT EXISTS \`servers\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(100) NOT NULL,
  \`description\` TEXT,
  \`ip\` VARCHAR(255) NOT NULL,
  \`port\` INT NOT NULL DEFAULT 25565,
  \`status\` VARCHAR(20) NOT NULL DEFAULT 'offline',
  \`auth_type\` VARCHAR(50) NOT NULL,
  \`db_host\` VARCHAR(255) NOT NULL,
  \`db_port\` INT NOT NULL DEFAULT 3306,
  \`db_user\` VARCHAR(100) NOT NULL,
  \`db_password\` VARCHAR(255) NOT NULL,
  \`db_name\` VARCHAR(100) NOT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`name_UNIQUE\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

/**
 * Константа с SQL-запросом для вставки тестового сервера
 * Не используется в текущей версии
 */
export const INSERT_TEST_SERVER = `-- Вставка тестовых данных отключена`; 