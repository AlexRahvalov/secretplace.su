-- --------------------------------------------------------
-- Хост:                         127.0.0.1
-- Версия сервера:               11.5.2-MariaDB - mariadb.org binary distribution
-- Операционная система:         Win64
-- HeidiSQL Версия:              12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Дамп данных таблицы test_server.easyauth: ~1 rows (приблизительно)
INSERT INTO `easyauth` (`id`, `username`, `username_lower`, `uuid`, `data`) VALUES
	(1, 'Illdiesoon', 'illdiesoon', 'd3e7c962-bf02-3998-9fbe-ed198471cac0', '{"password":"$2a$12$qkjIhIdDIfZMlna2QbT11OcYBLYbEjXOAZQwVCrAeCZSciQMbRGLG","last_ip":"127.0.0.1","last_authenticated_date":"2025-04-03T08:36:34.2751312+03:00[Europe/Minsk]","login_tries":0,"last_kicked_date":"1970-01-01T00:00:00Z","online_account":"FALSE","registration_date":"2025-04-02T22:32:11.1761458+03:00[Europe/Minsk]","data_version":1,"is_online":true}');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
