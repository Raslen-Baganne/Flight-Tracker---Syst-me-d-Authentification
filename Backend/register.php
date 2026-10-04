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

$requiredFields = ['firstName', 'lastName', 'email', 'password'];
foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        sendJsonResponse(['error' => "Le champ $field est requis"], 400);
    }
}

$firstName = sanitizeInput($data['firstName']);
$lastName = sanitizeInput($data['lastName']);
$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$password = $data['password'];

// Validation de l'email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJsonResponse(['error' => 'Email invalide'], 400);
}

// Validation du mot de passe
if (strlen($password) < 6) {
    sendJsonResponse(['error' => 'Le mot de passe doit contenir au moins 6 caractères'], 400);
}

try {
    $pdo = getDBConnection();
    
    // Vérification si l'email existe déjà
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        sendJsonResponse(['error' => 'Cet email est déjà utilisé'], 409);
    }
    
    // Hashage du mot de passe
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insertion du nouvel utilisateur
    $stmt = $pdo->prepare("
        INSERT INTO users (first_name, last_name, email, password, role) 
        VALUES (?, ?, ?, ?, 'user')
    ");
    
    if ($stmt->execute([$firstName, $lastName, $email, $hashedPassword])) {
        sendJsonResponse([
            'success' => true,
            'message' => 'Inscription réussie! Vous pouvez maintenant vous connecter.',
            'redirect' => '../Frontend/index.html',
            'require_login' => true
        ]);
    } else {
        sendJsonResponse(['error' => 'Erreur lors de l\'inscription'], 500);
    }
    
} catch (PDOException $e) {
    error_log("Erreur d'inscription: " . $e->getMessage());
    sendJsonResponse(['error' => 'Erreur serveur'], 500);
}
?>
