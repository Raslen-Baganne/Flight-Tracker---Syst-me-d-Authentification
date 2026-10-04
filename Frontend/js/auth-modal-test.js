// ===================================
// AUTH MODAL JAVASCRIPT - VERSION TEST
// Pour utilisation avec serveur Python (pas PHP)
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
    
    // VERSION TEST - Simulation de connexion
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
        
        // SIMULATION - Remplace l'appel PHP par une simulation
        setTimeout(() => {
            if (submitButton) {
                hideLoading(submitButton);
            }
            
            // Simulation de connexion réussie
            if (email === 'test@example.com' && password === 'password123') {
                showSuccessMessage(signInForm, 'Connexion réussie! Redirection...');
                
                setTimeout(() => {
                    // Simulation de redirection
                    alert('Connexion simulée réussie! En production, vous seriez redirigé vers le dashboard.');
                    const modal = bootstrap.Modal.getInstance(authModal);
                    if (modal) {
                        modal.hide();
                    }
                }, 1500);
            } else {
                showError('Email ou mot de passe incorrect (utilisez test@example.com / password123)');
            }
        }, 1000);
    }
    
    // VERSION TEST - Simulation d'inscription
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
        
        // SIMULATION - Remplace l'appel PHP par une simulation
        setTimeout(() => {
            if (submitButton) {
                hideLoading(submitButton);
            }
            
            // Simulation d'inscription réussie
            showSuccessMessage(signUpForm, 'Inscription réussie! Redirection...');
            
            setTimeout(() => {
                alert('Inscription simulée réussie! En production, vous seriez redirigé vers le dashboard.');
                const modal = bootstrap.Modal.getInstance(authModal);
                if (modal) {
                    modal.hide();
                }
            }, 1500);
        }, 1000);
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
        
        // VERSION TEST - Validation simplifiée pour accepter password123
        // En production, utilisez: if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(input.value))
        if (!/(?=.*[a-z])(?=.*\d)/.test(input.value)) {
            showInputError(input, 'Le mot de passe doit contenir au moins une minuscule et un chiffre');
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
    
    function showSuccessMessage(form, message) {
        if (!form || !form.parentNode) {
            console.error('Form or parent node not found for success message');
            return;
        }
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div class="success-icon">
                <i class="fas fa-check"></i>
            </div>
            <h4 class="text-success mb-3">Succès!</h4>
            <p class="text-muted">${message}</p>
        `;
        
        form.style.display = 'none';
        form.parentNode.appendChild(successDiv);
        successDiv.style.display = 'block';
    }
    
    function showLoading(button) {
        button.classList.add('loading');
        button.disabled = true;
    }
    
    function hideLoading(button) {
        button.classList.remove('loading');
        button.disabled = false;
    }
    
    // VERSION TEST - Simulation de connexion sociale
    async function handleSocialLogin(button) {
        const provider = button.textContent.toLowerCase().includes('google') ? 'google' : 'facebook';
        
        showLoading(button);
        
        // SIMULATION - Remplace l'appel OAuth par une simulation
        setTimeout(() => {
            hideLoading(button);
            showSuccessMessage(signInForm, `Connexion avec ${provider} réussie!`);
            
            setTimeout(() => {
                alert(`Connexion sociale simulée avec ${provider} réussie! En production, vous seriez redirigé.`);
                const modal = bootstrap.Modal.getInstance(authModal);
                if (modal) {
                    modal.hide();
                }
            }, 1500);
        }, 1000);
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
        
        // Remove any success messages
        const successMessages = authModal.querySelectorAll('.success-message');
        successMessages.forEach(msg => msg.remove());
        
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
