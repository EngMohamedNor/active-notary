-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.43 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping data for table active_notray.books: ~1 rows (approximately)
INSERT INTO `books` (`book_no`, `created_at`, `updated_at`, `status`) VALUES
	(1, '2025-09-13 18:09:09', '2025-09-13 18:09:09', 'active');

-- Dumping data for table active_notray.documents: ~1 rows (approximately)
INSERT INTO `documents` (`id`, `template_id`, `document_name`, `document_link`, `description`, `user_id`, `doc_serial`, `book_no`, `serial_number`, `total`, `paid`, `balance`, `customer_name`, `customer_phone`, `created_at`, `updated_at`) VALUES
	(7, '42180e8d-d4a2-43f6-9b5d-67d8d357f801', 'REP._B1_3_2025.docx', 'REP._B1_3_2025.docx', 'ww', NULL, 3, 1, 'REP. B1/3/2025', 55.000000, NULL, NULL, 'ww3', '33', '2025-09-18 09:28:33', '2025-09-18 09:28:33');

-- Dumping data for table active_notray.document_templates: ~1 rows (approximately)
INSERT INTO `document_templates` (`template_id`, `template_name`, `template_path`, `created_at`, `category`, `sub_category`) VALUES
	('862f4132-1a8e-4da7-8d1a-01715b7e1feb', 'Template', '1758188385307-700252909-temp.docx', '2025-09-18 09:39:45', 'Legal Documents', 'Reports'),
	('a5103dd5-95e2-4317-98f8-774069bcd6cb', 'Templatewww', '1758188454957-742640261-temp.docx', '2025-09-18 09:40:54', 'Educational Documents', 'Applications'),
	('d10e78f4-86a6-45d1-8c7e-2e8d99ec2c43', 'New Tempxxx', '1758188437816-765913489-temp.docx', '2025-09-18 09:40:37', 'Government Forms', 'Forms'),
	('fce9563f-5582-46e2-9cfb-f92dbd924e5b', 'Temo 222', '1758188420479-447670408-temp.docx', '2025-09-18 09:40:20', 'Business Documents', 'Applications');

-- Dumping data for table active_notray.users: ~0 rows (approximately)
INSERT INTO `users` (`user_id`, `username`, `password`, `email`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
	('c88362ed-5182-459e-94c3-1c1f44554244', 'admin', '$2a$10$FNfzeQGeP23u/bMG.bn1fubjf6hSIeJJjMSqYOQO5tE45aiUNQKd6', 'admin@example.com', 'admin', 1, '2025-09-18 11:47:05', '2025-09-18 11:47:05');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
