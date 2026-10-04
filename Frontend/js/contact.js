/**
 * Flight & Passengers Tracker
 * Contact Form JavaScript File
 * Handles form validation for Contact and Registration forms
 */

$(document).ready(function() {
    console.log('Contact page initialized');
    
    // Initialize form validation
    initContactForm();
    initRegisterForm();
    
    // Password toggle
    initPasswordToggle();
    
    // Password strength indicator
    initPasswordStrength();
    
    // Character counter for message
    initCharCounter();
});

/**
 * Initialize contact form validation
 */
function initContactForm() {
    const form = $('#contactForm');
    
    form.on('submit', function(e) {
        e.preventDefault();
        
        // Reset validation states
        resetValidation(form);
        
        let isValid = true;
        
        // Validate name (minimum 3 characters)
        const name = $('#contactName').val().trim();
        if (name.length < 3) {
            showFieldError('#contactName', '#contactNameError', 'Le nom doit contenir au moins 3 caractères.');
            isValid = false;
        } else {
            showFieldSuccess('#contactName');
        }
        
        // Validate email
        const email = $('#contactEmail').val().trim();
        if (!isValidEmail(email)) {
            showFieldError('#contactEmail', '#contactEmailError', 'Veuillez entrer une adresse email valide.');
            isValid = false;
        } else {
            showFieldSuccess('#contactEmail');
        }
        
        // Validate subject
        const subject = $('#contactSubject').val();
        if (!subject) {
            showFieldError('#contactSubject', '#contactSubjectError', 'Veuillez sélectionner un sujet.');
            isValid = false;
        } else {
            showFieldSuccess('#contactSubject');
        }
        
        // Validate message (minimum 10 characters)
        const message = $('#contactMessage').val().trim();
        if (message.length < 10) {
            showFieldError('#contactMessage', '#contactMessageError', 'Le message doit contenir au moins 10 caractères.');
            isValid = false;
        } else if (message.length > 500) {
            showFieldError('#contactMessage', '#contactMessageError', 'Le message ne doit pas dépasser 500 caractères.');
            isValid = false;
        } else {
            showFieldSuccess('#contactMessage');
        }
        
        if (isValid) {
            // Show loading state
            $('#contactSubmitBtn').prop('disabled', true)
                .html('<i class="fas fa-spinner fa-spin me-2"></i>Envoi en cours...');
            
            // Simulate form submission
            setTimeout(function() {
                // Show success message
                $('#contactForm').addClass('d-none');
                $('#contactSuccess').removeClass('d-none');
                
                // Reset button
                $('#contactSubmitBtn').prop('disabled', false)
                    .html('<i class="fas fa-paper-plane me-2"></i>Envoyer le message');
                
                // Reset form after 3 seconds
                setTimeout(function() {
                    form[0].reset();
                    resetValidation(form);
                    $('#contactForm').removeClass('d-none');
                    $('#contactSuccess').addClass('d-none');
                }, 3000);
            }, 1500);
        }
    });
    
    // Real-time validation on blur
    $('#contactName').on('blur', function() {
        const val = $(this).val().trim();
        if (val.length > 0 && val.length < 3) {
            showFieldError('#contactName', '#contactNameError', 'Le nom doit contenir au moins 3 caractères.');
        } else if (val.length >= 3) {
            showFieldSuccess('#contactName');
        }
    });
    
    $('#contactEmail').on('blur', function() {
        const val = $(this).val().trim();
        if (val.length > 0 && !isValidEmail(val)) {
            showFieldError('#contactEmail', '#contactEmailError', 'Veuillez entrer une adresse email valide.');
        } else if (isValidEmail(val)) {
            showFieldSuccess('#contactEmail');
        }
    });
}

/**
 * Initialize registration form validation
 */
