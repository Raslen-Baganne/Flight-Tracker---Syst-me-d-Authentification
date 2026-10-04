<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Méthode non autorisée'], 405);
}

// Récupération et validation des données
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    sendJsonResponse(['error' => 'Données invalides'], 400);
}

if (empty($data['email']) || empty($data['password'])) {
    sendJsonResponse(['error' => 'Email et mot de passe requis'], 400);
}

$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$password = $data['password'];

// Validation de l'email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJsonResponse(['error' => 'Email invalide'], 400);
}

try {
    $pdo = getDBConnection();
    
    // Recherche de l'utilisateur par email
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendJsonResponse(['error' => 'Email ou mot de passe incorrect'], 401);
    }
    
    // Vérification du mot de passe
    if (!password_verify($password, $user['password'])) {
        sendJsonResponse(['error' => 'Email ou mot de passe incorrect'], 401);
    }
    
    // Mise à jour de la date de dernière connexion
    $stmt = $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Création de la session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
    
    // Préparation des données utilisateur à retourner (sans le mot de passe)
    $userData = [
        'id' => $user['id'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'avatar_url' => $user['avatar_url'],
        'created_at' => $user['created_at'],
        'last_login' => $user['last_login']
    ];
    
    // Détermination de l'URL de redirection selon le rôle
    $redirectUrl = ($user['role'] === 'admin') ? 
        'admin-dashboard.html' : 
        'user-dashboard.html';
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Connexion réussie',
        'user' => $userData,
        'redirect' => $redirectUrl
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur de connexion: " . $e->getMessage());
    sendJsonResponse(['error' => 'Erreur serveur'], 500);
}
?>
