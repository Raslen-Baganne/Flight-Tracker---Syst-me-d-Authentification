# Flight Tracker - Système d'Authentification

## 📋 Description

Ce projet implémente un système d'authentification complet avec PHP backend et base de données MySQL, intégré au projet Flight Tracker existant.

## 🚀 Fonctionnalités

- ✅ Inscription d'utilisateurs
- ✅ Connexion avec email/mot de passe
- ✅ Authentification OAuth (Google/Facebook simulée)
- ✅ Rôles utilisateurs (user/admin)
- ✅ Dashboards différents selon le rôle
- ✅ Sessions sécurisées
- ✅ Validation des données
- ✅ Gestion des erreurs

## 📁 Structure du projet

```
dashboard-Project_web-main - Copie - Copie/
├── Backend/
│   ├── config.php              # Configuration de la base de données
│   ├── database.sql            # Script SQL pour créer la base de données
│   ├── register.php            # Script d'inscription
│   ├── login.php               # Script de connexion
│   ├── logout.php              # Script de déconnexion
│   ├── oauth-login.php         # Script d'authentification OAuth
│   └── check-auth.php          # Vérification de l'authentification
├── Frontend/
│   ├── index.html              # Page d'accueil (avec bouton Connexion)
│   ├── dashboard.html          # Dashboard principal
│   ├── user-dashboard.html     # Dashboard utilisateur
│   ├── admin-dashboard.html    # Dashboard administrateur
│   ├── about.html              # Page À propos
│   ├── passengers.html         # Page Passagers
│   ├── contact.html            # Page Contact
│   ├── css/
│   │   ├── style.css           # Styles principaux
│   │   └── auth-modal.css      # Styles du modal d'authentification
│   └── js/
│       ├── auth-modal.js       # Logique du modal d'authentification
│       └── ...                 # Autres scripts JS
└── README.md                   # Ce fichier
```

## 🛠️ Installation

### 1. Prérequis

- XAMPP (ou WAMP/MAMP) avec Apache et MySQL
- PHP 7.4 ou supérieur
- Navigateur web moderne

### 2. Configuration de la base de données

1. Démarrez XAMPP et lancez Apache et MySQL
2. Ouvrez phpMyAdmin (http://localhost/phpmyadmin)
3. Créez une nouvelle base de données nommée `flight_tracker`
4. Importez le fichier `Backend/database.sql` ou exécutez-le manuellement

### 3. Configuration du projet

1. Placez le dossier du projet dans le répertoire `htdocs` de XAMPP
2. Le projet sera accessible via `http://localhost/dashboard-Project_web-main - Copie - Copie/`

### 4. Configuration de la base de données (si nécessaire)

Si vos identifiants MySQL sont différents, modifiez le fichier `Backend/config.php` :

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'flight_tracker');
define('DB_USER', 'root');      // Changez si nécessaire
define('DB_PASS', '');          // Changez si nécessaire
```

## 🔐 Comptes par défaut

Le système inclut deux comptes de test :

### Administrateur
- **Email**: `admin@flighttracker.com`
- **Mot de passe**: `admin123`
- **Rôle**: Admin
- **Dashboard**: `admin-dashboard.html`

### Utilisateur
- **Email**: `user@flighttracker.com`
- **Mot de passe**: `user123`
- **Rôle**: User
- **Dashboard**: `user-dashboard.html`

## 🎯 Utilisation

### 1. Accès au système

1. Ouvrez `http://localhost/dashboard-Project_web-main - Copie - Copie/Frontend/`
2. Cliquez sur le bouton "Connexion" dans la navigation
3. Utilisez le formulaire pour vous connecter ou vous inscrire

### 2. Flux d'authentification

1. **Inscription**: Remplissez le formulaire → Création du compte → Redirection vers dashboard utilisateur
2. **Connexion**: Email + mot de passe → Vérification → Redirection selon le rôle
3. **OAuth**: Google/Facebook → Création automatique du compte → Redirection vers dashboard utilisateur

### 3. Dashboards

- **Utilisateur**: "Welcome to Dashboard User" avec fonctionnalités de base
- **Admin**: "Welcome to Dashboard Admin" avec outils d'administration

## 🔧 Personnalisation

### Modifier les rôles

Pour changer le rôle d'un utilisateur directement dans la base de données :

```sql
UPDATE users SET role = 'admin' WHERE email = 'email@example.com';
```

### Ajouter de nouveaux champs

1. Modifiez la table `users` dans phpMyAdmin
2. Mettez à jour les scripts PHP correspondants
3. Adaptez le formulaire HTML si nécessaire

### Intégrer de vraies APIs OAuth

Remplacez les données simulées dans `auth-modal.js` par de vrais appels aux APIs Google/Facebook :

```javascript
// Exemple pour Google OAuth
const googleAuth = async () => {
    // Implémentez l'authentification Google réelle ici
};
```

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de connexion à la base de données**
   - Vérifiez que XAMPP est en cours d'exécution
   - Vérifiez les identifiants dans `config.php`

2. **Page blanche**
   - Activez l'affichage des erreurs PHP dans `config.php`
   - Vérifiez les logs d'erreurs Apache

3. **Redirection ne fonctionne pas**
   - Vérifiez les chemins dans les scripts PHP
   - Assurez-vous que les fichiers existent

### Logs d'erreurs

- Apache: `C:\xampp\apache\logs\error.log`
- PHP: Ajoutez `error_log('message');` dans le code PHP

## 🛡️ Sécurité

- Les mots de passe sont hashés avec `password_hash()`
- Les entrées sont validées et nettoyées
- Protection contre les injections SQL avec PDO
- Sessions sécurisées

## 📝 Notes de développement

- Le système utilise des sessions PHP pour maintenir l'état de connexion
- Les mots de passe par défaut sont faibles, changez-les en production
- L'authentification OAuth est simulée pour la démonstration
- Le code est commenté pour faciliter la maintenance

## 🔄 Mises à jour futures

- [ ] Intégration complète des APIs Google/Facebook
- [ ] Système de récupération de mot de passe
- [ ] Validation par email
- [ ] Tableau de bord administrateur complet
- [ ] API REST pour la gestion des utilisateurs

---

**Développé avec ❤️ pour le projet Flight Tracker**
