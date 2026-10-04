<?php
require_once 'config.php';

try {
    $pdo = getDBConnection();
    
    // Hash pour "admin123"
    $adminHash = password_hash('admin123', PASSWORD_DEFAULT);
    $userHash = password_hash('user123', PASSWORD_DEFAULT);
    
    // Mettre à jour les mots de passe
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
    $stmt->execute([$adminHash, 'admin@flighttracker.com']);
    $stmt->execute([$userHash, 'user@flighttracker.com']);
    
    echo "Mots de passe mis à jour avec succès!\n";
    echo "Admin: admin123\n";
    echo "User: user123\n";
    
} catch (PDOException $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
?>
