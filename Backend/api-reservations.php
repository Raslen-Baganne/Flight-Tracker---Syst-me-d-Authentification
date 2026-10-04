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

// GET - Récupérer toutes les réservations
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = checkAuth();

    try {
        $pdo = getDBConnection();

        // Recherche et filtrage
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? '';
        $payment_status = $_GET['payment_status'] ?? '';
        $flight_id = $_GET['flight_id'] ?? '';
        $user_id = $_GET['user_id'] ?? '';

        // Si l'utilisateur n'est pas admin, ne voir que ses propres réservations
        if ($user['role'] !== 'admin') {
            $user_id = $user['id'];
        }
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = max(1, min(100, intval($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        
        $whereConditions = [];
        $params = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(r.reservation_number LIKE ? OR r.passenger_name LIKE ? OR r.passenger_email LIKE ? OR f.flight_number LIKE ?)";
            $searchParam = "%$search%";
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
        }
        
        if (!empty($status)) {
            $whereConditions[] = "r.status = ?";
            $params[] = $status;
        }
        
        if (!empty($payment_status)) {
            $whereConditions[] = "r.payment_status = ?";
            $params[] = $payment_status;
        }
        
        if (!empty($flight_id)) {
            $whereConditions[] = "r.flight_id = ?";
            $params[] = $flight_id;
        }
        
        if (!empty($user_id)) {
            $whereConditions[] = "r.user_id = ?";
            $params[] = $user_id;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Compter le total
        $countQuery = "SELECT COUNT(*) as total FROM reservations r $whereClause";
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Récupérer les réservations avec les détails des vols et utilisateurs
        $query = "SELECT r.*, 
                         u.first_name as user_first_name, 
                         u.last_name as user_last_name,
                         u.email as user_email,
                         f.flight_number,
                         f.airline,
                         f.departure_city,
                         f.arrival_city,
                         f.departure_time,
                         f.arrival_time,
                         f.price as flight_price
                  FROM reservations r
                  LEFT JOIN users u ON r.user_id = u.id
                  LEFT JOIN flights f ON r.flight_id = f.id
                  $whereClause 
                  ORDER BY r.booking_date DESC 
                  LIMIT ? OFFSET ?";
        $stmt = $pdo->prepare($query);
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $reservations = $stmt->fetchAll();
        
        sendJsonResponse([
            'reservations' => $reservations,
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

// POST - Créer une nouvelle réservation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = checkAuth();

    try {
        $data = json_decode(file_get_contents('php://input'), true);

        // Si l'utilisateur n'est pas admin, utiliser son propre user_id
        if ($user['role'] !== 'admin') {
            $data['user_id'] = $user['id'];
        }

        // Validation
        $requiredFields = ['user_id', 'flight_id', 'passenger_name', 'passenger_email', 'seats_reserved'];

        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                sendJsonResponse(['error' => "Champ obligatoire manquant: $field"], 400);
            }
        }
        
        if (!filter_var($data['passenger_email'], FILTER_VALIDATE_EMAIL)) {
            sendJsonResponse(['error' => 'Email du passager invalide'], 400);
        }
        
        if (!is_numeric($data['seats_reserved']) || $data['seats_reserved'] <= 0) {
            sendJsonResponse(['error' => 'Nombre de places invalide'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si l'utilisateur existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$data['user_id']]);
        if (!$stmt->fetch()) {
            sendJsonResponse(['error' => 'Utilisateur non trouvé'], 404);
        }
        
        // Vérifier si le vol existe et est disponible
        $stmt = $pdo->prepare("SELECT * FROM flights WHERE id = ? AND status IN ('scheduled', 'delayed')");
        $stmt->execute([$data['flight_id']]);
        $flight = $stmt->fetch();
        
        if (!$flight) {
            sendJsonResponse(['error' => 'Vol non trouvé ou non disponible'], 404);
        }
        
        // Vérifier la disponibilité des places
        if ($flight['available_seats'] < $data['seats_reserved']) {
            sendJsonResponse(['error' => 'Places insuffisantes sur ce vol'], 400);
        }
        
        // Générer un numéro de réservation unique
        do {
            $reservationNumber = 'RES' . date('Y') . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
            $stmt = $pdo->prepare("SELECT id FROM reservations WHERE reservation_number = ?");
            $stmt->execute([$reservationNumber]);
        } while ($stmt->fetch());
        
        // Calculer le prix total
        $totalPrice = $flight['price'] * $data['seats_reserved'];
        
        // Démarrer une transaction
        $pdo->beginTransaction();
        
        try {
            // Insérer la réservation
            $stmt = $pdo->prepare("INSERT INTO reservations (user_id, flight_id, reservation_number, 
                                   passenger_name, passenger_email, passenger_phone, seats_reserved, 
                                   total_price, status, payment_status) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $stmt->execute([
                $data['user_id'],
                $data['flight_id'],
                $reservationNumber,
                sanitizeInput($data['passenger_name']),
                sanitizeInput($data['passenger_email']),
                $data['passenger_phone'] ? sanitizeInput($data['passenger_phone']) : null,
                intval($data['seats_reserved']),
                $totalPrice,
                $data['status'] ?? 'confirmed',
                $data['payment_status'] ?? 'pending'
            ]);
            
            $reservationId = $pdo->lastInsertId();
            
            // Mettre à jour les places disponibles sur le vol
            $newAvailableSeats = $flight['available_seats'] - $data['seats_reserved'];
            $stmt = $pdo->prepare("UPDATE flights SET available_seats = ? WHERE id = ?");
            $stmt->execute([$newAvailableSeats, $data['flight_id']]);
            
            $pdo->commit();
            
            // Récupérer la réservation créée
            $stmt = $pdo->prepare("SELECT r.*, 
                                         u.first_name as user_first_name, 
                                         u.last_name as user_last_name,
                                         u.email as user_email,
                                         f.flight_number,
                                         f.airline,
                                         f.departure_city,
                                         f.arrival_city,
                                         f.departure_time,
                                         f.arrival_time
                                  FROM reservations r
                                  LEFT JOIN users u ON r.user_id = u.id
                                  LEFT JOIN flights f ON r.flight_id = f.id
                                  WHERE r.id = ?");
            $stmt->execute([$reservationId]);
            $reservation = $stmt->fetch();
            
            sendJsonResponse([
                'message' => 'Réservation créée avec succès',
                'reservation' => $reservation
            ], 201);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// PUT - Mettre à jour une réservation
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    checkAdmin();
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $reservationId = intval($_GET['id'] ?? 0);
        
        if ($reservationId <= 0) {
            sendJsonResponse(['error' => 'ID réservation invalide'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Récupérer la réservation actuelle avec les détails du vol
        $stmt = $pdo->prepare("SELECT r.*, f.available_seats as flight_available_seats, f.total_seats as flight_total_seats
                               FROM reservations r
                               LEFT JOIN flights f ON r.flight_id = f.id
                               WHERE r.id = ?");
        $stmt->execute([$reservationId]);
        $currentReservation = $stmt->fetch();
        
        if (!$currentReservation) {
            sendJsonResponse(['error' => 'Réservation non trouvée'], 404);
        }
        
        // Préparer les champs à mettre à jour
        $updateFields = [];
        $params = [];
        
        if (isset($data['passenger_name'])) {
            $updateFields[] = "passenger_name = ?";
            $params[] = sanitizeInput($data['passenger_name']);
        }
        
        if (isset($data['passenger_email'])) {
            if (!filter_var($data['passenger_email'], FILTER_VALIDATE_EMAIL)) {
                sendJsonResponse(['error' => 'Email du passager invalide'], 400);
            }
            $updateFields[] = "passenger_email = ?";
            $params[] = sanitizeInput($data['passenger_email']);
        }
        
        if (isset($data['passenger_phone'])) {
            $updateFields[] = "passenger_phone = ?";
            $params[] = $data['passenger_phone'] ? sanitizeInput($data['passenger_phone']) : null;
        }
        
        if (isset($data['status'])) {
            if (!in_array($data['status'], ['confirmed', 'pending', 'cancelled'])) {
                sendJsonResponse(['error' => 'Statut invalide'], 400);
            }
            $updateFields[] = "status = ?";
            $params[] = $data['status'];
        }
        
        if (isset($data['payment_status'])) {
            if (!in_array($data['payment_status'], ['paid', 'pending', 'refunded'])) {
                sendJsonResponse(['error' => 'Statut de paiement invalide'], 400);
            }
            $updateFields[] = "payment_status = ?";
            $params[] = $data['payment_status'];
        }
        
        // Gestion du changement du nombre de places
        if (isset($data['seats_reserved'])) {
            if (!is_numeric($data['seats_reserved']) || $data['seats_reserved'] <= 0) {
                sendJsonResponse(['error' => 'Nombre de places invalide'], 400);
            }
            
            $newSeatsReserved = intval($data['seats_reserved']);
            $oldSeatsReserved = $currentReservation['seats_reserved'];
            
            if ($newSeatsReserved != $oldSeatsReserved) {
                // Calculer la différence de places
                $seatDifference = $oldSeatsReserved - $newSeatsReserved;
                
                // Vérifier la disponibilité si on augmente le nombre de places
                if ($seatDifference < 0) {
                    $requiredSeats = abs($seatDifference);
                    if ($currentReservation['flight_available_seats'] < $requiredSeats) {
                        sendJsonResponse(['error' => 'Places insuffisantes sur ce vol'], 400);
                    }
                }
                
                // Mettre à jour les places disponibles sur le vol
                $newAvailableSeats = $currentReservation['flight_available_seats'] + $seatDifference;
                $stmt = $pdo->prepare("UPDATE flights SET available_seats = ? WHERE id = ?");
                $stmt->execute([$newAvailableSeats, $currentReservation['flight_id']]);
                
                // Recalculer le prix total
                $stmt = $pdo->prepare("SELECT price FROM flights WHERE id = ?");
                $stmt->execute([$currentReservation['flight_id']]);
                $flightPrice = $stmt->fetch()['price'];
                $newTotalPrice = $flightPrice * $newSeatsReserved;
                
                $updateFields[] = "seats_reserved = ?";
                $params[] = $newSeatsReserved;
                $updateFields[] = "total_price = ?";
                $params[] = $newTotalPrice;
            }
        }
        
        if (empty($updateFields)) {
            sendJsonResponse(['error' => 'Aucun champ à mettre à jour'], 400);
        }
        
        $params[] = $reservationId;
        
        // Mettre à jour la réservation
        $query = "UPDATE reservations SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        // Récupérer la réservation mise à jour
        $stmt = $pdo->prepare("SELECT r.*, 
                                     u.first_name as user_first_name, 
                                     u.last_name as user_last_name,
                                     u.email as user_email,
                                     f.flight_number,
                                     f.airline,
                                     f.departure_city,
                                     f.arrival_city,
                                     f.departure_time,
                                     f.arrival_time
                              FROM reservations r
                              LEFT JOIN users u ON r.user_id = u.id
                              LEFT JOIN flights f ON r.flight_id = f.id
                              WHERE r.id = ?");
        $stmt->execute([$reservationId]);
        $reservation = $stmt->fetch();
        
        sendJsonResponse([
            'message' => 'Réservation mise à jour avec succès',
            'reservation' => $reservation
        ]);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// DELETE - Supprimer une réservation
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $user = checkAuth();

    try {
        $reservationId = intval($_GET['id'] ?? 0);

        if ($reservationId <= 0) {
            sendJsonResponse(['error' => 'ID réservation invalide'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Récupérer la réservation avant suppression
        $stmt = $pdo->prepare("SELECT * FROM reservations WHERE id = ?");
        $stmt->execute([$reservationId]);
        $reservation = $stmt->fetch();
        
        if (!$reservation) {
            sendJsonResponse(['error' => 'Réservation non trouvée'], 404);
        }

        // Vérifier que l'utilisateur est admin ou le propriétaire de la réservation
        if ($user['role'] !== 'admin' && $reservation['user_id'] != $user['id']) {
            sendJsonResponse(['error' => 'Accès non autorisé'], 403);
        }

        // Démarrer une transaction
        $pdo->beginTransaction();
        
        try {
            // Supprimer la réservation
            $stmt = $pdo->prepare("DELETE FROM reservations WHERE id = ?");
            $stmt->execute([$reservationId]);
            
            // Restituer les places sur le vol
            $stmt = $pdo->prepare("UPDATE flights SET available_seats = available_seats + ? WHERE id = ?");
            $stmt->execute([$reservation['seats_reserved'], $reservation['flight_id']]);
            
            $pdo->commit();
            
            sendJsonResponse(['message' => 'Réservation supprimée avec succès']);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// Méthode non autorisée
sendJsonResponse(['error' => 'Méthode non autorisée'], 405);
?>
