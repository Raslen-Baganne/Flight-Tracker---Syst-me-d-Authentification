# Dashboard Admin - Flight Tracker

Un dashboard admin moderne et complet pour la gestion du système Flight Tracker.

## 🎨 Caractéristiques

### Design Moderne
- Interface inspirée du design fourni avec thème rose élégant
- Animations fluides et transitions
- Design responsive adapté à tous les écrans
- Effets glassmorphism et gradients modernes

### Fonctionnalités Principales

#### 📊 Tableau de Bord
- Statistiques en temps réel (utilisateurs, vols, pays)
- Graphiques interactifs avec Chart.js
- Actualisation automatique des données

#### 👥 Gestion des Utilisateurs
- Ajout, modification et suppression d'utilisateurs
- Gestion des rôles (admin/utilisateur)
- Activation/désactivation des comptes
- Recherche et filtrage avancés

#### ✈️ Gestion des Vols
- Création et modification des vols
- Suivi des statuts (programmés, retardés, annulés, terminés)
- Gestion des places disponibles
- Association avec les pays de départ/arrivée

#### 🎫 Gestion des Réservations
- Création de réservations
- Suivi des statuts de réservation
- Gestion des statuts de paiement
- Mise à jour automatique des places disponibles

#### 📈 Analytiques et Rapports
- Graphiques de répartition des réservations
- Statistiques des vols par statut
- Croissance des utilisateurs dans le temps
- Revenus mensuels
- Génération de rapports détaillés

## 🛠️ Installation

### Prérequis
- PHP 8.0+
- MySQL 5.7+
- Apache/Nginx
- Extension PHP PDO

### Configuration

1. **Base de données**
   ```sql
   Importez le fichier Backend/database.sql dans votre base de données MySQL
   ```

2. **Configuration**
   - Modifiez `Backend/config.php` avec vos informations de base de données
   - Configurez les chemins corrects pour votre environnement

3. **Permissions**
   - Assurez-vous que le dossier Backend a les permissions d'écriture nécessaires

### Comptes par Défaut
- **Admin**: admin@flighttracker.com / admin123
- **Utilisateur**: user@flighttracker.com / user123

## 📁 Structure des Fichiers

```
├── Backend/
│   ├── config.php              # Configuration principale
│   ├── database.sql            # Structure de la base de données
│   ├── api-users.php           # API utilisateurs
│   ├── api-flights.php         # API vols
│   ├── api-reservations.php    # API réservations
│   ├── api-countries.php       # API pays
│   ├── api-stats.php           # API statistiques
│   ├── check-admin.php         # Vérification admin
│   ├── check-auth.php          # Vérification authentification
│   ├── login.php               # Connexion
│   ├── logout.php              # Déconnexion
│   ├── oauth-login.php         # Connexion OAuth
│   └── register.php            # Inscription
└── Frontend/
    └── admin-dashboard-modern.html  # Dashboard admin
```

## 🔌 API Endpoints

### Utilisateurs
- `GET /Backend/api-users.php` - Lister les utilisateurs
- `POST /Backend/api-users.php` - Créer un utilisateur
- `PUT /Backend/api-users.php?id={id}` - Mettre à jour un utilisateur
- `DELETE /Backend/api-users.php?id={id}` - Supprimer un utilisateur

### Vols
- `GET /Backend/api-flights.php` - Lister les vols
- `POST /Backend/api-flights.php` - Créer un vol
- `PUT /Backend/api-flights.php?id={id}` - Mettre à jour un vol
- `DELETE /Backend/api-flights.php?id={id}` - Supprimer un vol

### Réservations
- `GET /Backend/api-reservations.php` - Lister les réservations
- `POST /Backend/api-reservations.php` - Créer une réservation
- `PUT /Backend/api-reservations.php?id={id}` - Mettre à jour une réservation
- `DELETE /Backend/api-reservations.php?id={id}` - Supprimer une réservation

### Pays
- `GET /Backend/api-countries.php` - Lister les pays
- `POST /Backend/api-countries.php` - Ajouter un pays
- `PUT /Backend/api-countries.php?id={id}` - Mettre à jour un pays
- `DELETE /Backend/api-countries.php?id={id}` - Supprimer un pays

### Statistiques
- `GET /Backend/api-stats.php` - Obtenir les statistiques générales
- `POST /Backend/api-stats.php` - Générer un rapport détaillé

## 🎯 Utilisation

1. **Accès au Dashboard**
   - Connectez-vous avec le compte admin
   - Accédez à `Frontend/admin-dashboard-modern.html`

2. **Navigation**
   - Utilisez le menu principal pour naviguer entre les sections
   - Cliquez sur les cartes d'accès rapides pour accéder aux fonctionnalités

3. **Gestion**
   - Utilisez les boutons d'action pour ajouter, modifier ou supprimer des éléments
   - Les formulaires modaux permettent une saisie intuitive
   - Les notifications confirment les actions réussies

## 🔒 Sécurité

- Validation des entrées côté serveur
- Protection contre les injections SQL avec PDO
- Vérification des rôles pour chaque action
- Sessions sécurisées
- CORS configuré pour le développement

## 📊 Fonctionnalités Avancées

### Graphiques Interactifs
- Diagramme circulaire des réservations par statut
- Histogramme des vols par statut
- Courbe de croissance des utilisateurs
- Graphique des revenus mensuels

### Rapports
- Génération de rapports JSON détaillés
- Rapports par type (revenus, vols, utilisateurs)
- Périodes personnalisables
- Téléchargement automatique

### Recherche et Filtrage
- Recherche textuelle sur tous les champs
- Filtrage par statut
- Pagination des résultats
- Tri par colonnes

## 🚀 Améliorations Futures

- [ ] Éditer les utilisateurs et vols
- [ ] Gestion avancée des réservations
- [ ] Export des données en CSV/Excel
- [ ] Notifications en temps réel
- [ ] Tableaux de bord personnalisables
- [ ] Authentification à deux facteurs
- [ ] Journalisation des actions admin

## 🐛 Dépannage

### Problèmes Communs

1. **Erreur de connexion à la base de données**
   - Vérifiez les identifiants dans `config.php`
   - Assurez-vous que la base de données est accessible

2. **Erreur 403 Accès non autorisé**
   - Vérifiez que vous êtes connecté en tant qu'admin
   - Les sessions doivent être actives

3. **Données non affichées**
   - Vérifiez les erreurs dans la console du navigateur
   - Assurez-vous que les API retournent des données

## 📝 Notes

- Le dashboard utilise des données de démonstration dans la base de données
- Les mots de passe sont hashés avec bcrypt
- Le design est responsive et moderne
- Les API suivent les standards REST

## 👨‍💻 Développeur

Créé avec ❤️ pour Flight Tracker System
Technologies: PHP, MySQL, JavaScript, Bootstrap 5, Chart.js
