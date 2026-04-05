// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile Menu Toggle
    const createMobileMenu = () => {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && window.innerWidth <= 768) {
            const mobileMenuBtn = document.createElement('button');
            mobileMenuBtn.className = 'mobile-menu-btn';
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            document.querySelector('.logo').after(mobileMenuBtn);
            
            mobileMenuBtn.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    };

    // Search Functionality
    const setupSearch = () => {
        const searchBtn = document.querySelector('.btn-search');
        const searchInput = document.querySelector('.search-input');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                const searchTerm = searchInput.value.trim();
                if (searchTerm) {
                    console.log('Searching for:', searchTerm);
                    // In a real application, this would trigger a search
                    window.location.href = `home.html?search=${encodeURIComponent(searchTerm)}`;
                }
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchBtn.click();
                }
            });
        }

        // Home page search
        const searchBtnMain = document.querySelector('.btn-search-main');
        const searchInputMain = document.querySelector('.search-input-main');
        
        if (searchBtnMain && searchInputMain) {
            searchBtnMain.addEventListener('click', () => {
                const searchTerm = searchInputMain.value.trim();
                if (searchTerm) {
                    console.log('Searching for:', searchTerm);
                    // Filter products based on search term
                    filterProducts(searchTerm);
                }
            });

            searchInputMain.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchBtnMain.click();
                }
            });
        }
    };

    // Category Cards Interaction
    const setupCategoryCards = () => {
        const categoryCards = document.querySelectorAll('.category-card');
        
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const categoryName = card.querySelector('h3').textContent;
                console.log('Selected category:', categoryName);
                // In a real application, this would navigate to category page
                window.location.href = `home.html?category=${encodeURIComponent(categoryName)}`;
            });
        });
    };

    // Favorite Button Functionality
    const setupFavorites = () => {
        const favoriteButtons = document.querySelectorAll('.btn-favorite');
        
        favoriteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click event
                const icon = btn.querySelector('i');
                
                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    btn.style.color = '#ff6b6b';
                    showNotification('Added to favorites!');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    btn.style.color = '';
                    showNotification('Removed from favorites!');
                }
            });
        });
    };

    // Product Card Click
    const setupProductCards = () => {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking favorite button
                if (!e.target.closest('.btn-favorite')) {
                    const productTitle = card.querySelector('.product-title').textContent;
                    console.log('Clicked product:', productTitle);
                    // In a real application, this would navigate to product detail page
                    // window.location.href = `product-detail.html?id=${productId}`;
                    showNotification('Product details page coming soon!');
                }
            });
        });
    };

    // Filter Functionality
    const setupFilters = () => {
        const applyFiltersBtn = document.querySelector('.btn-apply-filters');
        const clearFiltersBtn = document.querySelector('.btn-clear-filters');
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                applyFilters();
            });
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                clearFilters();
            });
        }
    };

    // Apply Filters Function
    const applyFilters = () => {
        const minPrice = document.querySelector('.price-input:first-of-type')?.value;
        const maxPrice = document.querySelector('.price-input:last-of-type')?.value;
        const conditions = Array.from(document.querySelectorAll('.filter-group:nth-of-type(2) input:checked'))
            .map(cb => cb.parentElement.textContent.trim());
        const sellerTypes = Array.from(document.querySelectorAll('.filter-group:nth-of-type(3) input:checked'))
            .map(cb => cb.parentElement.textContent.trim());
        
        console.log('Applying filters:', { minPrice, maxPrice, conditions, sellerTypes });
        showNotification('Filters applied!');
        
        // In a real application, this would filter the products
        filterProducts(null, { minPrice, maxPrice, conditions, sellerTypes });
    };

    // Clear Filters Function
    const clearFilters = () => {
        document.querySelectorAll('.price-input').forEach(input => input.value = '');
        document.querySelectorAll('.checkbox-label input').forEach(cb => cb.checked = false);
        showNotification('Filters cleared!');
        
        // Reset product display
        filterProducts(null, null);
    };

    // Filter Products Function
    const filterProducts = (searchTerm, filters) => {
        const productCards = document.querySelectorAll('.product-card');
        let visibleCount = 0;
        
        productCards.forEach(card => {
            let shouldShow = true;
            const title = card.querySelector('.product-title').textContent.toLowerCase();
            const priceText = card.querySelector('.product-price').textContent;
            const price = parseInt(priceText.replace('$', ''));
            
            // Search term filter
            if (searchTerm && !title.includes(searchTerm.toLowerCase())) {
                shouldShow = false;
            }
            
            // Price filter
            if (filters && filters.minPrice && price < parseInt(filters.minPrice)) {
                shouldShow = false;
            }
            if (filters && filters.maxPrice && price > parseInt(filters.maxPrice)) {
                shouldShow = false;
            }
            
            if (shouldShow) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Update results count
        const resultsInfo = document.querySelector('.results-info p');
        if (resultsInfo) {
            resultsInfo.textContent = `Showing 1-${visibleCount} of ${visibleCount} results`;
        }
    };

    // Sort Functionality
    const setupSort = () => {
        const sortSelect = document.querySelector('.sort-select');
        
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const sortValue = e.target.value;
                console.log('Sorting by:', sortValue);
                sortProducts(sortValue);
            });
        }
    };

    // Sort Products Function
    const sortProducts = (sortType) => {
        const productsGrid = document.querySelector('.products-grid');
        const productCards = Array.from(productsGrid.querySelectorAll('.product-card'));
        
        productCards.sort((a, b) => {
            const priceA = parseInt(a.querySelector('.product-price').textContent.replace('$', ''));
            const priceB = parseInt(b.querySelector('.product-price').textContent.replace('$', ''));
            
            switch(sortType) {
                case 'price-low':
                    return priceA - priceB;
                case 'price-high':
                    return priceB - priceA;
                case 'newest':
                default:
                    return 0; // Keep original order for newest
            }
        });
        
        // Clear and re-append sorted cards
        productsGrid.innerHTML = '';
        productCards.forEach(card => productsGrid.appendChild(card));
        
        showNotification('Products sorted!');
    };

    // View Toggle
    const setupViewToggle = () => {
        const viewButtons = document.querySelectorAll('.view-btn');
        const productsGrid = document.querySelector('.products-grid');
        
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const icon = btn.querySelector('i');
                if (icon.classList.contains('fa-list')) {
                    productsGrid.style.gridTemplateColumns = '1fr';
                } else {
                    productsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
                }
            });
        });
    };

    // Pagination
    const setupPagination = () => {
        const paginationButtons = document.querySelectorAll('.pagination-btn');
        
        paginationButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!btn.disabled && !btn.textContent.includes('...')) {
                    // Remove active class from all buttons
                    paginationButtons.forEach(b => b.classList.remove('active'));
                    
                    // Add active class to clicked button
                    if (!btn.textContent.includes('Previous') && !btn.textContent.includes('Next')) {
                        btn.classList.add('active');
                    }
                    
                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    
                    console.log('Page:', btn.textContent);
                    showNotification(`Loading page ${btn.textContent}...`);
                }
            });
        });
    };

    // Smooth Scroll for Navigation Links
    const setupSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href !== '#') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    };

    // Show Notification Function
    const showNotification = (message) => {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background-color: #002f34;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    // CTA Button
    const setupCTA = () => {
        const ctaBtn = document.querySelector('.btn-cta');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', () => {
                showNotification('Sign up feature coming soon!');
                // In a real application, this would open a signup modal or navigate to signup page
            });
        }
    };

    // Initialize all functionality
    createMobileMenu();
    setupSearch();
    setupCategoryCards();
    setupFavorites();
    setupProductCards();
    setupFilters();
    setupSort();
    setupViewToggle();
    setupPagination();
    setupSmoothScroll();
    setupCTA();

    // Handle window resize
    window.addEventListener('resize', () => {
        createMobileMenu();
    });

    // Show welcome message on landing page
    if (document.querySelector('.hero')) {
        console.log('Welcome to Uni Buy N Sell!');
    }
});
