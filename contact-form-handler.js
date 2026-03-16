// Contact Form Handler with Validation and reCAPTCHA
// Place this file in your website root directory

// Google reCAPTCHA v3 Site Key - REPLACE WITH YOUR ACTUAL KEY
const RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_SITE_KEY'; // Get from: https://www.google.com/recaptcha/admin
const WHATSAPP_NUMBER = '919027038209'; // Your WhatsApp number with country code

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load reCAPTCHA script
    loadReCaptcha();
    
    // Initialize form validation if form exists
    if (document.getElementById('secureContactForm')) {
        initializeFormValidation();
    }
    
    // Show cookie consent
    showCookieConsent();
});

// Load Google reCAPTCHA script
function loadReCaptcha() {
    if (typeof grecaptcha !== 'undefined') return;
    
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

// Initialize form validation
function initializeFormValidation() {
    const form = document.getElementById('secureContactForm');
    if (!form) return;

    // Real-time validation
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            validateField(this);
        });

        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
}

// Validate individual field
function validateField(field) {
    const errorElement = document.getElementById(field.id + 'Error');
    if (!errorElement) return true;

    let isValid = true;
    let errorMessage = '';

    if (field.required && !field.value.trim()) {
        isValid = false;
        errorMessage = 'This field is required';
    } else if (field.type === 'email' && field.value) {
        const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
        if (!emailPattern.test(field.value)) {
            isValid = false;
            errorMessage = 'Enter a valid email address';
        }
    } else if (field.id === 'phone' && field.value) {
        const phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(field.value)) {
            isValid = false;
            errorMessage = 'Enter 10-digit mobile number';
        }
    } else if (field.id === 'name' && field.value) {
        if (field.value.length < 2 || field.value.length > 50) {
            isValid = false;
            errorMessage = 'Name must be between 2 and 50 characters';
        }
    } else if (field.id === 'message' && field.value) {
        if (field.value.length < 10 || field.value.length > 500) {
            isValid = false;
            errorMessage = 'Message must be between 10 and 500 characters';
        }
    }

    if (!isValid) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
        field.style.borderColor = '#d9534f';
    } else {
        errorElement.style.display = 'none';
        field.style.borderColor = '#e9dacb';
    }

    return isValid;
}

// Form submission handler
async function submitContactForm(event) {
    event.preventDefault();

    const form = document.getElementById('secureContactForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusDiv = document.getElementById('formStatus');
    
    // Validate all fields
    let isFormValid = true;
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (!validateField(input)) {
            isFormValid = false;
        }
    });

    if (!isFormValid) {
        showStatus('Please correct the errors in the form', 'error');
        return false;
    }

    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    statusDiv.style.display = 'none';

    try {
        // Get reCAPTCHA token
        const token = await executeRecaptcha();
        
        // Collect form data
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            message: document.getElementById('message').value.trim(),
            recaptcha_token: token
        };

        // Send to server
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to send message');
        }

        // Show success message
        showStatus('Message sent successfully! We\'ll get back to you soon.', 'success');
        form.reset();

        // Show WhatsApp option
        const whatsappMessage = encodeURIComponent(
            `Hello, I'm ${formData.name}.\n` +
            `Email: ${formData.email}\n` +
            `Phone: ${formData.phone}\n` +
            `Message: ${formData.message}`
        );
        
        showWhatsAppOption(whatsappMessage);

    } catch (error) {
        console.error('Form submission error:', error);
        showStatus(error.message || 'Failed to send message. Please try again or contact us via WhatsApp.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    }

    return false;
}

// Execute reCAPTCHA
function executeRecaptcha() {
    return new Promise((resolve, reject) => {
        if (typeof grecaptcha === 'undefined') {
            reject(new Error('reCAPTCHA not loaded'));
            return;
        }

        grecaptcha.ready(async () => {
            try {
                const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' });
                resolve(token);
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Show status message
function showStatus(message, type) {
    const statusDiv = document.getElementById('formStatus');
    if (!statusDiv) return;
    
    statusDiv.innerHTML = message;
    statusDiv.style.display = 'block';
    
    if (type === 'success') {
        statusDiv.style.background = '#d4edda';
        statusDiv.style.color = '#155724';
        statusDiv.style.border = '1px solid #c3e6cb';
    } else {
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.color = '#721c24';
        statusDiv.style.border = '1px solid #f5c6cb';
    }
}

// Show WhatsApp option after successful submission
function showWhatsAppOption(message) {
    const form = document.getElementById('secureContactForm');
    if (!form) return;
    
    // Remove existing WhatsApp option if any
    const existing = document.getElementById('whatsappOption');
    if (existing) existing.remove();
    
    const whatsappDiv = document.createElement('div');
    whatsappDiv.id = 'whatsappOption';
    whatsappDiv.style.marginTop = '1rem';
    whatsappDiv.style.padding = '1rem';
    whatsappDiv.style.background = '#e8f5e9';
    whatsappDiv.style.borderRadius = '12px';
    whatsappDiv.style.textAlign = 'center';
    
    whatsappDiv.innerHTML = `
        <p style="margin: 0; color: #2e7d32;">
            <i class="fab fa-whatsapp" style="color: #25D366; font-size: 1.5rem; margin-right: 8px;"></i>
            <strong>Chat instantly on WhatsApp!</strong><br>
            <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${message}" 
               target="_blank" 
               style="display: inline-block; margin-top: 10px; padding: 8px 20px; background: #25D366; color: white; text-decoration: none; border-radius: 50px; font-weight: 600;">
                <i class="fab fa-whatsapp"></i> Open WhatsApp
            </a>
        </p>
    `;
    
    form.appendChild(whatsappDiv);
}

// Cookie consent notice
function showCookieConsent() {
    if (localStorage.getItem('cookieConsent')) return;

    const consentDiv = document.createElement('div');
    consentDiv.id = 'cookieConsent';
    consentDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        max-width: 400px;
        margin: 0 auto;
        background: white;
        padding: 1.5rem;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        border-left: 6px solid #2563eb;
        font-family: 'Poppins', sans-serif;
    `;

    consentDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
            <i class="fas fa-cookie-bite" style="color: #2563eb; font-size: 2rem;"></i>
            <h4 style="color: #0b2f4e; margin: 0;">Cookie Notice</h4>
        </div>
        <p style="color: #4a5568; margin-bottom: 1.5rem; font-size: 0.95rem;">
            We use cookies to enhance your experience. By continuing to visit this site, you agree to our use of cookies.
            <a href="cookie-policy.html" style="color: #2563eb; text-decoration: none;">Learn more</a>
        </p>
        <div style="display: flex; gap: 1rem;">
            <button onclick="acceptCookies()" style="flex: 1; padding: 0.8rem; background: #2563eb; color: white; border: none; border-radius: 50px; cursor: pointer; font-weight: 600;">
                Accept
            </button>
            <button onclick="declineCookies()" style="flex: 1; padding: 0.8rem; background: transparent; border: 2px solid #4a5568; color: #4a5568; border-radius: 50px; cursor: pointer; font-weight: 600;">
                Decline
            </button>
        </div>
    `;

    document.body.appendChild(consentDiv);
}

// Cookie consent handlers
window.acceptCookies = function() {
    localStorage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookieConsent')?.remove();
};

window.declineCookies = function() {
    localStorage.setItem('cookieConsent', 'declined');
    document.getElementById('cookieConsent')?.remove();
};