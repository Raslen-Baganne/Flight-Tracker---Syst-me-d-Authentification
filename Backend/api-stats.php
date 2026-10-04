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

// GET - Récupérer les statistiques
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    checkAdmin();
    
    try {
        $pdo = getDBConnection();
        
        // Statistiques générales
        $stats = [];
        
        // Nombre total d'utilisateurs
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users");
        $stmt->execute();
        $stats['total_users'] = $stmt->fetch()['count'];
        
        // Nombre d'utilisateurs actifs
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE is_active = 1");
        $stmt->execute();
        $stats['active_users'] = $stmt->fetch()['count'];
        
        // Nombre total de vols
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM flights");
        $stmt->execute();
        $stats['total_flights'] = $stmt->fetch()['count'];
        
        // Vols par statut
        $stmt = $pdo->prepare("SELECT status, COUNT(*) as count FROM flights GROUP BY status");
        $stmt->execute();
        $flightStatuses = $stmt->fetchAll();
        $stats['flights_by_status'] = [];
        foreach ($flightStatuses as $status) {
            $stats['flights_by_status'][$status['status']] = $status['count'];
        }
        
        // Vols actifs (programmés ou en retard)
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM flights WHERE status IN ('scheduled', 'delayed')");
        $stmt->execute();
        $stats['active_flights'] = $stmt->fetch()['count'];
        
        // Nombre total de réservations
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM reservations");
        $stmt->execute();
        $stats['total_reservations'] = $stmt->fetch()['count'];
        
        // Réservations par statut
        $stmt = $pdo->prepare("SELECT status, COUNT(*) as count FROM reservations GROUP BY status");
        $stmt->execute();
        $reservationStatuses = $stmt->fetchAll();
        $stats['reservations_by_status'] = [];
        foreach ($reservationStatuses as $status) {
            $stats['reservations_by_status'][$status['status']] = $status['count'];
        }
        
        // Réservations par statut de paiement
        $stmt = $pdo->prepare("SELECT payment_status, COUNT(*) as count FROM reservations GROUP BY payment_status");
        $stmt->execute();
        $paymentStatuses = $stmt->fetchAll();
        $stats['reservations_by_payment_status'] = [];
        foreach ($paymentStatuses as $status) {
            $stats['reservations_by_payment_status'][$status['status']] = $status['count'];
        }
        
        // Nombre total de pays
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM countries");
        $stmt->execute();
        $stats['total_countries'] = $stmt->fetch()['count'];
        
        // Revenu total (réservations payées)
        $stmt = $pdo->prepare("SELECT SUM(total_price) as total FROM reservations WHERE payment_status = 'paid'");
        $stmt->execute();
        $stats['total_revenue'] = $stmt->fetch()['total'] ?? 0;
        
        // Revenu mensuel (6 derniers mois)
        $stmt = $pdo->prepare("SELECT DATE_FORMAT(booking_date, '%Y-%m') as month, 
                                      SUM(total_price) as revenue
                               FROM reservations 
                               WHERE payment_status = 'paid' 
                               AND booking_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                               GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
                               ORDER BY month");
        $stmt->execute();
        $monthlyRevenue = $stmt->fetchAll();
        $stats['monthly_revenue'] = $monthlyRevenue;
        
        // Croissance des utilisateurs (6 derniers mois)
        $stmt = $pdo->prepare("SELECT DATE_FORMAT(created_at, '%Y-%m') as month, 
                                      COUNT(*) as users
                               FROM users 
                               WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                               GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                               ORDER BY month");
        $stmt->execute();
        $userGrowth = $stmt->fetchAll();
        $stats['user_growth'] = $userGrowth;
        
        // Réservations mensuelles (6 derniers mois)
        $stmt = $pdo->prepare("SELECT DATE_FORMAT(booking_date, '%Y-%m') as month, 
                                      COUNT(*) as reservations
                               FROM reservations 
                               WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                               GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
                               ORDER BY month");
        $stmt->execute();
        $monthlyReservations = $stmt->fetchAll();
        $stats['monthly_reservations'] = $monthlyReservations;
        
        // Top 5 des destinations les plus populaires
        $stmt = $pdo->prepare("SELECT f.arrival_city, COUNT(*) as count
                               FROM reservations r
                               JOIN flights f ON r.flight_id = f.id
                               GROUP BY f.arrival_city
                               ORDER BY count DESC
                               LIMIT 5");
        $stmt->execute();
        $topDestinations = $stmt->fetchAll();
        $stats['top_destinations'] = $topDestinations;
        
        // Top 5 des compagnies aériennes les plus utilisées
        $stmt = $pdo->prepare("SELECT f.airline, COUNT(*) as count
                               FROM reservations r
                               JOIN flights f ON r.flight_id = f.id
                               GROUP BY f.airline
                               ORDER BY count DESC
                               LIMIT 5");
        $stmt->execute();
        $topAirlines = $stmt->fetchAll();
        $stats['top_airlines'] = $topAirlines;
        
        // Taux d'occupation des vols
        $stmt = $pdo->prepare("SELECT f.flight_number, 
                                      f.airline,
                                      f.departure_city,
                                      f.arrival_city,
                                      f.total_seats,
                                      f.available_seats,
                                      ROUND(((f.total_seats - f.available_seats) / f.total_seats) * 100, 2) as occupancy_rate
                               FROM flights f
                               WHERE f.status IN ('scheduled', 'delayed')
                               ORDER BY occupancy_rate DESC
                               LIMIT 10");
        $stmt->execute();
        $flightOccupancy = $stmt->fetchAll();
        $stats['flight_occupancy'] = $flightOccupancy;
        
        // Statistiques des vols par mois (6 derniers mois)
        $stmt = $pdo->prepare("SELECT DATE_FORMAT(departure_time, '%Y-%m') as month, 
                                      COUNT(*) as flights
                               FROM flights 
                               WHERE departure_time >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                               GROUP BY DATE_FORMAT(departure_time, '%Y-%m')
                               ORDER BY month");
        $stmt->execute();
        $monthlyFlights = $stmt->fetchAll();
        $stats['monthly_flights'] = $monthlyFlights;
        
        // Utilisateurs par rôle
        $stmt = $pdo->prepare("SELECT role, COUNT(*) as count FROM users GROUP BY role");
        $stmt->execute();
        $usersByRole = $stmt->fetchAll();
        $stats['users_by_role'] = [];
        foreach ($usersByRole as $role) {
            $stats['users_by_role'][$role['role']] = $role['count'];
        }
        
        // Derniers utilisateurs inscrits
        $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, role, created_at
                               FROM users 
                               ORDER BY created_at DESC 
                               LIMIT 5");
        $stmt->execute();
        $recentUsers = $stmt->fetchAll();
        $stats['recent_users'] = $recentUsers;
        
        // Dernières réservations
        $stmt = $pdo->prepare("SELECT r.reservation_number, r.passenger_name, r.total_price, r.status, 
                                      f.flight_number, f.departure_city, f.arrival_city, r.booking_date
                               FROM reservations r
                               JOIN flights f ON r.flight_id = f.id
                               ORDER BY r.booking_date DESC 
                               LIMIT 5");
        $stmt->execute();
        $recentReservations = $stmt->fetchAll();
        $stats['recent_reservations'] = $recentReservations;
        
        sendJsonResponse([
            'stats' => $stats,
            'generated_at' => date('Y-m-d H:i:s')
        ]);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// POST - Générer un rapport détaillé
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    checkAdmin();
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $reportType = $data['report_type'] ?? 'summary';
        $startDate = $data['start_date'] ?? null;
        $endDate = $data['end_date'] ?? null;
        
        $pdo = getDBConnection();
        
        $report = [];
        $report['report_type'] = $reportType;
        $report['generated_at'] = date('Y-m-d H:i:s');
        $report['period'] = [
            'start_date' => $startDate,
            'end_date' => $endDate
        ];
        
        switch ($reportType) {
            case 'revenue':
                // Rapport de revenus détaillé
                $whereClause = "WHERE payment_status = 'paid'";
                $params = [];
                
                if ($startDate) {
                    $whereClause .= " AND booking_date >= ?";
                    $params[] = $startDate;
                }
                if ($endDate) {
                    $whereClause .= " AND booking_date <= ?";
                    $params[] = $endDate;
                }
                
                $stmt = $pdo->prepare("SELECT SUM(total_price) as total_revenue,
                                              COUNT(*) as total_reservations,
                                              AVG(total_price) as avg_reservation_value
                                       FROM reservations 
                                       $whereClause");
                $stmt->execute($params);
                $revenueStats = $stmt->fetch();
                $report['revenue_summary'] = $revenueStats;
                
                // Revenus par mois
                $stmt = $pdo->prepare("SELECT DATE_FORMAT(booking_date, '%Y-%m') as month,
                                              SUM(total_price) as revenue,
                                              COUNT(*) as reservations
                                       FROM reservations 
                                       $whereClause
                                       GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
                                       ORDER BY month");
                $stmt->execute($params);
                $report['monthly_revenue'] = $stmt->fetchAll();
                break;
                
            case 'flights':
                // Rapport des vols détaillé
                $whereClause = "";
                $params = [];
                
                if ($startDate) {
                    $whereClause .= " WHERE departure_time >= ?";
                    $params[] = $startDate;
                }
                if ($endDate) {
                    $whereClause .= ($whereClause ? " AND" : " WHERE") . " departure_time <= ?";
                    $params[] = $endDate;
                }
                
                $stmt = $pdo->prepare("SELECT COUNT(*) as total_flights,
                                              SUM(total_seats) as total_capacity,
                                              SUM(total_seats - available_seats) as total_booked,
                                              AVG(price) as avg_price
                                       FROM flights 
                                       $whereClause");
                $stmt->execute($params);
                $flightStats = $stmt->fetch();
                $report['flight_summary'] = $flightStats;
                
                // Vols par statut
                $stmt = $pdo->prepare("SELECT status, COUNT(*) as count
                                       FROM flights 
                                       $whereClause
                                       GROUP BY status");
                $stmt->execute($params);
                $report['flights_by_status'] = $stmt->fetchAll();
                break;
                
            case 'users':
                // Rapport des utilisateurs détaillé
                $whereClause = "";
                $params = [];
                
                if ($startDate) {
                    $whereClause .= " WHERE created_at >= ?";
                    $params[] = $startDate;
                }
                if ($endDate) {
                    $whereClause .= ($whereClause ? " AND" : " WHERE") . " created_at <= ?";
                    $params[] = $endDate;
                }
                
                $stmt = $pdo->prepare("SELECT COUNT(*) as total_users,
                                              COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users
                                       FROM users 
                                       $whereClause");
                $stmt->execute($params);
                $userStats = $stmt->fetch();
                $report['user_summary'] = $userStats;
                
                // Utilisateurs par rôle
                $stmt = $pdo->prepare("SELECT role, COUNT(*) as count
                                       FROM users 
                                       $whereClause
                                       GROUP BY role");
                $stmt->execute($params);
                $report['users_by_role'] = $stmt->fetchAll();
                
                // Nouveaux utilisateurs par mois
                $stmt = $pdo->prepare("SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
                                              COUNT(*) as new_users
                                       FROM users 
                                       $whereClause
                                       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                                       ORDER BY month");
                $stmt->execute($params);
                $report['user_growth'] = $stmt->fetchAll();
                break;
                
            default:
                // Rapport résumé
                $report = generateSummaryReport($pdo, $startDate, $endDate);
                break;
        }
        
        sendJsonResponse([
            'report' => $report,
            'message' => 'Rapport généré avec succès'
        ]);
        
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

// Fonction pour générer un rapport résumé
function generateSummaryReport($pdo, $startDate = null, $endDate = null) {
    $dateFilter = "";
    $params = [];
    
    if ($startDate) {
        $dateFilter = "WHERE created_at >= ? AND created_at <= ?";
        $params[] = $startDate;
        $params[] = $endDate;
    }
    
    $report = [];
    $report['report_type'] = 'summary';
    $report['generated_at'] = date('Y-m-d H:i:s');
    
    // Statistiques générales
    $stmt = $pdo->prepare("SELECT 
        (SELECT COUNT(*) FROM users $dateFilter) as total_users,
        (SELECT COUNT(*) FROM flights) as total_flights,
        (SELECT COUNT(*) FROM reservations) as total_reservations,
        (SELECT COUNT(*) FROM countries) as total_countries,
        (SELECT SUM(total_price) FROM reservations WHERE payment_status = 'paid') as total_revenue");
    
    if ($startDate) {
        $stmt->execute($params);
    } else {
        $stmt->execute();
    }
    
    $summary = $stmt->fetch();
    $report['summary'] = $summary;
    
    return $report;
}

// Méthode non autorisée
sendJsonResponse(['error' => 'Méthode non autorisée'], 405);
?>