function initRegisterForm() {
    const form = $('#registerForm');
    
    form.on('submit', function(e) {
        e.preventDefault();
        
        // Reset validation states
        resetValidation(form);
        
        let isValid = true;
        
        // Validate first name (minimum 2 characters)
        const firstName = $('#registerFirstName').val().trim();
        if (firstName.length < 2) {
            showFieldError('#registerFirstName', '#registerFirstNameError', 'Le prénom doit contenir au moins 2 caractères.');
            isValid = false;
        } else {
            showFieldSuccess('#registerFirstName');
        }
        
        // Validate last name (minimum 2 characters)
        const lastName = $('#registerLastName').val().trim();
        if (lastName.length < 2) {
            showFieldError('#registerLastName', '#registerLastNameError', 'Le nom doit contenir au moins 2 caractères.');
            isValid = false;
        } else {
            showFieldSuccess('#registerLastName');
        }
        
        // Validate email
        const email = $('#registerEmail').val().trim();
        if (!isValidEmail(email)) {
            showFieldError('#registerEmail', '#registerEmailError', 'Veuillez entrer une adresse email valide.');
            isValid = false;
        } else {
            showFieldSuccess('#registerEmail');
        }
        
        // Validate password (minimum 8 characters)
        const password = $('#registerPassword').val();
        if (password.length < 8) {
            showFieldError('#registerPassword', '#registerPasswordError', 'Le mot de passe doit contenir au moins 8 caractères.');
            isValid = false;
        } else {
            showFieldSuccess('#registerPassword');
        }
        
        // Validate password confirmation
        const confirmPassword = $('#registerConfirmPassword').val();
        if (confirmPassword !== password) {
            showFieldError('#registerConfirmPassword', '#registerConfirmPasswordError', 'Les mots de passe ne correspondent pas.');
            isValid = false;
        } else if (confirmPassword.length >= 8) {
            showFieldSuccess('#registerConfirmPassword');
        }
        
        // Validate terms acceptance
        const terms = $('#registerTerms').is(':checked');
        if (!terms) {
            showFieldError('#registerTerms', '#registerTermsError', 'Vous devez accepter les conditions d\'utilisation.');
            isValid = false;
        } else {
            showFieldSuccess('#registerTerms');
        }
        
        if (isValid) {
            // Show loading state
            $('#registerSubmitBtn').prop('disabled', true)
                .html('<i class="fas fa-spinner fa-spin me-2"></i>Inscription en cours...');
            
            // Simulate form submission
            setTimeout(function() {
                // Show success message
                $('#registerForm').addClass('d-none');
                $('#registerSuccess').removeClass('d-none');
                
                // Reset button
                $('#registerSubmitBtn').prop('disabled', false)
                    .html('<i class="fas fa-user-plus me-2"></i>Créer mon compte');
                
                // Reset form after 3 seconds
                setTimeout(function() {
                    form[0].reset();
                    resetValidation(form);
                    $('#registerForm').removeClass('d-none');
                    $('#registerSuccess').addClass('d-none');
                    $('#passwordStrength').css('width', '0%').removeClass('weak medium strong very-strong');
                    $('#passwordStrengthText').text('Force du mot de passe');
                }, 3000);
            }, 1500);
        }
    });
    
    // Real-time validation on blur
    $('#registerFirstName').on('blur', function() {
        const val = $(this).val().trim();
        if (val.length > 0 && val.length < 2) {
            showFieldError('#registerFirstName', '#registerFirstNameError', 'Le prénom doit contenir au moins 2 caractères.');
        } else if (val.length >= 2) {
            showFieldSuccess('#registerFirstName');
        }
    });
    
    $('#registerLastName').on('blur', function() {
        const val = $(this).val().trim();
        if (val.length > 0 && val.length < 2) {
            showFieldError('#registerLastName', '#registerLastNameError', 'Le nom doit contenir au moins 2 caractères.');
        } else if (val.length >= 2) {
            showFieldSuccess('#registerLastName');
        }
    });
    
    $('#registerEmail').on('blur', function() {
        const val = $(this).val().trim();
        if (val.length > 0 && !isValidEmail(val)) {
            showFieldError('#registerEmail', '#registerEmailError', 'Veuillez entrer une adresse email valide.');
        } else if (isValidEmail(val)) {
            showFieldSuccess('#registerEmail');
        }
    });
    
    $('#registerConfirmPassword').on('blur', function() {
        const password = $('#registerPassword').val();
        const confirmPassword = $(this).val();
        if (confirmPassword.length > 0 && confirmPassword !== password) {
            showFieldError('#registerConfirmPassword', '#registerConfirmPasswordError', 'Les mots de passe ne correspondent pas.');
        } else if (confirmPassword === password && confirmPassword.length >= 8) {
            showFieldSuccess('#registerConfirmPassword');
        }
    });
}

