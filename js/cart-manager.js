// Shopping Cart Manager
class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('coffeeShopCart')) || [];
        this.orderSettings = null;
        this.cartModal = null;
        this.deliveryDetails = JSON.parse(localStorage.getItem('deliveryDetails')) || {
            address: '',
            zone: '',
            paymentMethod: '',
            notes: ''
        };
        this.init();
    }

    async init() {
        try {
            // Wait for dataManager to be available
            if (typeof dataManager === 'undefined') {
                setTimeout(() => this.init(), 100);
                return;
            }
            
            const orderData = await dataManager.fetchData(`${dataManager.baseURL}/data/orders.json`);
            this.orderSettings = orderData.order_settings;
            this.createCartModal();
            this.bindEvents();
        } catch (error) {
            console.error('Error initializing cart:', error);
            // Set default settings if loading fails
            this.orderSettings = {
                tax_rate: 0.08,
                delivery_fee: 2.99,
                free_delivery_minimum: 25.00,
                estimated_prep_time: "15-20 minutes"
            };
            this.createCartModal();
            this.bindEvents();
        }
    }

    addToCart(item, quantity = 1) {
        const existingItem = this.cart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                ...item,
                quantity: quantity
            });
        }
        
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification(`${item.name} added to cart!`);
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartDisplay();
    }

    updateQuantity(itemId, quantity) {
        const item = this.cart.find(cartItem => cartItem.id === itemId);
        if (item) {
            item.quantity = Math.max(0, quantity);
            if (item.quantity === 0) {
                this.removeFromCart(itemId);
            } else {
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    getTax() {
        return this.getCartTotal() * (this.orderSettings?.tax_rate || 0.08);
    }

    getDeliveryFee() {
        const total = this.getCartTotal();
        const freeDeliveryMin = this.orderSettings?.free_delivery_minimum || 25;
        return total >= freeDeliveryMin ? 0 : (this.orderSettings?.delivery_fee || 2.99);
    }

    getFinalTotal() {
        return this.getCartTotal() + this.getTax() + this.getDeliveryFee();
    }

    saveCart() {
        localStorage.setItem('coffeeShopCart', JSON.stringify(this.cart));
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartDisplay();
    }

    createCartModal() {
        const modalHTML = `
            <div class="modal fade" id="cartModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title fw-bold">YOUR ORDER</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="cartItems"></div>
                            <div id="cartSummary" class="mt-4"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Continue Shopping</button>
                            <button type="button" class="btn btn-primary" id="checkoutBtn">Place Order</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
    }

    updateCartDisplay() {
        this.updateCartBadge();
        this.updateCartModal();
    }

    updateCartBadge() {
        let cartBadge = document.querySelector('.cart-badge');
        if (!cartBadge) {
            const navbar = document.querySelector('.navbar-nav');
            if (navbar) {
                const cartHTML = `
                    <li class="nav-item">
                        <a class="nav-link position-relative" href="#" id="cartToggle">
                            <i class="fas fa-shopping-cart"></i>
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning cart-badge">0</span>
                        </a>
                    </li>
                `;
                navbar.insertAdjacentHTML('beforeend', cartHTML);
                cartBadge = document.querySelector('.cart-badge');
                
                document.getElementById('cartToggle').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showCart();
                });
            }
        }
        
        if (cartBadge) {
            const count = this.getCartCount();
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    updateCartModal() {
        const cartItems = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');
        
        if (!cartItems || !cartSummary) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="text-center text-muted">Your cart is empty</p>';
            cartSummary.innerHTML = '';
            const checkoutBtn = document.getElementById('checkoutBtn');
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item d-flex align-items-center mb-3 p-3 border rounded">
                <img src="${item.image}" alt="${item.name}" class="rounded me-3" style="width: 60px; height: 60px; object-fit: cover;">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${item.name}</h6>
                    <small class="text-muted">${dataManager.formatPrice(item.price)} each</small>
                </div>
                <div class="quantity-controls d-flex align-items-center me-3">
                    <button class="btn btn-sm btn-outline-secondary" onclick="cartManager.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="mx-2">${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-secondary" onclick="cartManager.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <div class="item-total fw-bold">
                    ${dataManager.formatPrice(item.price * item.quantity)}
                </div>
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="cartManager.removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        const subtotal = this.getCartTotal();
        const tax = this.getTax();
        const delivery = this.getDeliveryFee();
        const total = this.getFinalTotal();

        cartSummary.innerHTML = `
            <div class="border-top pt-3">
                <div class="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>${dataManager.formatPrice(subtotal)}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Tax:</span>
                    <span>${dataManager.formatPrice(tax)}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Delivery:</span>
                    <span>${delivery === 0 ? 'FREE' : dataManager.formatPrice(delivery)}</span>
                </div>
                <hr>
                <div class="d-flex justify-content-between fw-bold fs-5">
                    <span>Total:</span>
                    <span>${dataManager.formatPrice(total)}</span>
                </div>
                <small class="text-muted d-block mt-2">
                    Estimated prep time: ${this.orderSettings?.estimated_prep_time || '15-20 minutes'}
                </small>
            </div>
        `;

        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) checkoutBtn.disabled = false;
    }

    showCart() {
        this.updateCartModal();
        this.cartModal.show();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                const itemId = parseInt(e.target.dataset.itemId);
                const itemData = e.target.dataset.item;
                if (itemData) {
                    const item = JSON.parse(itemData);
                    this.addToCart(item);
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.id === 'checkoutBtn') {
                this.processOrder();
            }
        });
    }

    processOrder() {
        if (this.cart.length === 0) return;

        const orderData = {
            id: Date.now(),
            items: [...this.cart],
            subtotal: this.getCartTotal(),
            tax: this.getTax(),
            delivery: this.getDeliveryFee(),
            total: this.getFinalTotal(),
            timestamp: new Date().toISOString(),
            status: 'placed'
        };

        // Simulate order processing
        const checkoutBtn = document.getElementById('checkoutBtn');
        checkoutBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
        checkoutBtn.disabled = true;

        setTimeout(() => {
            this.clearCart();
            this.cartModal.hide();
            this.showNotification('Order placed successfully! We\'ll have it ready soon.', 'success');
            checkoutBtn.innerHTML = 'Place Order';
            checkoutBtn.disabled = false;
        }, 2000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize cart manager
window.cartManager = new CartManager();