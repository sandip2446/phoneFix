// Initialize AOS with optimized settings
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    mirror: false,
    disable: window.innerWidth < 768
});

// DOM Elements
const elements = {
    mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
    navLinks: document.querySelector('.nav-links'),
    navbar: document.querySelector('.navbar'),
    serviceCards: document.querySelectorAll('.service-card'),
    repairCards: document.querySelectorAll('.repair-card'),
    readMoreButtons: document.querySelectorAll('.read-more-btn'),
    ctaButtons: document.querySelectorAll('.cta-button')
};

// State Management
let isMenuOpen = false;
let lastScroll = 0;

// Mobile Menu Functions
function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    elements.mobileMenuBtn.setAttribute('aria-expanded', isMenuOpen);
    elements.navLinks.classList.toggle('active');
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    
    // Toggle overlay
    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);
    }
    overlay.classList.toggle('active');
    
    // Toggle menu button animation
    const spans = elements.mobileMenuBtn.querySelectorAll('span');
    spans.forEach(span => span.classList.toggle('active'));
    
    // Announce menu state
    announceContentUpdate(isMenuOpen ? 'Menu opened' : 'Menu closed');
}

function closeMenu() {
    if (isMenuOpen) {
        isMenuOpen = false;
        elements.mobileMenuBtn.setAttribute('aria-expanded', 'false');
        elements.navLinks.classList.remove('active');
        document.body.style.overflow = '';
        
        // Remove overlay
        const overlay = document.querySelector('.nav-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        // Reset menu button
        const spans = elements.mobileMenuBtn.querySelectorAll('span');
        spans.forEach(span => span.classList.remove('active'));
    }
}

// Service Card Functions
function toggleServiceDetails(button) {
    const detailsContainer = button.closest('.service-details, .repair-details');
    const fullDetails = detailsContainer.querySelector('.full-details');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    
    // Ensure we have the correct elements
    if (!detailsContainer || !fullDetails) {
        console.error('Required elements not found');
        return;
    }
    
    if (isExpanded) {
        collapseDetails(button, fullDetails);
    } else {
        expandDetails(button, fullDetails);
    }
}

function collapseDetails(button, details) {
    if (!button || !details) return;
    
    // First update the button state
    button.textContent = 'Learn More';
    button.setAttribute('aria-expanded', 'false');
    
    // Then update the details visibility
    details.classList.remove('active');
    details.setAttribute('aria-hidden', 'true');
    
    // Remove show less button if it exists
    const showLessBtn = details.querySelector('.show-less-btn');
    if (showLessBtn) {
        showLessBtn.remove();
    }
    
    // Announce the change
    announceContentUpdate('Details collapsed');
}

function expandDetails(button, details) {
    if (!button || !details) return;
    
    // Close other expanded sections first
    document.querySelectorAll('.service-card .full-details.active, .repair-card .full-details.active').forEach(container => {
        if (container !== details) {
            const btn = container.closest('.service-details, .repair-details')?.querySelector('.read-more-btn');
            if (btn) {
                collapseDetails(btn, container);
            }
        }
    });

    // Update button state
    button.textContent = 'Show Less';
    button.setAttribute('aria-expanded', 'true');
    
    // Update details visibility
    details.classList.add('active');
    details.setAttribute('aria-hidden', 'false');
    
    // Add show less button if it doesn't exist
    if (!details.querySelector('.show-less-btn')) {
        const showLessBtn = document.createElement('button');
        showLessBtn.className = 'show-less-btn';
        showLessBtn.textContent = 'Show Less';
        showLessBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            collapseDetails(button, details);
        });
        details.appendChild(showLessBtn);
    }
    
    // Announce the change
    announceContentUpdate('Details expanded');
    
    // Smooth scroll to content
    setTimeout(() => {
        details.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }, 300);
}

