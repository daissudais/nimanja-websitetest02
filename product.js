// 1. Import all required Firebase SDKs (Using your updated version 12.14.0)
import { ref, get } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";
import { db } from "./firebase_config.js";
import './productsidebar.js';


let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 16; 
let isDataLoaded = false;

// --- 3. Upgraded Firebase Loading Logic with Automated 30-Min Cache ---
async function loadProducts() {
    try {
        const container = document.getElementById('catalog-container');
        if (container) {
            container.innerHTML = `
                <div class="product-skeleton-loader">
                    <p>Loading products...</p>
                </div>
            `;
        }

        // 1. DETECT BROWSER REFRESH: If the user explicitly reloads the page, clear the cache
        const navigationEntry = performance.getEntriesByType('navigation')[0];
        if (navigationEntry && navigationEntry.type === 'reload') {
            localStorage.removeItem('nimanja_products_cache');
            localStorage.removeItem('nimanja_products_cache_time');
        }
        
        
        const now = new Date().getTime();
        const CACHE_KEY = 'nimanja_products_cache';
        const CACHE_TIME_KEY = 'nimanja_products_cache_time';
        const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

        const cachedData = localStorage.getItem(CACHE_KEY);
        const cacheTime = localStorage.getItem(CACHE_TIME_KEY);

        if (cachedData && cacheTime && (now - cacheTime < CACHE_DURATION)) {
            console.log("Loading products from local cache...");
            allProducts = JSON.parse(cachedData);
            isDataLoaded = true;
            initCatalogUI();
            return;
        }

        console.log("Cache expired or empty. Fetching fresh data from Firebase...");
        const dataRef = ref(db, 'web_data');
        const snapshot = await get(dataRef);
        
        if (snapshot.exists()) {
            const firebaseData = snapshot.val();
            
            allProducts = Object.keys(firebaseData).map(key => {
                const item = firebaseData[key] || {};
                return { 
                    name: (item.name || item.Name || "").trim(), 
                    price: item.price || item.Price || "", 
                    category: item.category || item.Category || "", 
                    image: item.imageUrl || item.image || item.Image || "", 
                    description: item.description || item.Description || "", 
                    extraImages: item.extraImages || item.ExtraImages || "",
                    brand: item.brand || item.Brand || "",     
                    sibuPrice: item.sibuPromoPrice || item.sibuPrice || "", 
                    dealType: item.dealType || item.DealType || "",       
                    additionalInfo: item.additionalInfo || "", 
                    bundlePrice: item.bundlePrice || "",   
                    miriPrice: item.miriPrice || ""      
                };
            }).filter(p => p.name);

            localStorage.setItem(CACHE_KEY, JSON.stringify(allProducts));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
            
        } else {
            console.log("No data available in Firebase paths.");
            if (cachedData) {
                allProducts = JSON.parse(cachedData);
            }
        }
        isDataLoaded = true;
        initCatalogUI();
    } catch (error) {
        console.error("Error loading products from Firebase:", error);
        if (cachedData) {
            allProducts = JSON.parse(cachedData);
        }
        isDataLoaded = true;
        initCatalogUI();
    }
}

function initCatalogUI() {
    const params = new URLSearchParams(window.location.search);
    const initialCat = params.get('category') || "All Categories";
    populateCategoryFilter();
    populateBrandFilter(initialCat);
    setupFilters(params.get('search'), initialCat, params.get('sort'));
}

function populateCategoryFilter() {
    const containers = [document.getElementById('category-list'), document.getElementById('category-list-mobile')];
    const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(c => c && c.trim().length > 0))];
    uniqueCategories.sort();

    containers.forEach(container => {
        if (!container) return;
        container.innerHTML = '<li class="active" data-value="All Categories">All Categories</li>';
        uniqueCategories.forEach(cat => {
            const li = document.createElement('li');
            li.setAttribute('data-value', cat);
            li.textContent = cat;
            container.appendChild(li);
        });
    });
}

