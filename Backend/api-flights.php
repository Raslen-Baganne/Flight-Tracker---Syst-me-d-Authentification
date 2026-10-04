<?php
require_once 'config.php';

header('Content-Type: application/json');

// Vérifier si l'utilisateur est admin
function checkAdmin() {
    if (!isLoggedIn()) {
        sendJsonResponse(['error' => 'Non authentifié'], 401);
    }

    $user = getCurrentUser();
    if (!$user || $user['role'] !== 'admin') {
        sendJsonResponse(['error' => 'Accès non autorisé'], 403);
    }
}

// Vérifier si l'utilisateur est connecté (admin ou user)
function checkAuth() {
    if (!isLoggedIn()) {
        sendJsonResponse(['error' => 'Non authentifié'], 401);
    }

    return getCurrentUser();
}

// GET - Récupérer tous les vols ou rechercher par numéro (sans auth pour user dashboard)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Si c'est une recherche simple par numéro de vol (pour user dashboard)
    if (isset($_GET['flight_number']) && !isset($_GET['page'])) {
        try {
            $pdo = getDBConnection();
            $flightNumber = sanitizeInput($_GET['flight_number']);

            // Vérifier si les nouveaux champs existent pour la rétrocompatibilité
            $checkColumns = $pdo->query("SHOW COLUMNS FROM flights LIKE 'source'");
            $hasNewColumns = $checkColumns->rowCount() > 0;

            if ($hasNewColumns) {
                $stmt = $pdo->prepare("SELECT f.*,
                                             dc.name as departure_country_name,
                                             ac.name as arrival_country_name
                                      FROM flights f
                                      LEFT JOIN countries dc ON f.departure_country_id = dc.id
                                      LEFT JOIN countries ac ON f.arrival_country_id = ac.id
                                      WHERE f.flight_number = ?");
            } else {
                $stmt = $pdo->prepare("SELECT f.*,
                                             dc.name as departure_country_name,
                                             ac.name as arrival_country_name
                                      FROM flights f
                                      LEFT JOIN countries dc ON f.departure_country_id = dc.id
                                      LEFT JOIN countries ac ON f.arrival_country_id = ac.id
                                      WHERE f.flight_number = ?");
            }
            $stmt->execute([$flightNumber]);
            $flight = $stmt->fetch();

            if ($flight) {
                // Ajouter les valeurs par défaut pour les nouveaux champs si ils n'existent pas
                if (!isset($flight['source'])) {
                    $flight['source'] = 'local';
                    $flight['icao24'] = null;
                    $flight['latitude'] = null;
                    $flight['longitude'] = null;
                    $flight['altitude'] = null;
                    $flight['velocity'] = null;
                    $flight['heading'] = null;
                    $flight['on_ground'] = null;
                    $flight['last_position_update'] = null;
                }
                sendJsonResponse(['flight' => $flight, 'source' => 'database']);
            } else {
                sendJsonResponse(['flight' => null, 'source' => 'not_found']);
            }
        } catch (PDOException $e) {
            sendJsonResponse(['error' => 'Erreur de base de données'], 500);
        }
    }

    // Sinon, c'est pour la liste des vols avec authentification requise
    checkAuth();

    try {
        $pdo = getDBConnection();
        
        // Recherche et filtrage
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? '';
        $airline = $_GET['airline'] ?? '';
        $source = $_GET['source'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = max(1, min(100, intval($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        
        $whereConditions = [];
        $params = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(f.flight_number LIKE ? OR f.airline LIKE ? OR f.departure_city LIKE ? OR f.arrival_city LIKE ?)";
            $searchParam = "%$search%";
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
        }
        
        if (!empty($status)) {
            $whereConditions[] = "f.status = ?";
            $params[] = $status;
        }
        
        if (!empty($airline)) {
            $whereConditions[] = "f.airline LIKE ?";
            $params[] = "%$airline%";
        }
        
        if (!empty($source)) {
            $whereConditions[] = "f.source = ?";
            $params[] = $source;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Compter le total
        $countQuery = "SELECT COUNT(*) as total FROM flights f $whereClause";
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Récupérer les vols avec les noms des pays
        // Vérifier si les nouveaux champs existent pour la rétrocompatibilité
        $checkColumns = $pdo->query("SHOW COLUMNS FROM flights LIKE 'source'");
        $hasNewColumns = $checkColumns->rowCount() > 0;

        if ($hasNewColumns) {
            $query = "SELECT f.*, 
                             dc.name as departure_country_name, 
                             ac.name as arrival_country_name,
                             dc.code as departure_country_code,
                             ac.code as arrival_country_code
                      FROM flights f
                      LEFT JOIN countries dc ON f.departure_country_id = dc.id
                      LEFT JOIN countries ac ON f.arrival_country_id = ac.id
                      $whereClause 
                      ORDER BY f.departure_time DESC 
                      LIMIT ? OFFSET ?";
        } else {
            $query = "SELECT f.*, 
                             dc.name as departure_country_name, 
                             ac.name as arrival_country_name,
                             dc.code as departure_country_code,
                             ac.code as arrival_country_code
                      FROM flights f
                      LEFT JOIN countries dc ON f.departure_country_id = dc.id
                      LEFT JOIN countries ac ON f.arrival_country_id = ac.id
                      $whereClause 
                      ORDER BY f.departure_time DESC 
                      LIMIT ? OFFSET ?";
        }
        $stmt = $pdo->prepare($query);
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $flights = $stmt->fetchAll();

        // Ajouter les valeurs par défaut pour les nouveaux champs si ils n'existent pas
        foreach ($flights as &$flight) {
            if (!isset($flight['source'])) {
                $flight['source'] = 'local';
                $flight['icao24'] = null;
                $flight['latitude'] = null;
                $flight['longitude'] = null;
                $flight['altitude'] = null;
                $flight['velocity'] = null;
                $flight['heading'] = null;
                $flight['on_ground'] = null;
                $flight['last_position_update'] = null;
            }
        }
        
        sendJsonResponse([
            'flights' => $flights,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// POST - Créer un nouveau vol
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    checkAdmin();

    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            sendJsonResponse(['error' => 'Données JSON invalides'], 400);
        }

        // Validation
        $requiredFields = ['flight_number', 'airline', 'departure_city', 'arrival_city',
                          'departure_time', 'arrival_time', 'price', 'available_seats'];

        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                sendJsonResponse(['error' => "Champ obligatoire manquant: $field", 'debug' => $data], 400);
            }
        }

        if (!is_numeric($data['price']) || $data['price'] <= 0) {
            sendJsonResponse(['error' => 'Prix invalide'], 400);
        }

        if (!is_numeric($data['available_seats']) || $data['available_seats'] <= 0) {
            sendJsonResponse(['error' => 'Nombre de places invalide'], 400);
        }

        // Convertir les dates au format MySQL
        $departureTime = str_replace('T', ' ', $data['departure_time']);
        $arrivalTime = str_replace('T', ' ', $data['arrival_time']);

        // Ajouter les secondes si manquantes
        if (strlen($departureTime) === 16) {
            $departureTime .= ':00';
        }
        if (strlen($arrivalTime) === 16) {
            $arrivalTime .= ':00';
        }

        if (strtotime($departureTime) >= strtotime($arrivalTime)) {
            sendJsonResponse(['error' => 'La date d\'arrivée doit être postérieure à la date de départ'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si le numéro de vol existe déjà
        $stmt = $pdo->prepare("SELECT id FROM flights WHERE flight_number = ?");
        $stmt->execute([$data['flight_number']]);
        if ($stmt->fetch()) {
            sendJsonResponse(['error' => 'Ce numéro de vol existe déjà'], 409);
        }
        
        // Valider les pays si fournis
        $departureCountryId = null;
        $arrivalCountryId = null;
        
        if (!empty($data['departure_country_id'])) {
            $stmt = $pdo->prepare("SELECT id FROM countries WHERE id = ?");
            $stmt->execute([$data['departure_country_id']]);
            if (!$stmt->fetch()) {
                sendJsonResponse(['error' => 'Pays de départ invalide'], 400);
            }
            $departureCountryId = $data['departure_country_id'];
        }
        
        if (!empty($data['arrival_country_id'])) {
            $stmt = $pdo->prepare("SELECT id FROM countries WHERE id = ?");
            $stmt->execute([$data['arrival_country_id']]);
            if (!$stmt->fetch()) {
                sendJsonResponse(['error' => 'Pays d\'arrivée invalide'], 400);
            }
            $arrivalCountryId = $data['arrival_country_id'];
        }
        
        // Insérer le vol
        $stmt = $pdo->prepare("INSERT INTO flights (flight_number, airline, departure_city, arrival_city,
                               departure_country_id, arrival_country_id, departure_time, arrival_time,
                               price, available_seats, total_seats, status)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $totalSeats = intval($data['available_seats']);
        $availableSeats = $totalSeats;
        $status = $data['status'] ?? 'scheduled';

        $stmt->execute([
            sanitizeInput($data['flight_number']),
            sanitizeInput($data['airline']),
            sanitizeInput($data['departure_city']),
            sanitizeInput($data['arrival_city']),
            $departureCountryId,
            $arrivalCountryId,
            $departureTime,
            $arrivalTime,
            floatval($data['price']),
            intval($availableSeats),
            intval($totalSeats),
            $status
        ]);
        
        $flightId = $pdo->lastInsertId();
        
        // Récupérer le vol créé
        $stmt = $pdo->prepare("SELECT f.*, 
                                      dc.name as departure_country_name, 
                                      ac.name as arrival_country_name
                               FROM flights f
                               LEFT JOIN countries dc ON f.departure_country_id = dc.id
                               LEFT JOIN countries ac ON f.arrival_country_id = ac.id
                               WHERE f.id = ?");
        $stmt->execute([$flightId]);
        $flight = $stmt->fetch();
        
        sendJsonResponse([
            'message' => 'Vol créé avec succès',
            'flight' => $flight
        ], 201);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// PUT - Mettre à jour un vol
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    checkAdmin();
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $flightId = intval($_GET['id'] ?? 0);
        
        if ($flightId <= 0) {
            sendJsonResponse(['error' => 'ID vol invalide'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si le vol existe
        $stmt = $pdo->prepare("SELECT id FROM flights WHERE id = ?");
        $stmt->execute([$flightId]);
        if (!$stmt->fetch()) {
            sendJsonResponse(['error' => 'Vol non trouvé'], 404);
        }
        
        // Préparer les champs à mettre à jour
        $updateFields = [];
        $params = [];
        
        $updatableFields = ['flight_number', 'airline', 'departure_city', 'arrival_city', 
                           'departure_time', 'arrival_time', 'price', 'total_seats', 'status'];
        
        foreach ($updatableFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'price' && (!is_numeric($data[$field]) || $data[$field] <= 0)) {
                    sendJsonResponse(['error' => 'Prix invalide'], 400);
                }
                
                if ($field === 'total_seats' && (!is_numeric($data[$field]) || $data[$field] <= 0)) {
                    sendJsonResponse(['error' => 'Nombre de places invalide'], 400);
                }
                
                if ($field === 'status' && !in_array($data[$field], ['scheduled', 'delayed', 'cancelled', 'completed'])) {
                    sendJsonResponse(['error' => 'Statut invalide'], 400);
                }
                
                if ($field === 'flight_number') {
                    // Vérifier si le numéro de vol est déjà utilisé par un autre vol
                    $stmt = $pdo->prepare("SELECT id FROM flights WHERE flight_number = ? AND id != ?");
                    $stmt->execute([$data[$field], $flightId]);
                    if ($stmt->fetch()) {
                        sendJsonResponse(['error' => 'Ce numéro de vol existe déjà'], 409);
                    }
                }
                
                $updateFields[] = "$field = ?";
                $params[] = $field === 'price' ? floatval($data[$field]) : 
                           ($field === 'total_seats' ? intval($data[$field]) : 
                           sanitizeInput($data[$field]));
            }
        }
        
        // Gérer les pays
        if (isset($data['departure_country_id'])) {
            if (!empty($data['departure_country_id'])) {
                $stmt = $pdo->prepare("SELECT id FROM countries WHERE id = ?");
                $stmt->execute([$data['departure_country_id']]);
                if (!$stmt->fetch()) {
                    sendJsonResponse(['error' => 'Pays de départ invalide'], 400);
                }
            }
            $updateFields[] = "departure_country_id = ?";
            $params[] = $data['departure_country_id'] ?: null;
        }
        
        if (isset($data['arrival_country_id'])) {
            if (!empty($data['arrival_country_id'])) {
                $stmt = $pdo->prepare("SELECT id FROM countries WHERE id = ?");
                $stmt->execute([$data['arrival_country_id']]);
                if (!$stmt->fetch()) {
                    sendJsonResponse(['error' => 'Pays d\'arrivée invalide'], 400);
                }
            }
            $updateFields[] = "arrival_country_id = ?";
            $params[] = $data['arrival_country_id'] ?: null;
        }
        
        // Validation des dates si les deux sont fournies
        if (isset($data['departure_time']) && isset($data['arrival_time'])) {
            if (strtotime($data['departure_time']) >= strtotime($data['arrival_time'])) {
                sendJsonResponse(['error' => 'La date d\'arrivée doit être postérieure à la date de départ'], 400);
            }
        }
        
        if (empty($updateFields)) {
            sendJsonResponse(['error' => 'Aucun champ à mettre à jour'], 400);
        }
        
        $params[] = $flightId;
        
        // Mettre à jour le vol
        $query = "UPDATE flights SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        // Si le nombre total de places change, ajuster les places disponibles
        if (isset($data['total_seats'])) {
            $stmt = $pdo->prepare("SELECT available_seats FROM flights WHERE id = ?");
            $stmt->execute([$flightId]);
            $currentAvailable = $stmt->fetch()['available_seats'];
            
            if ($data['total_seats'] < $currentAvailable) {
                sendJsonResponse(['error' => 'Le nombre total de places ne peut pas être inférieur aux places disponibles'], 400);
            }
        }
        
        // Récupérer le vol mis à jour
        $stmt = $pdo->prepare("SELECT f.*, 
                                      dc.name as departure_country_name, 
                                      ac.name as arrival_country_name
                               FROM flights f
                               LEFT JOIN countries dc ON f.departure_country_id = dc.id
                               LEFT JOIN countries ac ON f.arrival_country_id = ac.id
                               WHERE f.id = ?");
        $stmt->execute([$flightId]);
        $flight = $stmt->fetch();
        
        sendJsonResponse([
            'message' => 'Vol mis à jour avec succès',
            'flight' => $flight
        ]);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// DELETE - Supprimer un vol
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    checkAdmin();
    
    try {
        $flightId = intval($_GET['id'] ?? 0);
        
        if ($flightId <= 0) {
            sendJsonResponse(['error' => 'ID vol invalide'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si le vol existe
        $stmt = $pdo->prepare("SELECT id FROM flights WHERE id = ?");
        $stmt->execute([$flightId]);
        if (!$stmt->fetch()) {
            sendJsonResponse(['error' => 'Vol non trouvé'], 404);
        }
        
        // Vérifier s'il y a des réservations associées
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM reservations WHERE flight_id = ? AND status != 'cancelled'");
        $stmt->execute([$flightId]);
        $reservationCount = $stmt->fetch()['count'];
        
        if ($reservationCount > 0) {
            sendJsonResponse(['error' => 'Impossible de supprimer un vol avec des réservations actives'], 400);
        }
        
        // Supprimer le vol
        $stmt = $pdo->prepare("DELETE FROM flights WHERE id = ?");
        $stmt->execute([$flightId]);
        
        sendJsonResponse(['message' => 'Vol supprimé avec succès']);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// POST spécial - Importer un vol depuis OpenSky
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'import-opensky') {
    checkAdmin();

    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['flight_number'])) {
            sendJsonResponse(['error' => 'Numéro de vol requis'], 400);
        }

        $pdo = getDBConnection();

        // Vérifier si les nouveaux champs existent
        $checkColumns = $pdo->query("SHOW COLUMNS FROM flights LIKE 'source'");
        $hasNewColumns = $checkColumns->rowCount() > 0;

        if (!$hasNewColumns) {
            sendJsonResponse(['error' => 'La base de données doit être migrée pour utiliser OpenSky. Veuillez exécuter le script migration-add-opensky-fields.sql'], 400);
        }

        // Vérifier si le vol existe déjà
        $stmt = $pdo->prepare("SELECT id FROM flights WHERE flight_number = ?");
        $stmt->execute([$data['flight_number']]);
        if ($stmt->fetch()) {
            sendJsonResponse(['error' => 'Ce vol existe déjà dans la base de données'], 409);
        }

        // Importer depuis OpenSky API
        $openskyUrl = 'https://opensky-network.org/api/states/all';
        $response = @file_get_contents($openskyUrl);

        if ($response === false) {
            sendJsonResponse(['error' => 'Impossible de contacter l\'API OpenSky'], 503);
        }

        $openskyData = json_decode($response, true);

        if (!$openskyData || !isset($openskyData['states'])) {
            sendJsonResponse(['error' => 'Données OpenSky invalides'], 500);
        }

        // Chercher le vol par callsign
        $targetFlight = null;
        foreach ($openskyData['states'] as $state) {
            if ($state[1] && strtoupper(trim($state[1])) === strtoupper(trim($data['flight_number']))) {
                $targetFlight = $state;
                break;
            }
        }

        if (!$targetFlight) {
            sendJsonResponse(['error' => 'Vol non trouvé dans OpenSky'], 404);
        }

        // Mapper les données OpenSky vers notre structure
        $airports = [
            'CDG' => ['city' => 'Paris', 'country_id' => 1],
            'JFK' => ['city' => 'New York', 'country_id' => 2],
            'LHR' => ['city' => 'Londres', 'country_id' => 4],
            'FRA' => ['city' => 'Francfort', 'country_id' => 5],
            'DXB' => ['city' => 'Dubai', 'country_id' => null],
            'TUN' => ['city' => 'Tunis', 'country_id' => 12],
        ];

        // Générer des aéroports aléatoires pour la démo
        $departureAirport = $airports[array_rand($airports)];
        $arrivalAirport = $airports[array_rand($airports)];
        while ($arrivalAirport['city'] === $departureAirport['city']) {
            $arrivalAirport = $airports[array_rand($airports)];
        }

        // Extraire la compagnie depuis le callsign (ex: "AF123" -> "Air France")
        $callsign = trim($targetFlight[1]);
        $airlineCode = substr($callsign, 0, 2);
        $airlines = [
            'AF' => 'Air France',
            'LH' => 'Lufthansa',
            'BA' => 'British Airways',
            'AA' => 'American Airlines',
            'DL' => 'Delta Airlines',
            'UA' => 'United Airlines',
            'EK' => 'Emirates',
            'TU' => 'Tunisair'
        ];
        $airline = $airlines[$airlineCode] ?? 'Unknown Airline';

        // Calculer les heures de départ/arrivée (estimées)
        $now = new DateTime();
        $departureTime = clone $now;
        $arrivalTime = clone $now;
        $arrivalTime->add(new DateInterval('PT' . rand(2, 8) . 'H'));

        // Insérer le vol
        $stmt = $pdo->prepare("INSERT INTO flights (flight_number, airline, departure_city, arrival_city,
                               departure_country_id, arrival_country_id, departure_time, arrival_time,
                               price, available_seats, total_seats, status, source, icao24, latitude,
                               longitude, altitude, velocity, heading, on_ground, last_position_update)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $callsign,
            $airline,
            $departureAirport['city'],
            $arrivalAirport['city'],
            $departureAirport['country_id'],
            $arrivalAirport['country_id'],
            $departureTime->format('Y-m-d H:i:s'),
            $arrivalTime->format('Y-m-d H:i:s'),
            rand(100, 1500), // Prix aléatoire
            rand(50, 200), // Places disponibles aléatoires
            rand(50, 200), // Total places aléatoires
            'scheduled',
            'opensky',
            $targetFlight[0] ?: null, // icao24
            $targetFlight[6] ?: null, // latitude
            $targetFlight[5] ?: null, // longitude
            $targetFlight[7] ? round($targetFlight[7]) : null, // altitude
            $targetFlight[9] ? round($targetFlight[9]) : null, // velocity
            $targetFlight[10] ? round($targetFlight[10]) : null, // heading
            $targetFlight[8] ?: false, // on_ground
            date('Y-m-d H:i:s') // last_position_update
        ]);

        $flightId = $pdo->lastInsertId();

        // Récupérer le vol créé
        $stmt = $pdo->prepare("SELECT f.*,
                                      dc.name as departure_country_name,
                                      ac.name as arrival_country_name
                               FROM flights f
                               LEFT JOIN countries dc ON f.departure_country_id = dc.id
                               LEFT JOIN countries ac ON f.arrival_country_id = ac.id
                               WHERE f.id = ?");
        $stmt->execute([$flightId]);
        $flight = $stmt->fetch();

        sendJsonResponse([
            'message' => 'Vol importé depuis OpenSky avec succès',
            'flight' => $flight
        ], 201);

    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// POST spécial - Mettre à jour les données temps réel d'un vol OpenSky
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'update-opensky') {
    checkAdmin();
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $flightId = intval($data['id'] ?? 0);
        
        if ($flightId <= 0) {
            sendJsonResponse(['error' => 'ID vol invalide'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si le vol existe et est de source OpenSky
        $stmt = $pdo->prepare("SELECT flight_number, source FROM flights WHERE id = ?");
        $stmt->execute([$flightId]);
        $flight = $stmt->fetch();
        
        if (!$flight) {
            sendJsonResponse(['error' => 'Vol non trouvé'], 404);
        }
        
        if ($flight['source'] !== 'opensky') {
            sendJsonResponse(['error' => 'Ce vol n\'est pas importé depuis OpenSky'], 400);
        }
        
        // Importer les données temps réel depuis OpenSky
        $openskyUrl = 'https://opensky-network.org/api/states/all';
        $response = @file_get_contents($openskyUrl);
        
        if ($response === false) {
            sendJsonResponse(['error' => 'Impossible de contacter l\'API OpenSky'], 503);
        }
        
        $openskyData = json_decode($response, true);
        
        if (!$openskyData || !isset($openskyData['states'])) {
            sendJsonResponse(['error' => 'Données OpenSky invalides'], 500);
        }
        
        // Chercher le vol par callsign
        $targetFlight = null;
        foreach ($openskyData['states'] as $state) {
            if ($state[1] && strtoupper(trim($state[1])) === strtoupper(trim($flight['flight_number']))) {
                $targetFlight = $state;
                break;
            }
        }
        
        if (!$targetFlight) {
            sendJsonResponse(['error' => 'Vol non trouvé dans OpenSky (peut-être atterri ou hors ligne)'], 404);
        }
        
        // Mettre à jour les données temps réel
        $stmt = $pdo->prepare("UPDATE flights SET 
                               latitude = ?, 
                               longitude = ?, 
                               altitude = ?, 
                               velocity = ?, 
                               heading = ?, 
                               on_ground = ?, 
                               last_position_update = ?
                               WHERE id = ?");
        
        $stmt->execute([
            $targetFlight[6] ?: null, // latitude
            $targetFlight[5] ?: null, // longitude
            $targetFlight[7] ? round($targetFlight[7]) : null, // altitude
            $targetFlight[9] ? round($targetFlight[9]) : null, // velocity
            $targetFlight[10] ? round($targetFlight[10]) : null, // heading
            $targetFlight[8] ?: false, // on_ground
            date('Y-m-d H:i:s'), // last_position_update
            $flightId
        ]);
        
        // Récupérer le vol mis à jour
        $stmt = $pdo->prepare("SELECT f.*, 
                                      dc.name as departure_country_name, 
                                      ac.name as arrival_country_name
                               FROM flights f
                               LEFT JOIN countries dc ON f.departure_country_id = dc.id
                               LEFT JOIN countries ac ON f.arrival_country_id = ac.id
                               WHERE f.id = ?");
        $stmt->execute([$flightId]);
        $updatedFlight = $stmt->fetch();
        
        sendJsonResponse([
            'message' => 'Données temps réel mises à jour avec succès',
            'flight' => $updatedFlight
        ]);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// Méthode non autorisée
sendJsonResponse(['error' => 'Méthode non autorisée'], 405);
?>