// Navigation Functions
function handleScroll() {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        elements.navbar.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !elements.navbar.classList.contains('scroll-down')) {
        elements.navbar.classList.remove('scroll-up');
        elements.navbar.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && elements.navbar.classList.contains('scroll-down')) {
        elements.navbar.classList.remove('scroll-down');
        elements.navbar.classList.add('scroll-up');
    }
    
    lastScroll = currentScroll;
}

function smoothScroll(target) {
    if (!target) return;
    
    target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    
    // Update URL without page reload
    history.pushState(null, null, `#${target.id}`);
    
    // Set focus for accessibility
    target.setAttribute('tabindex', '-1');
    target.focus();
    
    announceContentUpdate(`Navigated to ${target.getAttribute('aria-label') || target.textContent}`);
}

// Utility Functions
function announceContentUpdate(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
}

function handleClickOutside(event, element, callback) {
    if (!element.contains(event.target)) {
        callback();
    }
}

// Carousel Functions
function initializeCarousel() {
    const grid = document.querySelector('.used-phones-grid');
    const cards = document.querySelectorAll('.used-phone-card');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');
    const dots = document.querySelectorAll('.dot');
    
    if (!grid || !cards.length) return;
    
    let currentIndex = 0;
    const cardsPerView = window.innerWidth <= 768 ? 1 : 3;
    const totalSlides = Math.ceil(cards.length / cardsPerView);
    let isAnimating = false;
    let touchStartX = 0;
    let touchEndX = 0;
    let autoPlayInterval;
    
    // Update dots based on total slides
    const dotsContainer = document.querySelector('.carousel-dots');
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = `dot ${i === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Slide ${i + 1}`);
            dot.addEventListener('click', () => {
                stopAutoPlay();
                currentIndex = i;
                updateCarousel();
                startAutoPlay();
            });
            dotsContainer.appendChild(dot);
        }
    }
    
    function updateCarousel(animate = true) {
        if (isAnimating) return;
        isAnimating = true;
        
        const offset = currentIndex * -100;
        grid.style.transition = animate ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
        grid.style.transform = `translateX(${offset}%)`;
        
        // Update dots
        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        // Update button states
        prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        nextBtn.style.opacity = currentIndex === totalSlides - 1 ? '0.5' : '1';
        
        // Reset animation flag after transition
        setTimeout(() => {
            isAnimating = false;
        }, 500);
    }
    
    function nextSlide() {
        if (currentIndex < totalSlides - 1) {
            currentIndex++;
            updateCarousel();
        }
    }
    
    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    }
    
    // Touch event handlers
    const handleTouchStart = (e) => {
        touchStartX = e.touches[0].clientX;
        grid.style.transition = 'none';
    };
    
    const handleTouchMove = (e) => {
        if (!touchStartX) return;
        
        touchEndX = e.touches[0].clientX;
        const diff = touchStartX - touchEndX;
        const currentOffset = currentIndex * -100;
        const newOffset = currentOffset - (diff / grid.parentElement.offsetWidth) * 100;
        
        // Limit the drag
        if (newOffset > 0 || newOffset < -(totalSlides - 1) * 100) return;
        
        grid.style.transform = `translateX(${newOffset}%)`;
    };
    
    const handleTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;
        
        const diff = touchStartX - touchEndX;
        const threshold = grid.parentElement.offsetWidth * 0.2;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0 && currentIndex < totalSlides - 1) {
                nextSlide();
            } else if (diff < 0 && currentIndex > 0) {
                prevSlide();
            } else {
                updateCarousel();
            }
        } else {
            updateCarousel();
        }
        
        touchStartX = null;
        touchEndX = null;
    };
    
    // Auto-play functionality
    const startAutoPlay = () => {
        autoPlayInterval = setInterval(() => {
            if (currentIndex < totalSlides - 1) {
                nextSlide();
            } else {
                currentIndex = 0;
                updateCarousel();
            }
        }, 5000);
    };
    
    const stopAutoPlay = () => {
        clearInterval(autoPlayInterval);
    };
    
    // Event Listeners
    prevBtn?.addEventListener('click', () => {
        stopAutoPlay();
        prevSlide();
        startAutoPlay();
    });
    
    nextBtn?.addEventListener('click', () => {
        stopAutoPlay();
        nextSlide();
        startAutoPlay();
    });
    
    // Touch events
    grid.addEventListener('touchstart', handleTouchStart, { passive: true });
    grid.addEventListener('touchmove', handleTouchMove, { passive: true });
    grid.addEventListener('touchend', handleTouchEnd);
    
    // Pause auto-play on hover
    grid.addEventListener('mouseenter', stopAutoPlay);
    grid.addEventListener('mouseleave', startAutoPlay);
    
    // Handle window resize with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const newCardsPerView = window.innerWidth <= 768 ? 1 : 3;
            if (newCardsPerView !== cardsPerView) {
                currentIndex = 0;
                updateCarousel(false);
            }
        }, 250);
    });
    
    // Initialize
    updateCarousel(false);
    startAutoPlay();
}

