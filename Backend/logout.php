<?php
require_once 'config.php';

// Détruire la session
session_destroy();

// Suppression des cookies de session
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Vérifier si c'est une requête AJAX
if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
    // Réponse JSON pour les requêtes AJAX
    header('Content-Type: application/json');
    sendJsonResponse([
        'success' => true,
        'message' => 'Déconnexion réussie',
        'redirect' => '../Frontend/index.html'
    ]);
} else {
    // Redirection directe pour les requêtes normales
    header('Location: ../Frontend/index.html');
    exit();
}
?>
