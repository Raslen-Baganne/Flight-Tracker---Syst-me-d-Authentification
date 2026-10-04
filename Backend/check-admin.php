<?php
require_once 'config.php';
$pdo = getDBConnection();
$stmt = $pdo->prepare('SELECT email, password FROM users WHERE role = "admin"');
$stmt->execute();
$admin = $stmt->fetch();
echo "Admin email: " . $admin['email'] . "\n";
echo "Password hash: " . $admin['password'] . "\n";

// Test some common passwords
$passwords = ['admin123', 'Admin123', 'admin', 'Admin', 'password', 'Password123'];
foreach ($passwords as $pwd) {
    if (password_verify($pwd, $admin['password'])) {
        echo "CORRECT PASSWORD: $pwd\n";
        break;
    }
}
?>
