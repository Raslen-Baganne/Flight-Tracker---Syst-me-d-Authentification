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

// GET - Récupérer tous les pays
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Pour la liste des pays, autoriser aussi les utilisateurs simples
    if (!isLoggedIn()) {
        sendJsonResponse(['error' => 'Non authentifié'], 401);
    }
    
    try {
        $pdo = getDBConnection();
        
        // Recherche
        $search = $_GET['search'] ?? '';
        $limit = isset($_GET['limit']) ? max(1, min(250, intval($_GET['limit']))) : 250;
        
        $whereClause = "";
        $params = [];
        
        if (!empty($search)) {
            $whereClause = "WHERE name LIKE ? OR code LIKE ?";
            $searchParam = "%$search%";
            $params[] = $searchParam;
            $params[] = $searchParam;
        }
        
        // Récupérer les pays
        $query = "SELECT * FROM countries $whereClause ORDER BY name ASC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $countries = $stmt->fetchAll();
        
        sendJsonResponse([
            'countries' => $countries
        ]);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// POST - Ajouter un nouveau pays (admin seulement)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    checkAdmin();
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validation
        if (empty($data['name']) || empty($data['code'])) {
            sendJsonResponse(['error' => 'Le nom et le code du pays sont obligatoires'], 400);
        }
        
        if (strlen($data['code']) !== 3) {
            sendJsonResponse(['error' => 'Le code du pays doit contenir exactement 3 caractères'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si le pays existe déjà (par nom ou code)
        $stmt = $pdo->prepare("SELECT id FROM countries WHERE name = ? OR code = ?");
        $stmt->execute([$data['name'], strtoupper($data['code'])]);
        if ($stmt->fetch()) {
            sendJsonResponse(['error' => 'Ce pays existe déjà'], 409);
        }
        
        // Insérer le pays
        $stmt = $pdo->prepare("INSERT INTO countries (name, code) VALUES (?, ?)");
        $stmt->execute([
            sanitizeInput($data['name']),
            strtoupper(sanitizeInput($data['code']))
        ]);
        
        $countryId = $pdo->lastInsertId();
        
        // Récupérer le pays créé
        $stmt = $pdo->prepare("SELECT * FROM countries WHERE id = ?");
        $stmt->execute([$countryId]);
        $country = $stmt->fetch();
        
        sendJsonResponse([
            'message' => 'Pays ajouté avec succès',
            'country' => $country
        ], 201);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// PUT - Mettre à jour un pays (admin seulement)
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    checkAdmin();
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $countryId = intval($_GET['id'] ?? 0);
        
        if ($countryId <= 0) {
            sendJsonResponse(['error' => 'ID pays invalide'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si le pays existe
        $stmt = $pdo->prepare("SELECT id FROM countries WHERE id = ?");
        $stmt->execute([$countryId]);
        if (!$stmt->fetch()) {
            sendJsonResponse(['error' => 'Pays non trouvé'], 404);
        }
        
        // Préparer les champs à mettre à jour
        $updateFields = [];
        $params = [];
        
        if (isset($data['name'])) {
            if (empty($data['name'])) {
                sendJsonResponse(['error' => 'Le nom du pays ne peut pas être vide'], 400);
            }
            
            // Vérifier si le nom est déjà utilisé par un autre pays
            $stmt = $pdo->prepare("SELECT id FROM countries WHERE name = ? AND id != ?");
            $stmt->execute([$data['name'], $countryId]);
            if ($stmt->fetch()) {
                sendJsonResponse(['error' => 'Ce nom de pays existe déjà'], 409);
            }
            
            $updateFields[] = "name = ?";
            $params[] = sanitizeInput($data['name']);
        }
        
        if (isset($data['code'])) {
            if (empty($data['code']) || strlen($data['code']) !== 3) {
                sendJsonResponse(['error' => 'Le code du pays doit contenir exactement 3 caractères'], 400);
            }
            
            // Vérifier si le code est déjà utilisé par un autre pays
            $stmt = $pdo->prepare("SELECT id FROM countries WHERE code = ? AND id != ?");
            $stmt->execute([strtoupper($data['code']), $countryId]);
            if ($stmt->fetch()) {
                sendJsonResponse(['error' => 'Ce code de pays existe déjà'], 409);
            }
            
            $updateFields[] = "code = ?";
            $params[] = strtoupper(sanitizeInput($data['code']));
        }
        
        if (empty($updateFields)) {
            sendJsonResponse(['error' => 'Aucun champ à mettre à jour'], 400);
        }
        
        $params[] = $countryId;
        
        // Mettre à jour le pays
        $query = "UPDATE countries SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        // Récupérer le pays mis à jour
        $stmt = $pdo->prepare("SELECT * FROM countries WHERE id = ?");
        $stmt->execute([$countryId]);
        $country = $stmt->fetch();
        
        sendJsonResponse([
            'message' => 'Pays mis à jour avec succès',
            'country' => $country
        ]);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// DELETE - Supprimer un pays (admin seulement)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    checkAdmin();
    
    try {
        $countryId = intval($_GET['id'] ?? 0);
        
        if ($countryId <= 0) {
            sendJsonResponse(['error' => 'ID pays invalide'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si le pays existe
        $stmt = $pdo->prepare("SELECT id FROM countries WHERE id = ?");
        $stmt->execute([$countryId]);
        if (!$stmt->fetch()) {
            sendJsonResponse(['error' => 'Pays non trouvé'], 404);
        }
        
        // Vérifier si le pays est utilisé dans des vols
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM flights WHERE departure_country_id = ? OR arrival_country_id = ?");
        $stmt->execute([$countryId, $countryId]);
        $flightCount = $stmt->fetch()['count'];
        
        if ($flightCount > 0) {
            sendJsonResponse(['error' => 'Impossible de supprimer un pays utilisé dans des vols'], 400);
        }
        
        // Supprimer le pays
        $stmt = $pdo->prepare("DELETE FROM countries WHERE id = ?");
        $stmt->execute([$countryId]);
        
        sendJsonResponse(['message' => 'Pays supprimé avec succès']);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// Méthode non autorisée
sendJsonResponse(['error' => 'Méthode non autorisée'], 405);
?>
