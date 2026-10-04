<?php
// Proxy pour OpenSky Network API - Contourne les restrictions CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$openskyUrl = 'https://opensky-network.org/api/states/all';

try {
    // Initialiser cURL
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $openskyUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    
    $response = curl_exec($ch);
    
    if (curl_errno($ch)) {
        throw new Exception('Erreur cURL: ' . curl_error($ch));
    }
    
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("OpenSky API returned HTTP $httpCode");
    }
    
    // Renvoyer la réponse directement
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'states' => []
    ]);
}
?>