// Event Listeners
function initializeEventListeners() {
    // Mobile menu
    elements.mobileMenuBtn?.addEventListener('click', toggleMenu);
    
    // Close menu when clicking overlay
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-overlay')) {
            closeMenu();
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (isMenuOpen && !e.target.closest('.nav-links') && !e.target.closest('.mobile-menu-btn')) {
            closeMenu();
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });
    
    // Used Phone Details Buttons
    document.querySelectorAll('.used-phone-card .details-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const card = button.closest('.used-phone-card');
            const details = card.querySelector('.full-details');
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            
            // Close other expanded sections first
            document.querySelectorAll('.used-phone-card .full-details.active').forEach(container => {
                if (container !== details) {
                    const btn = container.closest('.used-phone-card')?.querySelector('.details-btn');
                    if (btn) {
                        btn.textContent = 'View Details';
                        btn.setAttribute('aria-expanded', 'false');
                        container.classList.remove('active');
                    }
                }
            });

            if (isExpanded) {
                button.textContent = 'View Details';
                button.setAttribute('aria-expanded', 'false');
                details.classList.remove('active');
            } else {
                button.textContent = 'Back to Phone';
                button.setAttribute('aria-expanded', 'true');
                details.classList.add('active');
                
                // Add hide details button if it doesn't exist
                if (!details.querySelector('.hide-details-btn')) {
                    const hideBtn = document.createElement('button');
                    hideBtn.className = 'hide-details-btn';
                    hideBtn.innerHTML = '<span><i class="fas fa-chevron-up"></i> Hide Details</span>';
                    hideBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        button.textContent = 'View Details';
                        button.setAttribute('aria-expanded', 'false');
                        details.classList.remove('active');
                    });
                    details.appendChild(hideBtn);
                }
            }
        });
    });
    
    // Scroll handling
    window.addEventListener('scroll', handleScroll);
    
    // Service and Repair card buttons
    document.querySelectorAll('.service-card .read-more-btn, .repair-card .read-more-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleServiceDetails(button);
        });
    });
    
    // Navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                smoothScroll(target);
                closeMenu();
            }
        });
    });
    
    // CTA buttons
    elements.ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const contactSection = document.querySelector('#contact');
            if (contactSection) {
                smoothScroll(contactSection);
                contactSection.classList.add('highlight');
                setTimeout(() => contactSection.classList.remove('highlight'), 2000);
            }
        });
    });
    
    // Initialize carousel
    initializeCarousel();
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    
    // Initialize typing animation for hero section
    const heroTitle = document.querySelector('.hero-content h1');
    if (heroTitle) {
        const heroText = heroTitle.textContent;
        heroTitle.textContent = '';
        let i = 0;
        
        function typeWriter() {
            if (i < heroText.length) {
                heroTitle.textContent += heroText.charAt(i);
                i++;
                requestAnimationFrame(() => setTimeout(typeWriter, 100));
            }
        }
        
        typeWriter();
    }
}); 