-- Création de la base de données
CREATE DATABASE IF NOT EXISTS flight_tracker;
USE flight_tracker;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    oauth_provider VARCHAR(50) NULL, -- 'google', 'facebook', ou NULL pour inscription normale
    oauth_id VARCHAR(255) NULL, -- ID du fournisseur OAuth
    avatar_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Index pour améliorer les performances
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_oauth ON users(oauth_provider, oauth_id);

-- Insertion d'un utilisateur admin par défaut (mot de passe: admin123)
INSERT INTO users (first_name, last_name, email, password, role) 
VALUES ('Admin', 'System', 'admin@flighttracker.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insertion d'un utilisateur test par défaut (mot de passe: user123)
INSERT INTO users (first_name, last_name, email, password, role) 
VALUES ('User', 'Test', 'user@flighttracker.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

-- Table des pays
CREATE TABLE IF NOT EXISTS countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(3) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des vols
CREATE TABLE IF NOT EXISTS flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL UNIQUE,
    airline VARCHAR(100) NOT NULL,
    departure_city VARCHAR(100) NOT NULL,
    arrival_city VARCHAR(100) NOT NULL,
    departure_country_id INT,
    arrival_country_id INT,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available_seats INT NOT NULL DEFAULT 100,
    total_seats INT NOT NULL DEFAULT 100,
    status ENUM('scheduled', 'delayed', 'cancelled', 'completed') DEFAULT 'scheduled',
    source ENUM('local', 'opensky') DEFAULT 'local',
    -- Champs pour données temps réel OpenSky
    icao24 VARCHAR(20) NULL,
    latitude DECIMAL(10, 6) NULL,
    longitude DECIMAL(10, 6) NULL,
    altitude INT NULL,
    velocity INT NULL,
    heading INT NULL,
    on_ground BOOLEAN DEFAULT NULL,
    last_position_update TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (departure_country_id) REFERENCES countries(id),
    FOREIGN KEY (arrival_country_id) REFERENCES countries(id)
);

-- Table des réservations
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    flight_id INT NOT NULL,
    reservation_number VARCHAR(20) NOT NULL UNIQUE,
    passenger_name VARCHAR(200) NOT NULL,
    passenger_email VARCHAR(255) NOT NULL,
    passenger_phone VARCHAR(20),
    seats_reserved INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'confirmed',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status ENUM('paid', 'pending', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_flights_departure ON flights(departure_time);
CREATE INDEX idx_flights_status ON flights(status);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_flight ON reservations(flight_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Insertion de pays exemples
INSERT INTO countries (name, code) VALUES 
('France', 'FRA'),
('États-Unis', 'USA'),
('Canada', 'CAN'),
('Royaume-Uni', 'GBR'),
('Allemagne', 'DEU'),
('Espagne', 'ESP'),
('Italie', 'ITA'),
('Japon', 'JPN'),
('Chine', 'CHN'),
('Brésil', 'BRA'),
('Maroc', 'MAR'),
('Tunisie', 'TUN'),
('Algérie', 'DZA');

-- Insertion de vols exemples
INSERT INTO flights (flight_number, airline, departure_city, arrival_city, departure_country_id, arrival_country_id, departure_time, arrival_time, price, available_seats, total_seats, status) VALUES 
('AF123', 'Air France', 'Paris', 'New York', 1, 2, '2024-06-15 10:00:00', '2024-06-15 13:30:00', 850.00, 75, 100, 'scheduled'),
('BA456', 'British Airways', 'Londres', 'Tokyo', 4, 8, '2024-06-16 14:00:00', '2024-06-17 09:00:00', 1200.00, 50, 100, 'scheduled'),
('AC789', 'Air Canada', 'Toronto', 'Paris', 3, 1, '2024-06-17 08:00:00', '2024-06-17 20:00:00', 650.00, 80, 100, 'scheduled'),
('LH012', 'Lufthansa', 'Francfort', 'Casablanca', 5, 11, '2024-06-18 11:00:00', '2024-06-18 14:00:00', 320.00, 90, 100, 'scheduled'),
('IB345', 'Iberia', 'Madrid', 'Alger', 6, 13, '2024-06-19 09:00:00', '2024-06-19 10:30:00', 180.00, 95, 100, 'delayed');

-- Insertion de réservations exemples
INSERT INTO reservations (user_id, flight_id, reservation_number, passenger_name, passenger_email, passenger_phone, seats_reserved, total_price, status, payment_status) VALUES 
(2, 1, 'RES2024001', 'Jean Dupont', 'jean.dupont@email.com', '+33612345678', 2, 1700.00, 'confirmed', 'paid'),
(2, 2, 'RES2024002', 'Marie Martin', 'marie.martin@email.com', '+33698765432', 1, 1200.00, 'confirmed', 'paid'),
(2, 3, 'RES2024003', 'Pierre Durand', 'pierre.durand@email.com', '+33611223344', 3, 1950.00, 'pending', 'pending');
