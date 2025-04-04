-- Схема таблицы для системы авторизации EasyAuth
CREATE TABLE IF NOT EXISTS `easyauth` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `username_lower` VARCHAR(100) NOT NULL,
  `uuid` VARCHAR(36) NOT NULL,
  `data` JSON NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_lower_UNIQUE` (`username_lower`),
  UNIQUE KEY `uuid_UNIQUE` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Пример данных из бекапа
INSERT INTO `easyauth` (`id`, `username`, `username_lower`, `uuid`, `data`) VALUES
  (1, 'Illdiesoon', 'illdiesoon', 'd3e7c962-bf02-3998-9fbe-ed198471cac0', '{"password":"$2a$12$qkjIhIdDIfZMlna2QbT11OcYBLYbEjXOAZQwVCrAeCZSciQMbRGLG","last_ip":"127.0.0.1","last_authenticated_date":"2025-04-03T08:36:34.2751312+03:00[Europe/Minsk]","login_tries":0,"last_kicked_date":"1970-01-01T00:00:00Z","online_account":"FALSE","registration_date":"2025-04-02T22:32:11.1761458+03:00[Europe/Minsk]","data_version":1,"is_online":true}'); 