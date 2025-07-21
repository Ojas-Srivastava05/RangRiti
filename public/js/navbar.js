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
            
            <a href="/artists" class="nav-link" data-text="Artists">
                <span class="nav-icon">👨‍🎨</span>
                <span class="nav-text">Artists</span>
                <div class="nav-ripple"></div>
            </a>
            
            <a href="/artist/workshops" class="nav-link" data-text="Workshops">
                <span class="nav-icon">🎭</span>
                <span class="nav-text">Workshops</span>
                <div class="nav-ripple"></div>
            </a>
            
            <a href="/calendar" class="nav-link" data-text="Calendar">
                <span class="nav-icon">📅</span>
                <span class="nav-text">Calendar</span>
                <div class="nav-ripple"></div>
            </a>
            
            <!-- Heritage Dropdown with improved animation -->
            <div class="nav-dropdown">
                <button class="nav-link dropdown-trigger" data-text="Heritage">
                    <span class="nav-icon">🏛️</span>
                    <span class="nav-text">Heritage</span>
                    <span class="dropdown-arrow">▼</span>
                    <div class="nav-ripple"></div>
                </button>
                <div class="dropdown-panel">
                    <div class="dropdown-content">
                        <a href="paintings and traditional styles.html" class="dropdown-item">
                            <span class="dropdown-icon">🎨</span>
                            <span class="dropdown-text">Traditional Painting Styles</span>
                        </a>
                        <a href="textile_main.html" class="dropdown-item">
                            <span class="dropdown-icon">🪡</span>
                            <span class="dropdown-text">Textile Arts and Embroidery</span>
                        </a>
                        <a href="performingarts.html" class="dropdown-item">
                            <span class="dropdown-icon">🪷</span>
                            <span class="dropdown-text">Performing Arts</span>
                        </a>
                        <a href="handicrafts_and_sculptures.html" class="dropdown-item">
                            <span class="dropdown-icon">🏺</span>
                            <span class="dropdown-text">Handicrafts and Sculpture</span>
                        </a>
                    </div>
                </div>
            </div>
            
            <a href="aboutus.html" class="nav-link" data-text="About Us">
                <span class="nav-icon">👥</span>
                <span class="nav-text">About Us</span>
                <div class="nav-ripple"></div>
            </a>
            
            <a href="connect.html" class="nav-link" data-text="Connect">
                <span class="nav-icon">🤝</span>
                <span class="nav-text">Connect</span>
                <div class="nav-ripple"></div>
            </a>
        </div>

        <!-- Authentication Section -->
        <div class="auth-section">
            <!-- Not logged in state -->
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
    
    // Initialize navbar functionality
    initializeNavbar();
}

// Navbar functionality - Matching EJS implementation exactly
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
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        
        if (window.scrollY > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    });

    // Active link highlighting
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .auth-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
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

    // Enhanced dropdown functionality - Matching EJS exactly
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    
    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const panel = dropdown.querySelector('.dropdown-panel');
        let hoverTimeout;

        if (trigger && panel) {
            // Show dropdown on hover
            dropdown.addEventListener('mouseenter', function() {
                clearTimeout(hoverTimeout);
                panel.style.opacity = '1';
                panel.style.visibility = 'visible';
                panel.style.transform = 'translateX(-50%) translateY(0) scale(1)';
            });

            // Hide dropdown when leaving both trigger and panel
            dropdown.addEventListener('mouseleave', function() {
                hoverTimeout = setTimeout(() => {
                    panel.style.opacity = '0';
                    panel.style.visibility = 'hidden';
                    panel.style.transform = 'translateX(-50%) translateY(-8px) scale(0.96)';
                }, 100); // Small delay to allow moving to dropdown
            });

            // Keep dropdown open when hovering the panel
            panel.addEventListener('mouseenter', function() {
                clearTimeout(hoverTimeout);
            });
        }
    });

    // Populate mobile navigation - Matching EJS implementation
    const navLinksContainer = document.querySelector('.nav-links');
    const authSection = document.querySelector('.auth-section');
    const mobileNavLinks = document.querySelector('.mobile-nav-links');

    if (navLinksContainer && authSection && mobileNavLinks) {
        const allLinks = [...navLinksContainer.children, ...authSection.children];
        
        allLinks.forEach(item => {
            if (item.tagName === 'A' || item.classList.contains('nav-dropdown')) {
                const mobileItem = item.cloneNode(true);
                mobileItem.style.fontSize = '1.1rem';
                mobileItem.style.padding = '12px 20px';
                mobileItem.style.color = 'white';
                mobileItem.style.borderRadius = '12px';
                mobileItem.style.minWidth = '180px';
                mobileItem.style.textAlign = 'center';
                mobileItem.addEventListener('click', toggleMobileMenu);
                mobileNavLinks.appendChild(mobileItem);
            }
        });
    }
}

// Load navbar when DOM is ready
document.addEventListener('DOMContentLoaded', loadNavbar);