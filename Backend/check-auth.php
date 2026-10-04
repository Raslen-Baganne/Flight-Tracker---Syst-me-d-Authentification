<?php
require_once 'config.php';

header('Content-Type: application/json');

if (isLoggedIn()) {
    $user = getCurrentUser();
    if ($user) {
        sendJsonResponse([
            'authenticated' => true,
            'user' => [
                'id' => $user['id'],
                'name' => $user['first_name'] . ' ' . $user['last_name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'avatar_url' => $user['avatar_url']
            ]
        ]);
    }
}

sendJsonResponse([
    'authenticated' => false,
    'message' => 'Non authentifié'
]);
?>
