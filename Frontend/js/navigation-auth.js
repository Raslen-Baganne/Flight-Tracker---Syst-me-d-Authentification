// ===================================
// NAVIGATION AUTHENTICATION JAVASCRIPT
// Gestion de l'affichage conditionnel de la navigation
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Vérifier le statut de connexion au chargement de la page
    checkLoginStatus();
    
    // Écouter les changements de statut de connexion
    window.addEventListener('storage', function(e) {
        if (e.key === 'userLoggedIn') {
            checkLoginStatus();
        }
    });
    
    // Écouter les événements de connexion/déconnexion personnalisés
    document.addEventListener('userLoggedIn', function() {
        updateNavigation(true);
    });
    
    document.addEventListener('userLoggedOut', function() {
        updateNavigation(false);
    });
});

/**
 * Vérifie le statut de connexion de l'utilisateur
 */
async function checkLoginStatus() {
    try {
        const response = await fetch('http://localhost/dashboard-Project_web-main - Copie/Backend/check-auth.php', {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        updateNavigation(data.logged_in);
        
        // Mettre à jour le stockage local pour la synchronisation entre onglets
        localStorage.setItem('userLoggedIn', data.logged_in);
        
    } catch (error) {
        console.error('Erreur lors de la vérification du statut de connexion:', error);
        updateNavigation(false);
    }
}

/**
 * Met à jour la navigation en fonction du statut de connexion
 * @param {boolean} isLoggedIn - Statut de connexion
 */
function updateNavigation(isLoggedIn) {
    const protectedItems = document.querySelectorAll('.nav-item-protected');
    const authButton = document.getElementById('authButton');
    
    // Masquer/afficher les éléments protégés (Dashboard, Passagers)
    protectedItems.forEach(item => {
        if (isLoggedIn) {
            item.style.display = 'block';
            item.classList.remove('d-none');
        } else {
            item.style.display = 'none';
            item.classList.add('d-none');
        }
    });
    
    // Mettre à jour le bouton d'authentification
    if (authButton) {
        if (isLoggedIn) {
            authButton.innerHTML = '<i class="fas fa-sign-out-alt me-1"></i>Déconnexion';
            authButton.removeAttribute('data-bs-toggle');
            authButton.removeAttribute('data-bs-target');
            authButton.classList.remove('btn-outline-light');
            authButton.classList.add('btn-danger');
            authButton.addEventListener('click', handleLogout);
        } else {
            authButton.innerHTML = '<i class="fas fa-sign-in-alt me-1"></i>Connexion';
            authButton.setAttribute('data-bs-toggle', 'modal');
            authButton.setAttribute('data-bs-target', '#authModal');
            authButton.classList.remove('btn-danger');
            authButton.classList.add('btn-outline-light');
            authButton.removeEventListener('click', handleLogout);
        }
    }
    
    // Mettre à jour la classe active sur la page actuelle
    updateActiveNavigation();
}

/**
 * Gère la déconnexion de l'utilisateur
 */
async function handleLogout() {
    try {
        const response = await fetch('http://localhost/dashboard-Project_web-main - Copie/Backend/logout.php', {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Mettre à jour le statut de connexion
            localStorage.setItem('userLoggedIn', 'false');
            updateNavigation(false);
            
            // Afficher un message de succès
            showNotification('Déconnexion réussie!', 'success');
            
            // Rediriger vers la page d'accueil après un court délai
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showNotification('Erreur lors de la déconnexion', 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        showNotification('Erreur de connexion au serveur', 'error');
    }
}

/**
 * Met à jour la classe active sur l'élément de navigation actuel
 */
function updateActiveNavigation() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop().replace('.html', '') || 'index';
    
    // Retirer toutes les classes actives
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Ajouter la classe active à l'élément correspondant
    const pageMap = {
        'index': 'index.html',
        'about': 'about.html',
        'dashboard': 'dashboard.html',
        'passengers': 'passengers.html',
        'contact': 'contact.html'
    };
    
    const targetHref = pageMap[currentPage];
    if (targetHref) {
        const activeLink = document.querySelector(`.nav-link[href="${targetHref}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

/**
 * Affiche une notification à l'utilisateur
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Ajouter au corps du document
    document.body.appendChild(notification);
    
    // Supprimer automatiquement après 3 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

/**
 * Fonction utilitaire pour inclure la navigation dans les pages
 */
function includeNavigation() {
    const navigationContainer = document.getElementById('navigation-container');
    if (navigationContainer) {
        fetch('components/navigation.html')
            .then(response => response.text())
            .then(html => {
                navigationContainer.innerHTML = html;
                // Attendre un court instant pour que le DOM soit mis à jour
                setTimeout(() => {
                    // D'abord masquer les éléments protégés par défaut
                    const protectedItems = document.querySelectorAll('.nav-item-protected');
                    protectedItems.forEach(item => {
                        item.style.display = 'none';
                        item.classList.add('d-none');
                    });
                    // Ensuite vérifier le statut de connexion
                    checkLoginStatus();
                }, 100);
            })
            .catch(error => {
                console.error('Erreur lors du chargement de la navigation:', error);
            });
    }
}

// Exporter les fonctions pour une utilisation externe si nécessaire
window.NavigationAuth = {
    checkLoginStatus,
    updateNavigation,
    handleLogout,
    includeNavigation
};
