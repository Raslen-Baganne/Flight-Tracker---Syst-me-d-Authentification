-- Migration: Ajouter les champs OpenSky à la table flights
-- Date: 2026-05-11
-- Description: Ajoute les champs pour supporter l'import depuis OpenSky Network API

USE flight_tracker;

-- Ajouter le champ source (local ou opensky)
ALTER TABLE flights ADD COLUMN source ENUM('local', 'opensky') DEFAULT 'local' AFTER status;

-- Ajouter les champs pour les données temps réel OpenSky
ALTER TABLE flights ADD COLUMN icao24 VARCHAR(20) NULL AFTER source;
ALTER TABLE flights ADD COLUMN latitude DECIMAL(10, 6) NULL AFTER icao24;
ALTER TABLE flights ADD COLUMN longitude DECIMAL(10, 6) NULL AFTER latitude;
ALTER TABLE flights ADD COLUMN altitude INT NULL AFTER longitude;
ALTER TABLE flights ADD COLUMN velocity INT NULL AFTER altitude;
ALTER TABLE flights ADD COLUMN heading INT NULL AFTER velocity;
ALTER TABLE flights ADD COLUMN on_ground BOOLEAN DEFAULT NULL AFTER heading;
ALTER TABLE flights ADD COLUMN last_position_update TIMESTAMP NULL AFTER on_ground;

-- Vérifier la structure mise à jour
DESCRIBE flights;
