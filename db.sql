-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.32 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.4.0.6659
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for active_notray
CREATE DATABASE IF NOT EXISTS `active_notray` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `active_notray`;

-- Dumping structure for table active_notray.books
CREATE TABLE IF NOT EXISTS `books` (
  `book_no` int NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`book_no`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table active_notray.books: ~1 rows (approximately)
INSERT INTO `books` (`book_no`, `created_at`, `updated_at`, `status`) VALUES
	(1, '2025-09-13 18:09:09', '2025-09-13 18:09:09', 'active');

-- Dumping structure for table active_notray.documents
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` varchar(50) DEFAULT NULL,
  `document_name` varchar(50) DEFAULT NULL,
  `document_link` varchar(500) DEFAULT NULL,
  `description` text,
  `user_id` int DEFAULT NULL,
  `doc_serial` int DEFAULT NULL,
  `book_no` int DEFAULT NULL,
  `serial_number` varchar(50) DEFAULT NULL,
  `total` decimal(20,6) DEFAULT NULL,
  `paid` decimal(20,6) DEFAULT NULL,
  `balance` decimal(20,6) DEFAULT NULL,
  `customer_name` varchar(50) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table active_notray.documents: ~0 rows (approximately)
INSERT INTO `documents` (`id`, `template_id`, `document_name`, `document_link`, `description`, `user_id`, `doc_serial`, `book_no`, `serial_number`, `total`, `paid`, `balance`, `customer_name`, `customer_phone`, `created_at`, `updated_at`) VALUES
	(5, '7f14e893-a9cd-42b7-b6a1-b66161f0b974', 'REP._B1_1_2025.docx', 'D:\\active-ict\\code-with-ai\\active-notary\\backend\\documents\\REP._B1_1_2025.docx', '111', NULL, 1, 1, 'REP. B1/1/2025', 11.000000, NULL, NULL, '11', '11', '2025-09-15 18:11:46', '2025-09-15 18:11:46');

-- Dumping structure for table active_notray.document_templates
CREATE TABLE IF NOT EXISTS `document_templates` (
  `template_id` varchar(255) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `template_path` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table active_notray.document_templates: ~1 rows (approximately)
INSERT INTO `document_templates` (`template_id`, `template_name`, `template_path`, `created_at`) VALUES
	('7f14e893-a9cd-42b7-b6a1-b66161f0b974', 'Base Template', 'D:\\active-ict\\code-with-ai\\active-notary\\backend\\uploads\\templates\\1756838836766-75465574-template1.docx', '2025-09-02 18:47:16');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
