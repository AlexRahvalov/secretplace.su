-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Хост: localhost:3306
-- Время создания: Мар 20 2025 г., 17:03
-- Версия сервера: 10.11.8-MariaDB-0ubuntu0.24.04.1
-- Версия PHP: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `secretplace_fabric`
--

-- --------------------------------------------------------

--
-- Структура таблицы `easyauth`
--

CREATE TABLE `easyauth` (
  `id` int(11) NOT NULL,
  `uuid` varchar(36) NOT NULL,
  `username` varchar(255) NOT NULL,
  `username_lower` varchar(255) NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `easyauth`
--

INSERT INTO `easyauth` (`id`, `uuid`, `username`, `username_lower`, `data`) VALUES
(20674, 'd3e7c962-bf02-3998-9fbe-ed198471cac0', 'Illdiesoon', 'illdiesoon', '{\"username\":\"Illdiesoon\",\"username_lowercase\":\"illdiesoon\",\"display_name\":\"Illdiesoon\",\"password\":\"$argon2i$v\\u003d19$m\\u003d65536,t\\u003d10,p\\u003d1$dpzkCwdxKNS4OQI6qfSOzA$vAVpbWMJapQc6VLQgERDmIyhK3utoB3VMkXZuy5IZZU\",\"last_ip\":\"178.121.28.21\",\"last_authenticated_date\":\"2025-03-14T21:03:08.34595326Z[Etc/UTC]\",\"login_tries\":0,\"last_kicked_date\":\"1970-01-01T00:00:00Z\",\"online_account\":\"UNKNOWN\",\"registration_date\":\"2025-03-14T06:57:03.446903894Z[Etc/UTC]\",\"data_version\":1}')

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `easyauth`
--
ALTER TABLE `easyauth`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `easyauth`
--
ALTER TABLE `easyauth`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20706;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
