// Data Manager - Handles all AJAX requests and data operations
class DataManager {
    constructor() {
        this.cache = new Map();
        this.baseURL = window.location.origin;
    }

    // Generic AJAX request method
    async fetchData(url, options = {}) {
        const cacheKey = url + JSON.stringify(options);
        
        // Return cached data if available
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache the response for 5 minutes
            this.cache.set(cacheKey, data);
            setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
            
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    // Load menu data
    async loadMenu() {
        return await this.fetchData('/data/menu.json');
    }

    // Load contact information
    async loadContact() {
        return await this.fetchData('/data/contact.json');
    }

    // Filter menu items by category
    filterMenuByCategory(menuData, category) {
        if (!category || category === 'all') {
            return menuData.menu_items;
        }
        return menuData.menu_items.filter(item => item.category === category);
    }

    // Get featured menu items
    getFeaturedItems(menuData) {
        return menuData.menu_items.filter(item => item.featured && item.available);
    }

    // Search menu items
    searchMenu(menuData, query) {
        const searchTerm = query.toLowerCase();
        return menuData.menu_items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
    }

    // Format price
    formatPrice(price) {
        return `$${price.toFixed(2)}`;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Create menu item HTML
function createMenuItemHTML(item) {
    return `
        <div class="col-md-6 col-lg-4 menu-item" data-category="${item.category}" data-id="${item.id}">
            <div class="menu-card card h-100 border-0 shadow-sm">
                <div class="card-img-wrapper">
                    <img src="${item.image}" class="card-img-top" alt="${item.name}" loading="lazy">
                </div>
                <div class="card-body text-center">
                    <div class="menu-icon mb-3">
                        <i class="${item.icon} fa-3x text-primary"></i>
                    </div>
                    <h5 class="card-title fw-bold">${item.name}</h5>
                    <p class="card-text">${item.description}</p>
                    <span class="price fw-bold text-primary">${dataManager.formatPrice(item.price)}</span>
                    ${!item.available ? 
                        '<div class="mt-2"><span class="badge bg-warning">Currently Unavailable</span></div>' : 
                        `<div class="mt-3">
                            <button class="btn btn-primary add-to-cart-btn" 
                                    data-item-id="${item.id}" 
                                    data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}'>
                                <i class="fas fa-plus me-2"></i>Add to Cart
                            </button>
                        </div>`
                    }
                </div>
            </div>
        </div>
    `;
}

// Render menu items
function renderMenu(items, container) {
    const menuContainer = container || document.querySelector('#menu .row.g-4');
    if (!menuContainer) return;

    menuContainer.innerHTML = items.map(createMenuItemHTML).join('');
    
    // Trigger animations for newly loaded items
    const menuCards = menuContainer.querySelectorAll('.menu-card');
    menuCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('loading');
        }, index * 100);
    });
}

// Create filter buttons
function createCategoryFilters(categories, activeCategory = 'all') {
    const filtersHTML = `
        <div class="menu-filters text-center mb-4">
            <button class="btn btn-outline-light me-2 mb-2 filter-btn ${activeCategory === 'all' ? 'active' : ''}" 
                    data-category="all">All Items</button>
            ${categories.map(category => `
                <button class="btn btn-outline-light me-2 mb-2 filter-btn ${activeCategory === category.id ? 'active' : ''}" 
                        data-category="${category.id}">${category.name}</button>
            `).join('')}
        </div>
    `;
    
    return filtersHTML;
}

// Update contact information
function updateContactInfo(contactData) {
    const updates = [
        { selector: '.contact-item:nth-child(1) p', content: contactData.contact.address.full },
        { selector: '.contact-item:nth-child(2) p', content: `${contactData.contact.phone.display}<br>${contactData.contact.phone.number}` },
        { selector: '.contact-item:nth-child(3) p', content: contactData.contact.email },
        { selector: '.contact-item:nth-child(4) p', content: `${contactData.hours.weekdays.days}: ${contactData.hours.weekdays.hours}<br>${contactData.hours.weekends.days}: ${contactData.hours.weekends.hours}` },
        { selector: '.hero-tagline', content: contactData.business_info.tagline },
        { selector: '.footer-brand p', content: `${contactData.business_info.tagline} Timeless Experience.` }
    ];

    updates.forEach(update => {
        const element = document.querySelector(update.selector);
        if (element) {
            element.innerHTML = update.content;
        }
    });

    // Update social media links
    const socialLinks = {
        'fab fa-instagram': contactData.social_media.instagram.url,
        'fab fa-facebook': contactData.social_media.facebook.url,
        'fab fa-tiktok': contactData.social_media.tiktok.url
    };

    Object.entries(socialLinks).forEach(([iconClass, url]) => {
        const link = document.querySelector(`a[href*="${iconClass.split('-')[1]}"]`);
        if (link) {
            link.href = url;
        }
    });

    // Update stats
    const stats = document.querySelectorAll('.stat-number');
    const statValues = [contactData.stats.years_serving, contactData.stats.happy_customers, contactData.stats.coffee_varieties];
    stats.forEach((stat, index) => {
        if (statValues[index]) {
            stat.textContent = statValues[index];
        }
    });
}

// Initialize data manager
const dataManager = new DataManager();

// Export for global use
window.DataManager = DataManager;
window.dataManager = dataManager;
window.createMenuItemHTML = createMenuItemHTML;
window.renderMenu = renderMenu;
window.createCategoryFilters = createCategoryFilters;
window.updateContactInfo = updateContactInfo;