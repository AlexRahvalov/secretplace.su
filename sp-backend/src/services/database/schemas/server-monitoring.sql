-- Добавление полей для мониторинга в таблицу servers
ALTER TABLE `servers` 
ADD COLUMN `online_players` INT DEFAULT 0,
ADD COLUMN `max_players` INT DEFAULT 0,
ADD COLUMN `version` VARCHAR(50) DEFAULT NULL,
ADD COLUMN `motd` TEXT DEFAULT NULL,
ADD COLUMN `latency` INT DEFAULT 0,
ADD COLUMN `last_ping` TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN `last_online` TIMESTAMP NULL DEFAULT NULL; 