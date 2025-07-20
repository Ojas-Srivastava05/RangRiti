// Navbar HTML template
const navbarHTML = `
<nav class="floating-navbar">
    <div class="nav-container">
        <!-- Logo/Brand with animated glow -->
        <div class="brand-container">
            <a href="index.html" class="brand-logo">
                <span class="brand-text">RangRiti</span>
                <div class="brand-glow"></div>
            </a>
        </div>

        <!-- Main Navigation Links -->
        <div class="nav-links">
            <a href="index.html" class="nav-link" data-text="Home">
                <span class="nav-icon">🏠</span>
                <span class="nav-text">Home</span>
                <div class="nav-ripple"></div>
            </a>
            
            <a href="artists.html" class="nav-link" data-text="Artists">
                <span class="nav-icon">👨‍🎨</span>
                <span class="nav-text">Artists</span>
                <div class="nav-ripple"></div>
            </a>
            
            <a href="workshops.html" class="nav-link" data-text="Workshops">
                <span class="nav-icon">🎭</span>
                <span class="nav-text">Workshops</span>
                <div class="nav-ripple"></div>
            </a>
            
            <a href="calendar.html" class="nav-link" data-text="Calendar">
                <span class="nav-icon">📅</span>
                <span class="nav-text">Calendar</span>
                <div class="nav-ripple"></div>
            </a>
            
            <!-- Heritage Dropdown -->
            <div class="nav-dropdown">
                <button class="nav-link dropdown-trigger" data-text="Heritage">
                    <span class="nav-icon">🏛️</span>
                    <span class="nav-text">Heritage</span>
                    <span class="dropdown-arrow">▼</span>
                    <div class="nav-ripple"></div>
                </button>
                <div class="dropdown-panel">
                    <div class="dropdown-content">
                        <a href="traditional.html" class="dropdown-item">
                            <span class="dropdown-icon">🎨</span>
                            <span class="dropdown-text">Traditional Arts</span>
                        </a>
                        <a href="folk.html" class="dropdown-item">
                            <span class="dropdown-icon">🎪</span>
                            <span class="dropdown-text">Folk Arts</span>
                        </a>
                        <a href="classical.html" class="dropdown-item">
                            <span class="dropdown-icon">🏺</span>
                            <span class="dropdown-text">Classical Arts</span>
                        </a>
                        <a href="contemporary.html" class="dropdown-item">
                            <span class="dropdown-icon">🖼️</span>
                            <span class="dropdown-text">Contemporary Arts</span>
                        </a>
                    </div>
                </div>
            </div>
            
            <a href="connect.html" class="nav-link" data-text="Connect">
                <span class="nav-icon">🤝</span>
                <span class="nav-text">Connect</span>
                <div class="nav-ripple"></div>
            </a>
        </div>

        <!-- Authentication Section -->
        <div class="auth-section">
            <!-- For static HTML, we'll show login/register by default -->
            <a href="login.html" class="auth-link profile-btn" data-text="Profile">
                <span class="auth-icon">👤</span>
                <span class="auth-text">Profile</span>
                <div class="nav-ripple"></div>
            </a>
            <a href="login.html" class="auth-link login-btn" data-text="Login">
                <span class="auth-icon">🔑</span>
                <span class="auth-text">Login</span>
                <div class="nav-ripple"></div>
            </a>
            <a href="register.html" class="auth-link register-btn" data-text="Register">
                <span class="auth-icon">📝</span>
                <span class="auth-text">Register</span>
                <div class="nav-ripple"></div>
            </a>
        </div>

        <!-- Mobile Menu Toggle -->
        <button class="mobile-toggle" id="mobileToggle">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        </button>
    </div>

    <!-- Mobile Navigation Overlay -->
    <div class="mobile-nav-overlay" id="mobileNavOverlay">
        <div class="mobile-nav-content">
            <button class="mobile-close" id="mobileClose">✕</button>
            <div class="mobile-nav-links">
                <!-- Mobile links will be populated by JavaScript -->
            </div>
        </div>
    </div>
</nav>
`;

// Function to load navbar
function loadNavbar() {
    // Insert navbar at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    
    // Add padding to body to account for fixed navbar
    document.body.style.paddingTop = '80px';
    
    // Initialize navbar functionality
    initializeNavbar();
}

// Navbar functionality
function initializeNavbar() {
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileClose = document.getElementById('mobileClose');
    const navbar = document.querySelector('.floating-navbar');

    // Mobile menu functionality
    function toggleMobileMenu() {
        mobileToggle?.classList.toggle('active');
        mobileNavOverlay?.classList.toggle('active');
        document.body.style.overflow = mobileNavOverlay?.classList.contains('active') ? 'hidden' : '';
    }

    mobileToggle?.addEventListener('click', toggleMobileMenu);
    mobileClose?.addEventListener('click', toggleMobileMenu);

    // Close mobile menu when clicking overlay
    mobileNavOverlay?.addEventListener('click', function(e) {
        if (e.target === mobileNavOverlay) {
            toggleMobileMenu();
        }
    });

    // Scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    });

    // Active link highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .auth-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });

    // Ripple effect on click
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const ripple = this.querySelector('.nav-ripple');
            if (ripple) {
                ripple.style.width = '200%';
                ripple.style.height = '200%';
                setTimeout(() => {
                    ripple.style.width = '0';
                    ripple.style.height = '0';
                }, 250);
            }
        });
    });

    // Enhanced dropdown functionality
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    
    dropdowns.forEach(dropdown => {
        const panel = dropdown.querySelector('.dropdown-panel');
        let hoverTimeout;

        dropdown.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimeout);
            panel.style.opacity = '1';
            panel.style.visibility = 'visible';
            panel.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        });

        dropdown.addEventListener('mouseleave', function() {
            hoverTimeout = setTimeout(() => {
                panel.style.opacity = '0';
                panel.style.visibility = 'hidden';
                panel.style.transform = 'translateX(-50%) translateY(-8px) scale(0.96)';
            }, 100);
        });
    });
}

// Load navbar when DOM is ready
document.addEventListener('DOMContentLoaded', loadNavbar);