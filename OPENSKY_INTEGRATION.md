# Intégration OpenSky Network - Approche Hybride

## Vue d'ensemble

Ce projet utilise maintenant une approche hybride pour la gestion des vols :
- **Base de données locale** : Pour les vols créés manuellement avec contrôle CRUD complet
- **API OpenSky Network** : Pour l'import de vols en temps réel avec données de position

## Modifications apportées

### 1. Base de données (`database.sql`)

Nouveaux champs ajoutés à la table `flights` :
- `source` : ENUM('local', 'opensky') - Indique la source du vol
- `icao24` : Identifiant unique de l'appareil (OpenSky)
- `latitude` : Position latitude (OpenSky)
- `longitude` : Position longitude (OpenSky)
- `altitude` : Altitude en mètres (OpenSky)
- `velocity` : Vitesse en m/s (OpenSky)
- `heading` : Cap en degrés (OpenSky)
- `on_ground` : Si l'avion est au sol (OpenSky)
- `last_position_update` : Dernière mise à jour position (OpenSky)

### 2. Backend API (`api-flights.php`)

**Nouveaux endpoints :**

1. **GET avec recherche par numéro de vol** (sans authentification)
   - URL : `../Backend/api-flights.php?flight_number=AF123`
   - Usage : Dashboard User pour chercher un vol localement
   - Retour : Données du vol si trouvé, ou indication non trouvé

2. **POST Import depuis OpenSky** (admin seulement)
   - URL : `../Backend/api-flights.php?action=import-opensky`
   - Body : `{"flight_number": "AF123"}`
   - Fonction : Importe un vol depuis OpenSky vers la base locale
   - Retour : Vol créé avec données temps réel

3. **POST Mise à jour temps réel OpenSky** (admin seulement)
   - URL : `../Backend/api-flights.php?action=update-opensky`
   - Body : `{"id": 123}`
   - Fonction : Met à jour les données temps réel d'un vol OpenSky
   - Retour : Vol avec données mises à jour

**Modifications existantes :**
- GET avec filtre par source (`?source=local` ou `?source=opensky`)

### 3. Dashboard Admin (`admin-dashboard.html`)

**Nouvelles fonctionnalités :**

1. **Bouton "Importer OpenSky"**
   - Permet d'importer un vol depuis OpenSky en entrant son callsign
   - Le vol est ajouté à la base locale avec `source='opensky'`

2. **Filtre par source**
   - Nouveau sélecteur pour filtrer : "Toutes les sources", "Local", "OpenSky (temps réel)"

3. **Indicateur visuel**
   - Badge "Live" avec icône satellite pour les vols OpenSky
   - Affiché dans la colonne "Vol"

4. **Bouton de mise à jour temps réel**
   - Bouton "Refresh" (icône sync) pour les vols OpenSky uniquement
   - Met à jour les données de position depuis OpenSky

### 4. Dashboard User (`user-dashboard.html`)

**Nouveau comportement de recherche :**

La fonction `trackFlight()` suit maintenant cet ordre :
1. Cherche d'abord dans la base de données locale
2. Si trouvé :
   - Si `source='opensky'` : Affiche les données temps réel stockées localement
   - Si `source='local'` : Affiche les informations du vol local
3. Si non trouvé localement : Cherche dans l'API OpenSky en temps réel
4. Si toujours non trouvé : Affiche des données de démonstration

**Nouvelles fonctions d'affichage :**
- `displayLocalFlight()` : Affiche un vol local standard
- `displayLocalOpenSkyFlight()` : Affiche un vol OpenSky avec données temps réel

## Migration de la base de données

Pour mettre à jour une base de données existante :

```bash
cd Backend
mysql -u votre_user -p flight_tracker < migration-add-opensky-fields.sql
```

Ou exécuter manuellement dans phpMyAdmin ou MySQL Workbench le contenu de `migration-add-opensky-fields.sql`

## Utilisation

### Pour les administrateurs

1. **Importer un vol depuis OpenSky :**
   - Aller dans Dashboard Admin → Gestion des Vols
   - Cliquer sur "Importer OpenSky"
   - Entrer le callsign (ex: AF123, LH456)
   - Le vol est importé avec ses données temps réel

2. **Mettre à jour les données temps réel :**
   - Dans la liste des vols, identifier les vols avec badge "Live"
   - Cliquer sur le bouton "Refresh" (icône sync)
   - Les données de position sont mises à jour depuis OpenSky

3. **Filtrer par source :**
   - Utiliser le sélecteur "Toutes les sources / Local / OpenSky (temps réel)"
   - Pour voir uniquement les vols importés d'OpenSky

### Pour les utilisateurs

1. **Rechercher un vol :**
   - Aller dans Dashboard User → Suivi des vols
   - Entrer le numéro de vol
   - Le système cherche d'abord dans la base locale
   - Si le vol a été importé par l'admin, il affiche les données temps réel
   - Sinon, il cherche dans OpenSky en temps réel

## Avantages de cette approche

1. **Contrôle total** : Les administrateurs peuvent créer/modifier/supprimer des vols localement
2. **Données temps réel** : Possibilité d'importer et mettre à jour des vols OpenSky
3. **Flexibilité** : Mix entre vols gérés manuellement et vols temps réel
4. **Performance** : Recherche rapide dans la base locale pour les vols importés
5. **Fiabilité** : Fonctionne même si OpenSky est indisponible (pour les vols locaux)
6. **Cohérence** : Les vols importés sont gérés dans la même base que les vols locaux

## Limitations

1. **OpenSky est en lecture seule** : On ne peut pas modifier les données de base d'un vol OpenSky (compagnie, trajet, etc.)
2. **Dépendance API** : L'import et la mise à jour dépendent de la disponibilité d'OpenSky
3. **Données estimées** : Les heures de départ/arrivée sont estimées lors de l'import
4. **Aéroports limités** : L'import utilise une liste prédéfinie d'aéroports pour la démo

## Améliorations futures possibles

1. Import en lot de plusieurs vols OpenSky
2. Synchronisation automatique périodique des vols OpenSky
3. Intégration avec une API de cartes pour afficher la trajectoire
4. Historique des positions pour les vols OpenSky
5. Alertes automatiques lors des changements de statut
6. Intégration avec plus d'APIs de vols (FlightAware, etc.)
