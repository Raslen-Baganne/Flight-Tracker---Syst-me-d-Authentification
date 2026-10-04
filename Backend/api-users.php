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

// GET - Récupérer tous les utilisateurs
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    checkAdmin();
    
    try {
        $pdo = getDBConnection();
        
        // Recherche et filtrage
        $search = $_GET['search'] ?? '';
        $role = $_GET['role'] ?? '';
        $status = $_GET['status'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = max(1, min(100, intval($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        
        $whereConditions = [];
        $params = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
            $searchParam = "%$search%";
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
        }
        
        if (!empty($role)) {
            $whereConditions[] = "role = ?";
            $params[] = $role;
        }
        
        if ($status !== '') {
            $whereConditions[] = "is_active = ?";
            $params[] = $status === 'active' ? 1 : 0;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Compter le total
        $countQuery = "SELECT COUNT(*) as total FROM users $whereClause";
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Récupérer les utilisateurs
        $query = "SELECT id, first_name, last_name, email, role, is_active, created_at, last_login 
                  FROM users $whereClause 
                  ORDER BY created_at DESC 
                  LIMIT ? OFFSET ?";
        $stmt = $pdo->prepare($query);
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $users = $stmt->fetchAll();
        
        sendJsonResponse([
            'users' => $users,
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

// POST - Créer un nouvel utilisateur
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    checkAdmin();
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validation
        if (empty($data['first_name']) || empty($data['last_name']) || empty($data['email']) || empty($data['password'])) {
            sendJsonResponse(['error' => 'Champs obligatoires manquants'], 400);
        }
        
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            sendJsonResponse(['error' => 'Email invalide'], 400);
        }
        
        if (strlen($data['password']) < 6) {
            sendJsonResponse(['error' => 'Le mot de passe doit contenir au moins 6 caractères'], 400);
        }
        
        if (!in_array($data['role'], ['user', 'admin'])) {
            sendJsonResponse(['error' => 'Rôle invalide'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si l'email existe déjà
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            sendJsonResponse(['error' => 'Cet email est déjà utilisé'], 409);
        }
        
        // Insérer l'utilisateur
        $stmt = $pdo->prepare("INSERT INTO users (first_name, last_name, email, password, role) 
                               VALUES (?, ?, ?, ?, ?)");
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt->execute([
            sanitizeInput($data['first_name']),
            sanitizeInput($data['last_name']),
            sanitizeInput($data['email']),
            $hashedPassword,
            $data['role']
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Récupérer l'utilisateur créé
        $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, role, is_active, created_at 
                               FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        sendJsonResponse([
            'message' => 'Utilisateur créé avec succès',
            'user' => $user
        ], 201);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// PUT - Mettre à jour un utilisateur
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    checkAdmin();
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = intval($_GET['id'] ?? 0);
        
        if ($userId <= 0) {
            sendJsonResponse(['error' => 'ID utilisateur invalide'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si l'utilisateur existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        if (!$stmt->fetch()) {
            sendJsonResponse(['error' => 'Utilisateur non trouvé'], 404);
        }
        
        // Préparer les champs à mettre à jour
        $updateFields = [];
        $params = [];
        
        if (isset($data['first_name'])) {
            $updateFields[] = "first_name = ?";
            $params[] = sanitizeInput($data['first_name']);
        }
        
        if (isset($data['last_name'])) {
            $updateFields[] = "last_name = ?";
            $params[] = sanitizeInput($data['last_name']);
        }
        
        if (isset($data['email'])) {
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                sendJsonResponse(['error' => 'Email invalide'], 400);
            }
            
            // Vérifier si l'email est déjà utilisé par un autre utilisateur
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([$data['email'], $userId]);
            if ($stmt->fetch()) {
                sendJsonResponse(['error' => 'Cet email est déjà utilisé'], 409);
            }
            
            $updateFields[] = "email = ?";
            $params[] = sanitizeInput($data['email']);
        }
        
        if (isset($data['password']) && !empty($data['password'])) {
            if (strlen($data['password']) < 6) {
                sendJsonResponse(['error' => 'Le mot de passe doit contenir au moins 6 caractères'], 400);
            }
            $updateFields[] = "password = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (isset($data['role'])) {
            if (!in_array($data['role'], ['user', 'admin'])) {
                sendJsonResponse(['error' => 'Rôle invalide'], 400);
            }
            $updateFields[] = "role = ?";
            $params[] = $data['role'];
        }
        
        if (isset($data['is_active'])) {
            $updateFields[] = "is_active = ?";
            $params[] = $data['is_active'] ? 1 : 0;
        }
        
        if (empty($updateFields)) {
            sendJsonResponse(['error' => 'Aucun champ à mettre à jour'], 400);
        }
        
        $params[] = $userId;
        
        // Mettre à jour l'utilisateur
        $query = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        // Récupérer l'utilisateur mis à jour
        $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, role, is_active, created_at, last_login 
                               FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        sendJsonResponse([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => $user
        ]);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// DELETE - Supprimer un utilisateur
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    checkAdmin();
    
    try {
        $userId = intval($_GET['id'] ?? 0);
        
        if ($userId <= 0) {
            sendJsonResponse(['error' => 'ID utilisateur invalide'], 400);
        }
        
        $pdo = getDBConnection();
        
        // Vérifier si l'utilisateur existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        if (!$stmt->fetch()) {
            sendJsonResponse(['error' => 'Utilisateur non trouvé'], 404);
        }
        
        // Empêcher la suppression de l'admin connecté
        $currentUser = getCurrentUser();
        if ($currentUser['id'] == $userId) {
            sendJsonResponse(['error' => 'Vous ne pouvez pas supprimer votre propre compte'], 400);
        }
        
        // Supprimer l'utilisateur (les réservations associées seront supprimées en cascade)
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        
        sendJsonResponse(['message' => 'Utilisateur supprimé avec succès']);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// Méthode non autorisée
sendJsonResponse(['error' => 'Méthode non autorisée'], 405);
?>