/**
 * Initialize password toggle visibility
 */
function initPasswordToggle() {
    $('#togglePassword').on('click', function() {
        const passwordField = $('#registerPassword');
        const icon = $(this).find('i');
        
        if (passwordField.attr('type') === 'password') {
            passwordField.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            passwordField.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });
}

/**
 * Initialize password strength indicator
 */
function initPasswordStrength() {
    $('#registerPassword').on('input', function() {
        const password = $(this).val();
        const strength = calculatePasswordStrength(password);
        
        const progressBar = $('#passwordStrength');
        const strengthText = $('#passwordStrengthText');
        
        progressBar.removeClass('weak medium strong very-strong');
        
        if (password.length === 0) {
            progressBar.css('width', '0%');
            strengthText.text('Force du mot de passe');
        } else if (strength < 25) {
            progressBar.addClass('weak').css('width', '25%');
            strengthText.text('Faible').css('color', '#dc3545');
        } else if (strength < 50) {
            progressBar.addClass('medium').css('width', '50%');
            strengthText.text('Moyen').css('color', '#ffc107');
        } else if (strength < 75) {
            progressBar.addClass('strong').css('width', '75%');
            strengthText.text('Fort').css('color', '#0dcaf0');
        } else {
            progressBar.addClass('very-strong').css('width', '100%');
            strengthText.text('Très fort').css('color', '#198754');
        }
    });
}

/**
 * Calculate password strength
 * @param {string} password - Password to evaluate
 * @returns {number} Strength score (0-100)
 */
function calculatePasswordStrength(password) {
    let strength = 0;
    
    // Length
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.length >= 16) strength += 10;
    
    // Lowercase letters
    if (/[a-z]/.test(password)) strength += 15;
    
    // Uppercase letters
    if (/[A-Z]/.test(password)) strength += 15;
    
    // Numbers
    if (/[0-9]/.test(password)) strength += 15;
    
    // Special characters
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    
    return Math.min(strength, 100);
}

/**
 * Initialize character counter for message textarea
 */
function initCharCounter() {
    $('#contactMessage').on('input', function() {
        const length = $(this).val().length;
        $('#messageCharCount').text(length);
        
        if (length > 500) {
            $('#messageCharCount').addClass('text-danger');
        } else {
            $('#messageCharCount').removeClass('text-danger');
        }
    });
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show field error
 * @param {string} fieldSelector - Field selector
 * @param {string} errorSelector - Error message selector
 * @param {string} message - Error message
 */
function showFieldError(fieldSelector, errorSelector, message) {
    $(fieldSelector).addClass('is-invalid').removeClass('is-valid');
    $(errorSelector).text(message).show();
}

/**
 * Show field success
 * @param {string} fieldSelector - Field selector
 */
function showFieldSuccess(fieldSelector) {
    $(fieldSelector).addClass('is-valid').removeClass('is-invalid');
}

/**
 * Reset form validation
 * @param {jQuery} form - Form jQuery object
 */
function resetValidation(form) {
    form.find('.form-control, .form-select, .form-check-input')
        .removeClass('is-valid is-invalid');
    form.find('.invalid-feedback').hide();
}
