-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Хост: localhost:3306
-- Время создания: Мар 20 2025 г., 18:41
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
-- Структура таблицы `easyauth_telegram`
--

CREATE TABLE `easyauth_telegram` (
  `username` varchar(255) NOT NULL,
  `code` varchar(255) DEFAULT NULL,
  `code_expires_at` varchar(255) DEFAULT NULL,
  `telegram_id` bigint(20) DEFAULT NULL,
  `linked_at` varchar(255) DEFAULT NULL,
  `link_attempts_today` int(11) DEFAULT NULL,
  `attempts_reset_at` varchar(255) DEFAULT NULL,
  `json_data` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `easyauth_telegram`
--

INSERT INTO `easyauth_telegram` (`username`, `code`, `code_expires_at`, `telegram_id`, `linked_at`, `link_attempts_today`, `attempts_reset_at`, `json_data`) VALUES
('Illdiesoon', '', '1970-01-01T00:00Z', 620385503, '2025-03-14T07:00:48.746302877Z[Etc/UTC]', 1, '2025-03-14T19:00:38.432095329Z[Etc/UTC]', '{\"username\":\"Illdiesoon\",\"code\":\"\",\"code_expires_at\":\"1970-01-01T00:00:00Z\",\"telegram_id\":620385503,\"linked_at\":\"2025-03-14T07:00:48.746302877Z[Etc/UTC]\",\"link_attempts_today\":1,\"attempts_reset_at\":\"2025-03-14T19:00:38.432095329Z[Etc/UTC]\"}'),
('Shadow', '', '1970-01-01T00:00Z', 1440957657, '2025-03-14T08:15:16.224664610Z[Etc/UTC]', 1, '2025-03-14T20:14:51.510465329Z[Etc/UTC]', '{\"username\":\"Shadow\",\"code\":\"\",\"code_expires_at\":\"1970-01-01T00:00:00Z\",\"telegram_id\":1440957657,\"linked_at\":\"2025-03-14T08:15:16.22466461Z[Etc/UTC]\",\"link_attempts_today\":1,\"attempts_reset_at\":\"2025-03-14T20:14:51.510465329Z[Etc/UTC]\"}');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `easyauth_telegram`
--
ALTER TABLE `easyauth_telegram`
  ADD PRIMARY KEY (`username`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
