<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Méthode non autorisée'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['provider']) || empty($data['oauth_id']) || empty($data['email'])) {
    sendJsonResponse(['error' => 'Données OAuth invalides'], 400);
}

$provider = sanitizeInput($data['provider']);
$oauthId = sanitizeInput($data['oauth_id']);
$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$firstName = sanitizeInput($data['first_name'] ?? '');
$lastName = sanitizeInput($data['last_name'] ?? '');
$avatarUrl = sanitizeInput($data['avatar_url'] ?? '');

// Validation du provider
if (!in_array($provider, ['google', 'facebook'])) {
    sendJsonResponse(['error' => 'Fournisseur OAuth non supporté'], 400);
}

// Validation de l'email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJsonResponse(['error' => 'Email invalide'], 400);
}

try {
    $pdo = getDBConnection();
    
    // Vérification si l'utilisateur existe déjà avec cet OAuth
    $stmt = $pdo->prepare("SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?");
    $stmt->execute([$provider, $oauthId]);
    $existingUser = $stmt->fetch();
    
    if ($existingUser) {
        // Utilisateur existe, mise à jour des informations et connexion
        $stmt = $pdo->prepare("
            UPDATE users SET 
                first_name = ?, 
                last_name = ?, 
                avatar_url = ?, 
                last_login = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $stmt->execute([$firstName, $lastName, $avatarUrl, $existingUser['id']]);
        
        // Création de la session
        $_SESSION['user_id'] = $existingUser['id'];
        $_SESSION['user_email'] = $existingUser['email'];
        $_SESSION['user_role'] = $existingUser['role'];
        $_SESSION['user_name'] = $existingUser['first_name'] . ' ' . $existingUser['last_name'];
        
        $redirectUrl = ($existingUser['role'] === 'admin') ? 
            '../Frontend/admin-dashboard.html' : 
            '../Frontend/user-dashboard.html';
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Connexion réussie',
            'user' => [
                'id' => $existingUser['id'],
                'first_name' => $existingUser['first_name'],
                'last_name' => $existingUser['last_name'],
                'email' => $existingUser['email'],
                'role' => $existingUser['role'],
                'avatar_url' => $existingUser['avatar_url']
            ],
            'redirect' => $redirectUrl,
            'existing_user' => true
        ]);
        
    } else {
        // Vérification si l'email existe déjà avec une autre méthode
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $emailUser = $stmt->fetch();
        
        if ($emailUser) {
            sendJsonResponse([
                'error' => 'Cet email est déjà utilisé avec une autre méthode de connexion',
                'code' => 'email_exists'
            ], 409);
        }
        
        // Création d'un nouvel utilisateur OAuth
        $stmt = $pdo->prepare("
            INSERT INTO users (first_name, last_name, email, oauth_provider, oauth_id, avatar_url, role) 
            VALUES (?, ?, ?, ?, ?, ?, 'user')
        ");
        
        if ($stmt->execute([$firstName, $lastName, $email, $provider, $oauthId, $avatarUrl])) {
            $userId = $pdo->lastInsertId();
            
            // Création de la session
            $_SESSION['user_id'] = $userId;
            $_SESSION['user_email'] = $email;
            $_SESSION['user_role'] = 'user';
            $_SESSION['user_name'] = $firstName . ' ' . $lastName;
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Compte créé et connexion réussie',
                'user' => [
                    'id' => $userId,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'role' => 'user',
                    'avatar_url' => $avatarUrl
                ],
                'redirect' => '../Frontend/user-dashboard.html',
                'existing_user' => false
            ]);
        } else {
            sendJsonResponse(['error' => 'Erreur lors de la création du compte'], 500);
        }
    }
    
} catch (PDOException $e) {
    error_log("Erreur OAuth: " . $e->getMessage());
    sendJsonResponse(['error' => 'Erreur serveur'], 500);
}
?>