function populateBrandFilter(category = "All Categories") {
    const containers = [document.getElementById('brand-list'), document.getElementById('brand-list-mobile')];
    
    // Filter products by selected category first to determine available brands
    const relevantProducts = category === "All Categories" 
        ? allProducts 
        : allProducts.filter(p => p.category === category);

    const uniqueBrands = [...new Set(relevantProducts.map(p => p.brand).filter(b => b && b.length > 0))];
    uniqueBrands.sort();

    containers.forEach(container => {
        if (!container) return;
        container.innerHTML = '<li class="active" data-value="All Brands">All Brands</li>';
        uniqueBrands.forEach(brand => {
            const li = document.createElement('li');
            li.setAttribute('data-value', brand);
            li.textContent = brand;
            container.appendChild(li);
        });
    });
}

function renderPage() {
    const container = document.getElementById('catalog-container');
    const topCounter = document.getElementById('page-counter-top');
    if (!container) return;

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
    if (topCounter) topCounter.textContent = `Page ${currentPage} of ${totalPages}`;

    const start = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredProducts.slice(start, start + itemsPerPage);

    if (paginatedItems.length === 0) {
        // Performance Fix: Do not show "No Products Found" while the initial fetch is still active
        if (!isDataLoaded) return;

        container.innerHTML = `
            <div class="empty-state">
                <div class="emoji">😿</div>
                <h3>No Products Found</h3>
                <p>Try adjusting your search terms or filters.</p>
            </div>
        `;
        renderPagination();
        return;
    }

    const html = paginatedItems.map(product => {
        const hasSibuDeal = product.sibuPrice && product.sibuPrice !== "" && product.sibuPrice !== "-";
        const hasMiriDeal = product.miriPrice && product.miriPrice !== "" && product.miriPrice !== "-";
        const hasAnyDeal = hasSibuDeal || hasMiriDeal;
        const hasBadge = product.dealType && product.dealType.trim() !== "";
        const hasBundle = product.bundlePrice && product.bundlePrice.trim() !== "" && product.bundlePrice.trim() !== "-";

        let priceHtml = "";
        if (hasAnyDeal) {
            priceHtml += `
                <div class="original-price-row">
                    <span class="price-label">Normal Price</span>
                    <span class="original-price">RM ${product.price}</span>
                </div>
                <div class="regional-deals-grid">
                    ${hasSibuDeal ? `
                        <div class="deal-location-badge sibu">
                            <span class="loc-tag">Sibu</span>
                            <span class="loc-price">RM ${product.sibuPrice}</span>
                        </div>
                    ` : ''}
                    ${hasMiriDeal ? `
                        <div class="deal-location-badge miri">
                            <span class="loc-tag">Miri</span>
                            <span class="loc-price">RM ${product.miriPrice}</span>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            priceHtml += `
                <div class="standard-price-row">
                    <span class="price-label">Price</span>
                    <p class="price">RM ${product.price}</p>
                </div>
            `;
        }
        
        return `
          <div class="product-card" onclick="window.location.href='details.html?name=${encodeURIComponent(product.name)}'">
            ${hasBadge ? `<div class="sale-badge">${product.dealType}</div>` : ''}
            <div class="img-wrap">
                <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300'">
            </div>
            <div class="product-info">
                <span class="tag">${product.category}</span>
                <h3>${product.name}</h3>
                <div class="price-container">
                    ${priceHtml}
                    
                    ${hasBundle ? `
                        <div class="bulk-deal-premium-badge">
                            <div class="bulk-label-row">
                                <span class="bulk-icon">📦</span>
                                <span class="bulk-title">Bulk Deal Available</span>
                            </div>
                            <div class="bulk-price-text">${product.bundlePrice}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
          </div>
        `;
    }).join('');

    container.innerHTML = html;
    renderPagination();
}

function renderPagination() {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = ""; 

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (totalPages <= 1) return;

    const createPageButton = (pageNo, content) => {
        const btn = document.createElement('a');
        btn.href = "#";
        btn.innerHTML = content;
        btn.className = "page-btn";
        if (pageNo === currentPage) btn.classList.add("active");
        
        btn.onclick = (e) => {
            e.preventDefault();
            currentPage = pageNo;
            renderPage();
            window.scrollTo(0, 0);
        };
        return btn;
    };

    const createEllipsisNode = () => {
        const span = document.createElement('span');
        span.innerText = "...";
        span.className = "page-ellipsis";
        return span;
    };

    const prevBtn = document.createElement('a');
    prevBtn.href = "#";
    prevBtn.innerHTML = "&laquo;";
    prevBtn.className = "page-btn arrow" + (currentPage === 1 ? " disabled" : "");
    prevBtn.onclick = (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderPage();
            window.scrollTo(0, 0);
        }
    };
    paginationContainer.appendChild(prevBtn);

    const maxVisiblePages = 5; 
    
    if (totalPages <= maxVisiblePages + 2) {
        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.appendChild(createPageButton(i, i));
        }
    } else {
        paginationContainer.appendChild(createPageButton(1, 1));

        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage <= 3) {
            endPage = 4;
        } else if (currentPage >= totalPages - 2) {
            startPage = totalPages - 3;
        }

        if (startPage > 2) {
            paginationContainer.appendChild(createEllipsisNode());
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationContainer.appendChild(createPageButton(i, i));
        }

        if (endPage < totalPages - 1) {
            paginationContainer.appendChild(createEllipsisNode());
        }

        paginationContainer.appendChild(createPageButton(totalPages, totalPages));
    }

    const nextBtn = document.createElement('a');
    nextBtn.href = "#";
    nextBtn.innerHTML = "&raquo;";
    nextBtn.className = "page-btn arrow" + (currentPage === totalPages ? " disabled" : "");
    nextBtn.onclick = (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            renderPage();
            window.scrollTo(0, 0);
        }
    };
    paginationContainer.appendChild(nextBtn);
}

function setupFilters(initialSearch, initialCat, initialSort) {
    const searchForm = document.querySelector('.filter-search');
    const searchInput = document.getElementById('product-search-input');
    
    let selectedCategory = initialCat || "All Categories";
    let currentSearchTerm = initialSearch || "";
    let selectedBrand = "All Brands"; 
    let selectedSort = initialSort || "Featured"; 

    if (initialSearch) searchInput.value = initialSearch;
    
    const syncActiveState = () => {
        const allCategoryItems = document.querySelectorAll('#category-list li, #category-list-mobile li');
        allCategoryItems.forEach(li => {
            li.classList.toggle('active', li.getAttribute('data-value') === (selectedCategory || "All Categories"));
        });

        const allBrandItems = document.querySelectorAll('#brand-list li, #brand-list-mobile li');
        allBrandItems.forEach(li => {
            li.classList.toggle('active', li.getAttribute('data-value') === (selectedBrand || "All Brands"));
        });

        const allSortItems = document.querySelectorAll('#sort-list li, #sort-list-mobile li');
        allSortItems.forEach(li => {
            li.classList.toggle('active', li.getAttribute('data-value') === (selectedSort || "Featured"));
        });

        updateFilterBadge();
    };

    const updateFilterBadge = () => {
        const badge = document.getElementById('filter-badge');
        if (!badge) return;

        let count = 0;
        if (selectedCategory !== "All Categories") count++;
        if (selectedBrand !== "All Brands") count++;
        if (selectedSort !== "Featured") count++;
        if (searchInput && searchInput.value.trim() !== "") count++;

        badge.textContent = count;
        badge.classList.toggle('visible', count > 0);
    };

    const applyFilters = () => {
        const searchTerm = (searchInput ? searchInput.value : currentSearchTerm).toLowerCase().trim();

        filteredProducts = allProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm) || 
                                 p.category.toLowerCase().includes(searchTerm);
            const matchesCategory = (selectedCategory === "All Categories") || (p.category === selectedCategory);
            const matchesBrand = (selectedBrand === "All Brands") || (p.brand === selectedBrand);
            
            const matchesBundle = (selectedSort !== "Bulk Deals Only") || (p.bundlePrice && p.bundlePrice.trim() !== "");
            
            return matchesSearch && matchesCategory && matchesBrand && matchesBundle;
        });

        if (selectedSort === "Price: Low to High") {
            filteredProducts.sort((a, b) => {
                const priceA = parseFloat(a.sibuPrice || a.miriPrice || a.price);
                const priceB = parseFloat(b.sibuPrice || b.miriPrice || b.price);
                return priceA - priceB;
            });
        } else if (selectedSort === "Price: High to Low") {
            filteredProducts.sort((a, b) => {
                const priceA = parseFloat(a.sibuPrice || a.miriPrice || a.price);
                const priceB = parseFloat(b.sibuPrice || b.miriPrice || b.price);
                return priceB - priceA;
            });
        } else if (selectedSort === "Newest") {
            filteredProducts.reverse(); 
        }

        currentPage = 1; 
        renderPage();
    };

    const currentSortLabel = document.getElementById('current-sort-label');
    const sortItems = document.querySelectorAll('#sort-list li');

    if (initialSort) {
        sortItems.forEach(item => {
            if (item.getAttribute('data-value') === initialSort) {
                sortItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                if (currentSortLabel) {
                    currentSortLabel.textContent = initialSort === "Bulk Deals Only" ? "Bulk Deals Only" : `Sort By: ${initialSort}`;
                }
            }
        });
    }

    sortItems.forEach(item => {
        item.onclick = () => {
            sortItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            selectedSort = item.getAttribute('data-value');
            if (currentSortLabel) {
                currentSortLabel.textContent = selectedSort === "Bulk Deals Only" ? "Bulk Deals Only" : `Sort By: ${selectedSort}`;
            }
            
            applyFilters();
        };
    });

    syncActiveState();

    // Use global event delegation to handle clicks on dynamically injected mobile filters
    document.addEventListener('click', (e) => {
        // Apply filters (Close sidebar) handler
        if (e.target.id === 'apply-mobile-filters') {
            const closeBtn = document.getElementById('close-filter-sidebar');
            if (closeBtn) closeBtn.click();
            return;
        }

        // Clear all filters handler
        if (e.target.id === 'clear-mobile-filters') {
            selectedCategory = "All Categories";
            selectedBrand = "All Brands";
            if (searchInput) searchInput.value = "";
            populateBrandFilter("All Categories");
            syncActiveState();
            applyFilters();
            return;
        }

        // Apply filters (Close sidebar) handler
        if (e.target.id === 'apply-mobile-filters') {
            const closeBtn = document.getElementById('close-filter-sidebar');
            if (closeBtn) closeBtn.click();
            return;
        }

        const sortItem = e.target.closest('#sort-list li, #sort-list-mobile li');
        if (sortItem) {
            selectedSort = sortItem.getAttribute('data-value');
            
            // Sync desktop label if it exists
            const currentSortLabel = document.getElementById('current-sort-label');
            if (currentSortLabel) {
                currentSortLabel.textContent = selectedSort === "Bulk Deals Only" ? "Bulk Deals Only" : `Sort By: ${selectedSort}`;
            }

            syncActiveState();
            applyFilters();
            return;
        }

        const catItem = e.target.closest('#category-list li, #category-list-mobile li');
        if (catItem) {
            selectedCategory = catItem.getAttribute('data-value');
            selectedBrand = "All Brands"; // Reset brand when category changes
            populateBrandFilter(selectedCategory);
            syncActiveState();
            applyFilters();
            return;
        }

        const brandItem = e.target.closest('#brand-list li, #brand-list-mobile li');
        if (brandItem) {
            selectedBrand = brandItem.getAttribute('data-value');
            syncActiveState();
            applyFilters();
            return;
        }
    });

    if (searchInput) {
        let debounceTimer;
        searchInput.oninput = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyFilters, 250);
        };
    }

    if (searchForm) {
        searchForm.onsubmit = (e) => { 
            e.preventDefault(); 
            applyFilters(); 
        };
    }

    applyFilters();
}

document.addEventListener('productSidebarReady', () => {
    // Filters are handled by initCatalogUI, but we ensure population here if needed
    initCatalogUI();
});

loadProducts();