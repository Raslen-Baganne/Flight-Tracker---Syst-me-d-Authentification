// ===================================
// AUTH MODAL JAVASCRIPT
// Modern & Professional Functionality
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    
    // DOM Elements - with existence checks
    const authModal = document.getElementById('authModal');
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const showSignUpLink = document.getElementById('showSignUp');
    const showSignInLink = document.getElementById('showSignIn');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const togglePasswordSignUpBtn = document.getElementById('togglePasswordSignUp');
    
    // Check if essential elements exist
    if (!authModal) {
        console.error('Auth modal element not found');
        return;
    }
    
    if (!signInForm || !signUpForm) {
        console.error('Sign in/up forms not found');
        return;
    }
    
    // Form Elements - with existence checks
    const signInFormElement = signInForm.querySelector('form');
    const signUpFormElement = signUpForm.querySelector('form');
    
    if (!signInFormElement || !signUpFormElement) {
        console.error('Form elements not found');
        return;
    }
    
    // Initialize Modal Animations
    authModal.addEventListener('show.bs.modal', function() {
        resetForms();
        animateModalEntrance();
    });
    
    authModal.addEventListener('hidden.bs.modal', function() {
        resetForms();
    });
    
    // Switch between Sign In and Sign Up
    if (showSignUpLink) {
        showSignUpLink.addEventListener('click', function(e) {
            e.preventDefault();
            switchToSignUp();
        });
    }
    
    if (showSignInLink) {
        showSignInLink.addEventListener('click', function(e) {
            e.preventDefault();
            switchToSignIn();
        });
    }
    
    // Password Toggle Functionality
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            togglePassword('signIn');
        });
    }
    
    if (togglePasswordSignUpBtn) {
        togglePasswordSignUpBtn.addEventListener('click', function() {
            togglePassword('signUp');
        });
    }
    
    // Form Submissions
    signInFormElement.addEventListener('submit', function(e) {
        e.preventDefault();
        handleSignIn();
    });
    
    signUpFormElement.addEventListener('submit', function(e) {
        e.preventDefault();
        handleSignUp();
    });
    
    // Real-time Validation - Only validate on blur and after user has typed
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                validateEmail(this);
            }
        });
    });
    
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value !== '') {
                validatePassword(this);
            }
        });
        input.addEventListener('input', function() {
            // Clear error while typing if there's content
            if (this.value !== '') {
                this.classList.remove('is-invalid');
                const errorDiv = this.parentNode.querySelector('.invalid-feedback');
                if (errorDiv) {
                    errorDiv.remove();
                }
            }
        });
    });
    
    // Name inputs validation on blur
    const nameInputs = document.querySelectorAll('input[placeholder*="Prénom"], input[placeholder*="Nom"]');
    nameInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                validateName(this);
            }
        });
        input.addEventListener('input', function() {
            // Clear error while typing
            if (this.value.trim() !== '') {
                this.classList.remove('is-invalid');
                const errorDiv = this.parentNode.querySelector('.invalid-feedback');
                if (errorDiv) {
                    errorDiv.remove();
                }
            }
        });
    });
    
    // Social Login Handlers
    const socialButtons = document.querySelectorAll('.social-login .btn');
    socialButtons.forEach(button => {
        button.addEventListener('click', function() {
            handleSocialLogin(this);
        });
    });
    
    // Functions
    
    function switchToSignUp() {
        animateFormTransition(signInForm, signUpForm);
        updateModalTitle('Inscription');
    }
    
    function switchToSignIn() {
        animateFormTransition(signUpForm, signInForm);
        updateModalTitle('Connexion');
    }
    
    function animateFormTransition(fromForm, toForm) {
        fromForm.style.animation = 'formSlideOut 0.3s ease-out forwards';
        
        setTimeout(() => {
            fromForm.style.display = 'none';
            toForm.style.display = 'block';
            toForm.style.animation = 'formSlideIn 0.5s ease-out';
        }, 300);
    }
    
    function updateModalTitle(title) {
        const modalTitle = authModal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = title;
        }
    }
    
    function togglePassword(form) {
        const passwordInput = form === 'signIn' 
            ? signInForm.querySelector('input[type="password"]')
            : signUpForm.querySelector('input[type="password"]');
        
        const icon = form === 'signIn'
            ? togglePasswordBtn?.querySelector('i')
            : togglePasswordSignUpBtn?.querySelector('i');
        
        if (!passwordInput || !icon) {
            console.error('Password input or icon not found for form:', form);
            return;
        }
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
    
    async function handleSignIn() {
        const emailInput = signInForm.querySelector('input[type="email"]');
        const passwordInput = signInForm.querySelector('input[type="password"]');
        const rememberMeCheckbox = document.getElementById('rememberMe');
        
        if (!emailInput || !passwordInput) {
            console.error('Email or password input not found in sign in form');
            showError('Formulaire de connexion incomplet');
            return;
        }
        
        const email = emailInput.value;
        const password = passwordInput.value;
        const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
        
        if (!validateSignInForm()) {
            return;
        }
        
        const submitButton = signInFormElement.querySelector('button[type="submit"]');
        if (submitButton) {
            showLoading(submitButton);
        }
        
        try {
            const response = await fetch('http://localhost/dashboard-Project_web-main - Copie/Backend/login.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (submitButton) {
                hideLoading(submitButton);
            }
            
            if (data.success) {
                showSuccessMessage(signInForm, 'Connexion réussie! Redirection...', 'Connexion réussie!');
                
                setTimeout(() => {
                    if (data.redirect) {
                        window.location.href = data.redirect;
                    }
                }, 1500);
            } else {
                showError(data.error || 'Erreur de connexion');
            }
        } catch (error) {
            if (submitButton) {
                hideLoading(submitButton);
            }
            console.error('Erreur:', error);
            showError('Erreur de connexion au serveur');
        }
    }
    
    async function handleSignUp() {
        const firstNameInput = signUpForm.querySelector('input[placeholder="Prénom"]');
        const lastNameInput = signUpForm.querySelector('input[placeholder="Nom"]');
        const emailInput = signUpForm.querySelector('input[type="email"]');
        const passwordInputs = signUpForm.querySelectorAll('input[type="password"]');
        const agreeTermsCheckbox = document.getElementById('agreeTerms');
        
        if (!firstNameInput || !lastNameInput || !emailInput || passwordInputs.length < 2) {
            console.error('Required form elements not found in sign up form');
            showError('Formulaire d\'inscription incomplet');
            return;
        }
        
        const formData = {
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            email: emailInput.value,
            password: passwordInputs[0].value,
            confirmPassword: passwordInputs[1].value,
            agreeTerms: agreeTermsCheckbox ? agreeTermsCheckbox.checked : false
        };
        
        if (!validateSignUpForm()) {
            return;
        }
        
        const submitButton = signUpFormElement.querySelector('button[type="submit"]');
        if (submitButton) {
            showLoading(submitButton);
        }
        
        try {
            const response = await fetch('http://localhost/dashboard-Project_web-main - Copie/Backend/register.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password
                })
            });
            
            const data = await response.json();
            
            if (submitButton) {
                hideLoading(submitButton);
            }
            
            if (data.success) {
                // Basculer vers le formulaire de connexion après un court délai
                setTimeout(() => {
                    // Basculer vers Sign In
                    switchToSignIn();
                    
                    // Afficher un message dans le formulaire de connexion
                    const signInMessage = document.createElement('div');
                    signInMessage.className = 'alert alert-success';
                    signInMessage.textContent = 'Compte créé avec succès! Vous pouvez maintenant vous connecter.';
                    signInForm.insertBefore(signInMessage, signInFormElement);
                    
                    // Masquer le message après 3 secondes
                    setTimeout(() => {
                        if (signInMessage.parentNode) {
                            signInMessage.remove();
                        }
                    }, 3000);
                }, 800);
            } else {
                showError(data.error || 'Erreur lors de l\'inscription');
            }
        } catch (error) {
            if (submitButton) {
                hideLoading(submitButton);
            }
            console.error('Erreur:', error);
            showError('Erreur de connexion au serveur');
        }
    }
    
    function validateSignInForm() {
        const email = signInForm.querySelector('input[type="email"]');
        const password = signInForm.querySelector('input[type="password"]');
        
        if (!email || !password) {
            console.error('Email or password input not found for validation');
            return false;
        }
        
        let isValid = true;
        
        if (!validateEmail(email)) {
            isValid = false;
        }
        
        if (!password.value || password.value.length < 6) {
            showInputError(password, 'Le mot de passe doit contenir au moins 6 caractères');
            isValid = false;
        } else {
            clearInputError(password);
        }
        
        return isValid;
    }
    
    function validateSignUpForm() {
        const firstName = signUpForm.querySelector('input[placeholder="Prénom"]');
        const lastName = signUpForm.querySelector('input[placeholder="Nom"]');
        const email = signUpForm.querySelector('input[type="email"]');
        const passwordInputs = signUpForm.querySelectorAll('input[type="password"]');
        const agreeTerms = document.getElementById('agreeTerms');
        
        if (!firstName || !lastName || !email || passwordInputs.length < 2) {
            console.error('Required form elements not found for sign up validation');
            return false;
        }
        
        const password = passwordInputs[0];
        const confirmPassword = passwordInputs[1];
        
        let isValid = true;
        
        if (!validateName(firstName)) {
            isValid = false;
        }
        
        if (!validateName(lastName)) {
            isValid = false;
        }
        
        if (!validateEmail(email)) {
            isValid = false;
        }
        
        if (!validatePassword(password)) {
            isValid = false;
        }
        
        if (password.value !== confirmPassword.value) {
            showInputError(confirmPassword, 'Les mots de passe ne correspondent pas');
            isValid = false;
        } else {
            clearInputError(confirmPassword);
        }
        
        if (!agreeTerms || !agreeTerms.checked) {
            showError('Vous devez accepter les conditions d\'utilisation');
            isValid = false;
        }
        
        return isValid;
    }
    
    function validateName(input) {
        if (!input.value.trim()) {
            showInputError(input, 'Ce champ est requis');
            return false;
        }
        
        if (input.value.trim().length < 2) {
            showInputError(input, 'Ce champ doit contenir au moins 2 caractères');
            return false;
        }
        
        if (!/^[a-zA-ZÀ-ÿ\s-]+$/.test(input.value.trim())) {
            showInputError(input, 'Ce champ ne peut contenir que des lettres');
            return false;
        }
        
        clearInputError(input);
        return true;
    }
    
    function validateEmail(input) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!input.value.trim()) {
            showInputError(input, 'L\'email est requis');
            return false;
        }
        
        if (!emailRegex.test(input.value)) {
            showInputError(input, 'Veuillez entrer une adresse email valide');
            return false;
        }
        
        clearInputError(input);
        return true;
    }
    
    function validatePassword(input) {
        if (!input.value) {
            showInputError(input, 'Le mot de passe est requis');
            return false;
        }
        
        if (input.value.length < 6) {
            showInputError(input, 'Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }
        
        clearInputError(input);
        return true;
    }
    
    function showInputError(input, message) {
        if (!input) {
            console.error('Input element not found for error display');
            return;
        }
        
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        
        // Create or update error message
        let errorDiv = input.parentNode.querySelector('.invalid-feedback');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            input.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        
        // Shake animation
        if (input.parentNode) {
            input.parentNode.style.animation = 'shake 0.5s';
            setTimeout(() => {
                if (input.parentNode) {
                    input.parentNode.style.animation = '';
                }
            }, 500);
        }
    }
    
    function clearInputError(input) {
        if (!input) {
            console.error('Input element not found for error clearing');
            return;
        }
        
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        
        if (input.parentNode) {
            const errorDiv = input.parentNode.querySelector('.invalid-feedback');
            if (errorDiv) {
                errorDiv.remove();
            }
        }
    }
    
    function showError(message) {
        // Create toast notification
        const toast = createToast(message, 'error');
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
    
    function showSuccessMessage(form, message, title = 'Compte créé avec succès!') {
        if (!form || !form.parentNode) {
            console.error('Form or parent node not found for success message');
            return;
        }
        
        // Créer le conteneur moderne du message de succès
        const successContainer = document.createElement('div');
        successContainer.className = 'modern-success-container';
        
        successContainer.innerHTML = `
            <div class="modern-success-content">
                <div class="success-checkmark">
                    <div class="check-icon">
                        <span class="icon-line line-tip"></span>
                        <span class="icon-line line-long"></span>
                    </div>
                </div>
                <h3 class="success-title">${title}</h3>
                <p class="success-message">${message}</p>
                <div class="success-features">
                    <div class="feature-item">
                        <i class="fas fa-shield-alt"></i>
                        <span>Compte sécurisé</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-plane"></i>
                        <span>Accès dashboard</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-globe"></i>
                        <span>Suivi des vols</span>
                    </div>
                </div>
                <div class="success-spinner">
                    <div class="spinner"></div>
                    <span>Redirection en cours...</span>
                </div>
            </div>
        `;
        
        // Masquer le formulaire et afficher le message
        form.style.display = 'none';
        form.parentNode.appendChild(successContainer);
        
        // Déclencher l'animation
        setTimeout(() => {
            successContainer.classList.add('show');
        }, 100);
        
        // Ajouter les styles CSS si ils n'existent pas déjà
        if (!document.querySelector('#modern-success-style')) {
            const style = document.createElement('style');
            style.id = 'modern-success-style';
            style.textContent = `
                .modern-success-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    opacity: 0;
                    transform: scale(0.8);
                    transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                
                .modern-success-container.show {
                    opacity: 1;
                    transform: scale(1);
                }
                
                .modern-success-content {
                    text-align: center;
                    padding: 40px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(13, 110, 253, 0.1);
                    max-width: 400px;
                    position: relative;
                    overflow: hidden;
                }
                
                .modern-success-content::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(13, 110, 253, 0.05), transparent);
                    animation: shimmer 3s infinite;
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
                }
                
                .success-checkmark {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 30px;
                    position: relative;
                }
                
                .check-icon {
                    width: 80px;
                    height: 80px;
                    position: relative;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #198754 0%, #20c997 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 10px 30px rgba(25, 135, 84, 0.3);
                    animation: checkmarkPop 0.6s ease-out;
                }
                
                @keyframes checkmarkPop {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                
                .icon-line {
                    position: absolute;
                    height: 3px;
                    background-color: white;
                    border-radius: 2px;
                    animation: checkmarkDraw 0.6s ease-out 0.3s forwards;
                    transform-origin: left center;
                }
                
                .line-tip {
                    top: 45%;
                    left: 22%;
                    width: 25%;
                    transform: rotate(45deg);
                    opacity: 0;
                }
                
                .line-long {
                    top: 58%;
                    left: 18%;
                    width: 45%;
                    transform: rotate(-45deg);
                    opacity: 0;
                }
                
                @keyframes checkmarkDraw {
                    0% { 
                        opacity: 0;
                        transform: scaleX(0) rotate(45deg);
                    }
                    100% { 
                        opacity: 1;
                        transform: scaleX(1) rotate(45deg);
                    }
                }
                
                .success-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #198754;
                    margin-bottom: 15px;
                    background: linear-gradient(135deg, #198754 0%, #20c997 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: titleFadeIn 0.8s ease-out 0.6s both;
                }
                
                @keyframes titleFadeIn {
                    0% { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .success-message {
                    color: #6c757d;
                    font-size: 1.1rem;
                    margin-bottom: 30px;
                    animation: messageFadeIn 0.8s ease-out 0.8s both;
                }
                
                @keyframes messageFadeIn {
                    0% { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .success-features {
                    display: flex;
                    justify-content: space-around;
                    margin-bottom: 30px;
                    gap: 15px;
                    animation: featuresSlideIn 0.8s ease-out 1s both;
                }
                
                @keyframes featuresSlideIn {
                    0% { 
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    100% { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .feature-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 15px;
                    background: rgba(13, 110, 253, 0.05);
                    border-radius: 12px;
                    border: 1px solid rgba(13, 110, 253, 0.1);
                    transition: all 0.3s ease;
                }
                
                .feature-item:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(13, 110, 253, 0.15);
                    background: rgba(13, 110, 253, 0.08);
                }
                
                .feature-item i {
                    font-size: 1.5rem;
                    color: #0d6efd;
                    margin-bottom: 5px;
                }
                
                .feature-item span {
                    font-size: 0.85rem;
                    color: #495057;
                    font-weight: 600;
                }
                
                .success-spinner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    color: #6c757d;
                    font-size: 0.95rem;
                    animation: spinnerFadeIn 0.8s ease-out 1.2s both;
                }
                
                @keyframes spinnerFadeIn {
                    0% { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #e9ecef;
                    border-top: 2px solid #0d6efd;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @media (max-width: 576px) {
                    .modern-success-content {
                        padding: 30px 20px;
                        margin: 20px;
                    }
                    
                    .success-features {
                        flex-direction: column;
                        gap: 10px;
                    }
                    
                    .feature-item {
                        flex-direction: row;
                        justify-content: flex-start;
                        padding: 12px 15px;
                    }
                    
                    .feature-item i {
                        margin-bottom: 0;
                        margin-right: 10px;
                    }
                    
                    .success-title {
                        font-size: 1.5rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    function showLoading(button) {
        button.classList.add('loading');
        button.disabled = true;
    }
    
    function hideLoading(button) {
        button.classList.remove('loading');
        button.disabled = false;
    }
    
    async function handleSocialLogin(button) {
        const provider = button.textContent.toLowerCase().includes('google') ? 'google' : 'facebook';
        
        showLoading(button);
        
        // Simuler une réponse OAuth (en production, utilisez de vraies APIs Google/Facebook)
        const mockOAuthData = {
            google: {
                provider: 'google',
                oauth_id: 'google_' + Math.random().toString(36).substr(2, 9),
                email: 'google_user_' + Math.random().toString(36).substr(2, 9) + '@gmail.com',
                first_name: 'Utilisateur',
                last_name: 'Google',
                avatar_url: 'https://picsum.photos/seed/google/200/200.jpg'
            },
            facebook: {
                provider: 'facebook',
                oauth_id: 'facebook_' + Math.random().toString(36).substr(2, 9),
                email: 'facebook_user_' + Math.random().toString(36).substr(2, 9) + '@facebook.com',
                first_name: 'Utilisateur',
                last_name: 'Facebook',
                avatar_url: 'https://picsum.photos/seed/facebook/200/200.jpg'
            }
        };
        
        try {
            const response = await fetch('http://localhost/dashboard-Project_web-main - Copie/Backend/oauth-login.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mockOAuthData[provider])
            });
            
            const data = await response.json();
            
            if (data.success) {
                hideLoading(button);
                showSuccessMessage(signInForm, `Connexion avec ${provider} réussie!`);
                
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1500);
            } else {
                hideLoading(button);
                showError(data.error || `Erreur lors de la connexion avec ${provider}`);
            }
        } catch (error) {
            hideLoading(button);
            console.error('Erreur OAuth:', error);
            showError(`Erreur de connexion avec ${provider}`);
        }
    }
    
    function resetForms() {
        if (!authModal) return;
        
        // Ensure the auth-forms container is visible
        const authFormsContainer = document.querySelector('.auth-forms');
        if (authFormsContainer) {
            authFormsContainer.style.display = 'block';
            authFormsContainer.style.visibility = 'visible';
            authFormsContainer.style.opacity = '1';
        }
        
        // Reset form displays
        if (signInForm) signInForm.style.display = 'block';
        if (signUpForm) signUpForm.style.display = 'none';
        
        // Clear all form inputs
        const allInputs = authModal.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
        allInputs.forEach(input => {
            input.value = '';
            input.classList.remove('is-valid', 'is-invalid');
        });
        
        // Clear all error messages
        const errorMessages = authModal.querySelectorAll('.invalid-feedback');
        errorMessages.forEach(error => error.remove());
        
        // Clear checkboxes
        const checkboxes = authModal.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Remove any success messages and alerts
        const successMessages = authModal.querySelectorAll('.success-message');
        successMessages.forEach(msg => msg.remove());
        
        const alertMessages = authModal.querySelectorAll('.alert');
        alertMessages.forEach(alert => alert.remove());
        
        // Reset password visibility
        const passwordInputs = authModal.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.type = 'password';
        });
        
        const eyeIcons = authModal.querySelectorAll('.fa-eye-slash');
        eyeIcons.forEach(icon => {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        });
    }
    
    function animateModalEntrance() {
        if (!authModal) return;
        
        const modalContent = authModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.animation = 'modalSlideIn 0.4s ease-out';
        }
    }
    
    function createToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        
        return toast;
    }
    
    // Add custom animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes formSlideOut {
            to {
                opacity: 0;
                transform: translateX(-30px);
            }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
    `;
    document.head.appendChild(style);
});

// Keyboard Navigation Support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const authModal = document.getElementById('authModal');
        if (authModal && authModal.classList.contains('show')) {
            const modal = bootstrap.Modal.getInstance(authModal);
            if (modal) {
                modal.hide();
            }
        }
    }
});

// Focus Management for Accessibility
document.addEventListener('shown.bs.modal', function(e) {
    if (e.target && e.target.id === 'authModal') {
        const firstInput = e.target.querySelector('input[type="email"]');
        if (firstInput) {
            firstInput.focus();
        }
    }
});
