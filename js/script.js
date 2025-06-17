// The Corner Coffeeshop - Custom JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    
    // Show loading state
    const menuContainer = document.querySelector('#menu .row.g-4');
    if (menuContainer) {
        menuContainer.innerHTML = `
            <div class="col-12">
                <div class="loading-spinner">
                    <div class="spinner-border-custom"></div>
                    <span class="ms-3">Loading menu...</span>
                </div>
            </div>
        `;
    }

    // Initialize data loading
    try {
        // Load menu and contact data
        const [menuData, contactData] = await Promise.all([
            dataManager.loadMenu(),
            dataManager.loadContact()
        ]);
        
        // Update contact information
        updateContactInfo(contactData);
        
        // Render featured menu items
        const featuredItems = dataManager.getFeaturedItems(menuData);
        renderMenu(featuredItems);
        
        // Add category filters
        const menuSection = document.querySelector('#menu .container .row:first-child');
        if (menuSection) {
            const filtersHTML = createCategoryFilters(menuData.categories);
            menuSection.insertAdjacentHTML('afterend', `<div class="row"><div class="col-12">${filtersHTML}</div></div>`);
            
            // Add filter event listeners
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const category = this.dataset.category;
                    const filteredItems = category === 'all' ? 
                        menuData.menu_items : 
                        dataManager.filterMenuByCategory(menuData, category);
                    
                    renderMenu(filteredItems);
                    
                    // Update active filter
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        }
        
        // Add search functionality
        const searchHTML = `
            <div class="menu-search text-center mb-4">
                <div class="input-group justify-content-center">
                    <input type="text" class="form-control" id="menuSearch" 
                           placeholder="Search menu items..." style="max-width: 300px;">
                    <button class="btn btn-outline-light" type="button" id="searchBtn">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
        `;
        
        const filtersContainer = document.querySelector('.menu-filters');
        if (filtersContainer) {
            filtersContainer.insertAdjacentHTML('afterend', searchHTML);
            
            const searchInput = document.getElementById('menuSearch');
            const searchBtn = document.getElementById('searchBtn');
            
            function performSearch() {
                const query = searchInput.value.trim();
                const results = query ? 
                    dataManager.searchMenu(menuData, query) : 
                    dataManager.getFeaturedItems(menuData);
                renderMenu(results);
                
                // Reset filter buttons
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.category === 'all');
                });
            }
            
            searchInput.addEventListener('input', performSearch);
            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') performSearch();
            });
        }
        
        console.log('Menu and contact data loaded successfully!');
        
    } catch (error) {
        console.error('Error loading data:', error);
        
        // Show error state
        if (menuContainer) {
            menuContainer.innerHTML = `
                <div class="col-12">
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h5>Unable to load menu data</h5>
                        <p>Please check your connection and try refreshing the page.</p>
                        <button class="btn btn-outline-light" onclick="location.reload()">
                            <i class="fas fa-refresh me-2"></i>Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    // Navbar scroll effect
    const navbar = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Update active nav link based on scroll position
        updateActiveNavLink();
    });
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - navbar.offsetHeight;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                    bsCollapse.hide();
                }
            }
        });
    });
    
    // Update active navigation link
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + navbar.offsetHeight + 50;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`a[href="#${sectionId}"]`);
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) {
                    navLink.classList.add('active');
                }
            }
        });
    }
    
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loading');
                
                // Add staggered animation for menu cards
                if (entry.target.classList.contains('menu-card')) {
                    const cards = document.querySelectorAll('.menu-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.animationDelay = `${index * 0.1}s`;
                            card.classList.add('loading');
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.menu-card, .about-content, .contact-card');
    animatedElements.forEach(el => observer.observe(el));
    
    // Menu card hover effects with sound (visual feedback)
    const menuCards = document.querySelectorAll('.menu-card');
    menuCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Contact form handling (if form is added later)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulate form submission
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                submitBtn.textContent = 'Message Sent!';
                submitBtn.classList.add('btn-success');
                submitBtn.classList.remove('btn-primary');
                
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('btn-success');
                    submitBtn.classList.add('btn-primary');
                    contactForm.reset();
                }, 2000);
            }, 1500);
        });
    }
    
    // Social media link tracking
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('click', function() {
            const platform = this.querySelector('i').classList.contains('fa-instagram') ? 'Instagram' :
                           this.querySelector('i').classList.contains('fa-facebook') ? 'Facebook' : 'TikTok';
            
            // Visual feedback
            this.style.transform = 'scale(1.2)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
            
            console.log(`Clicked ${platform} social link`);
        });
    });
    
    // Phone number click tracking
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.addEventListener('click', function() {
            console.log('Phone call initiated');
        });
    });
    
    // Add parallax effect to hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.hero-section');
        const mascot = document.querySelector('.mascot-image');
        
        if (heroSection && scrolled < heroSection.offsetHeight) {
            heroSection.style.transform = `translateY(${scrolled * 0.5}px)`;
            
            if (mascot) {
                mascot.style.transform = `translateY(${scrolled * 0.3}px)`;
            }
        }
    });
    
    // Add loading animation to images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '0';
            this.style.animation = 'fadeIn 0.5s ease-in forwards';
        });
    });
    
    // Preload critical images
    const criticalImages = [
        'assets/mascot.svg'
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
    
    // Add retro typing effect to tagline
    const tagline = document.querySelector('.hero-tagline');
    if (tagline) {
        const text = tagline.textContent;
        tagline.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                tagline.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };
        
        // Start typing effect after a delay
        setTimeout(typeWriter, 1000);
    }
    
    // Add coffee steam animation effect
    function createSteamEffect() {
        const steamContainer = document.createElement('div');
        steamContainer.className = 'steam-container';
        steamContainer.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 40px;
            pointer-events: none;
        `;
        
        for (let i = 0; i < 3; i++) {
            const steam = document.createElement('div');
            steam.className = 'steam';
            steam.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 50%;
                animation: steam-rise 2s infinite ease-in-out;
                animation-delay: ${i * 0.3}s;
                left: ${i * 6}px;
            `;
            steamContainer.appendChild(steam);
        }
        
        return steamContainer;
    }
    
    // Add steam effect to coffee icons
    const coffeeIcons = document.querySelectorAll('.fa-mug-hot, .fa-coffee');
    coffeeIcons.forEach(icon => {
        const parent = icon.parentElement;
        parent.style.position = 'relative';
        parent.appendChild(createSteamEffect());
    });
    
    // Add CSS for steam animation
    const steamStyles = `
        @keyframes steam-rise {
            0% {
                opacity: 0;
                transform: translateY(20px) scale(0.8);
            }
            50% {
                opacity: 1;
                transform: translateY(10px) scale(1);
            }
            100% {
                opacity: 0;
                transform: translateY(0px) scale(1.2);
            }
        }
    `;
    
    const steamStyleSheet = document.createElement('style');
    steamStyleSheet.textContent = steamStyles;
    document.head.appendChild(steamStyleSheet);
    
    // Performance optimization: Debounced scroll handler
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(function() {
            // Any expensive scroll operations can go here
        }, 16); // ~60fps
    });
    
    console.log('The Corner Coffeeshop website loaded successfully! ☕');
});

// Utility function for smooth animations
function animateElement(element, animation, duration = 1000) {
    element.style.animation = `${animation} ${duration}ms ease-in-out`;
    
    return new Promise(resolve => {
        setTimeout(() => {
            element.style.animation = '';
            resolve();
        }, duration);
    });
}

// Export for potential use in other modules
window.CoffeeShopUtils = {
    animateElement,
    // Add more utility functions as needed
};
