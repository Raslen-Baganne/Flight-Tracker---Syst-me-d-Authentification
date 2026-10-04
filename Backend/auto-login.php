<?php
require_once 'config.php';

header('Content-Type: application/json');

// Auto-login with test user
$email = 'user@flighttracker.com';
$password = 'password';

try {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        // Set session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role'];
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Auto-login successful',
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ]);
    } else {
        sendJsonResponse(['success' => false, 'error' => 'User not found'], 404);
    }
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error'], 500);
}
