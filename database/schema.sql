CREATE DATABASE IF NOT EXISTS floodguard_isef CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE floodguard_isef;

CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_en VARCHAR(120) NOT NULL,
  name_ar VARCHAR(120) NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  is_governorate TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_location (name_en, latitude, longitude)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS weather_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_id INT NOT NULL,
  fetched_at DATETIME NOT NULL,
  forecast_hours INT,
  elevation_m DECIMAL(8,2) NULL,
  total_rain_mm DECIMAL(8,2) NULL,
  max_intensity_mm_h DECIMAL(8,2) NULL,
  rain_hours INT NULL,
  max_precip_prob INT NULL,
  soil_moisture_max DECIMAL(6,4) NULL,
  source VARCHAR(80) NOT NULL,
  payload JSON NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  INDEX idx_w_loc (location_id, id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS risk_assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_id INT NOT NULL,
  score DECIMAL(5,1) NULL,
  level ENUM('low','moderate','high','insufficient') NOT NULL,
  reliability ENUM('high','medium','low') NOT NULL,
  input_source ENUM('api','manual','mixed','demo') NOT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  label VARCHAR(120) NULL,
  inputs JSON NOT NULL,
  breakdown JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  INDEX idx_a_loc (location_id, is_demo, id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_id INT NOT NULL,
  assessment_id INT NULL,
  severity ENUM('moderate','high') NOT NULL,
  message_en VARCHAR(255) NOT NULL,
  message_ar VARCHAR(255) NOT NULL,
  recommendations JSON NOT NULL,
  origin VARCHAR(80) NOT NULL DEFAULT 'FloodGuard (project-generated, NOT official)',
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (assessment_id) REFERENCES risk_assessments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  skey VARCHAR(40) PRIMARY KEY,
  svalue VARCHAR(40) NOT NULL
) ENGINE=InnoDB;
