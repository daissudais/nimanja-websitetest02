/* home-search.js - Upgraded to Firebase Architecture with Mobile Navigation Drawer Handles */

// --- 1. Import Firebase Realtime Database SDK ---
import { ref, get } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";
import { db } from "./firebase_config.js";

document.addEventListener('DOMContentLoaded', () => {
    // ══════════════════════════════════════════════════
    // PART B: REALTIME SEARCH DROP-PANEL INTERACTION
    // ══════════════════════════════════════════════════
    const searchInput = document.getElementById('home-search-input');
    const resultsDropdown = document.getElementById('search-results-dropdown');
    const searchForm = document.getElementById('home-search-form');
    
    let allProducts = [];

    // Fetch structured real-time metrics data cleanly from Firebase
    async function fetchProducts() {
        try {
            // PERFORMANCE: Check session cache first to avoid redundant fetches on page transitions
            const cachedData = sessionStorage.getItem('nimanja_products_cache');
            if (cachedData) {
                allProducts = JSON.parse(cachedData);
                console.log("Predictive search initialized from session cache.");
                return;
            }

            const dataRef = ref(db, 'web_data');
            const snapshot = await get(dataRef);
            
            if (snapshot.exists()) {
                const firebaseData = snapshot.val();
                
                // Map fully to match the structure expected by catalog and details pages
                allProducts = Object.keys(firebaseData).map(key => {
                    const item = firebaseData[key] || {};
                    const rawExtra = item.extraImages || item.ExtraImages || "";
                    return {
                        name: (item.name || item.Name || "").trim(),
                        price: item.price || item.Price || "",
                        category: item.category || item.Category || "",
                        image: item.imageUrl || item.image || item.Image || "",
                        description: item.description || item.Description || "",
                        extraImages: (typeof rawExtra === 'string')
                            ? rawExtra.split(';').map(img => img.trim()).filter(Boolean)
                            : (Array.isArray(rawExtra) ? rawExtra : []),
                        brand: item.brand || item.Brand || "",
                        sibuPrice: item.sibuPromoPrice || item.sibuPrice || "",
                        dealType: item.dealType || item.DealType || "",
                        additionalInfo: item.additionalInfo || "",
                        bundlePrice: item.bundlePrice || "",
                        miriPrice: item.miriPrice || ""
                    };
                }).filter(p => p.name);
                
                // Save to cache for instant loading on subsequent pages
                sessionStorage.setItem('nimanja_products_cache', JSON.stringify(allProducts));
                console.log("Predictive homepage search framework synchronized with Firebase and cached.");
            }
        } catch (error) {
            console.error("Error loading search index from Firebase:", error);
        }
    }

    // Live instant keypress predictive text rendering matches handler
    if (searchInput && resultsDropdown) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            resultsDropdown.innerHTML = '';

            if (query.length > 0) {
                const matches = allProducts.filter(p => 
                    p.name.toLowerCase().includes(query) || 
                    p.category.toLowerCase().includes(query)
                ).slice(0, 5); // Restrict dropdown view layout threshold to top 5 hits

                if (matches.length > 0) {
                    matches.forEach(p => {
                        const item = document.createElement('div');
                        item.className = 'search-item';
                        item.innerHTML = `
                            <img src="${p.image}" onerror="this.src='https://via.placeholder.com/40'">
                            <div>
                                <h4>${p.name}</h4>
                                <p>RM ${p.price}</p>
                            </div>
                        `;
                        item.onclick = () => {
                            window.location.href = `details.html?name=${encodeURIComponent(p.name)}`;
                        };
                        resultsDropdown.appendChild(item);
                    });

                    // Add a "See All" results link at the bottom of the dropdown
                    const seeAllItem = document.createElement('div');
                    seeAllItem.className = 'search-item see-all-results';
                    seeAllItem.innerHTML = `
                        <div style="width: 100%; text-align: center;">
                            <span style="color: #ea6526; font-weight: 800; font-size: 0.9rem;">See all results for "${query}" →</span>
                        </div>
                    `;
                    seeAllItem.onclick = () => {
                        window.location.href = `product.html?search=${encodeURIComponent(query)}`;
                    };
                    resultsDropdown.appendChild(seeAllItem);

                    resultsDropdown.style.display = 'block';
                } else {
                    resultsDropdown.style.display = 'none';
                }
            } else {
                resultsDropdown.style.display = 'none';
            }
        });
    }

    // Close predictive card element drop panel if background space is clicked out
    document.addEventListener('click', (e) => {
        // Ensure the dropdown doesn't close if we are clicking inside the results themselves
        if (searchForm && !searchForm.contains(e.target) && resultsDropdown && !resultsDropdown.contains(e.target)) {
            resultsDropdown.style.display = 'none';
        }
    });

    // Handle form submit actions gracefully (Clicking search icon or hitting Enter key)
    if (searchForm && searchInput) {
        searchForm.onsubmit = (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `product.html?search=${encodeURIComponent(query)}`;
            }
        };
    }

    function renderPopularProducts() {
        const container = document.getElementById('home-popular-products-container');
        if (!container) return;
        
        const popularItems = allProducts.slice(0, 10);
        
        const html = popularItems.map(product => {
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
    }

    function initPopularSlider() {
        const slider = document.getElementById('home-popular-products-container');
        const prevBtn = document.getElementById('popular-prev-btn');
        const nextBtn = document.getElementById('popular-next-btn');

        if (!slider || !prevBtn || !nextBtn) return;

        function updateArrowButtons() {
            const scrollLeft = slider.scrollLeft;
            const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
            prevBtn.disabled = scrollLeft <= 2;
            nextBtn.disabled = scrollLeft >= maxScrollLeft - 2;
        }

        function getScrollStep() {
            const firstCard = slider.querySelector('.product-card');
            if (firstCard) {
                const cardWidth = firstCard.getBoundingClientRect().width;
                const style = window.getComputedStyle(slider);
                const gap = parseFloat(style.gap) || 22;
                const visibleWidth = slider.clientWidth;
                if (visibleWidth < 600) {
                    return cardWidth + gap;
                }
                return (cardWidth + gap) * 2;
            }
            return 300;
        }

        prevBtn.onclick = () => {
            slider.scrollBy({
                left: -getScrollStep(),
                behavior: 'smooth'
            });
        };

        nextBtn.onclick = () => {
            slider.scrollBy({
                left: getScrollStep(),
                behavior: 'smooth'
            });
        };

        slider.addEventListener('scroll', updateArrowButtons);
        window.addEventListener('resize', updateArrowButtons);
        
        // Run initial check
        setTimeout(updateArrowButtons, 300);
    }

    fetchProducts().then(() => {
        renderPopularProducts();
        initPopularSlider();
    });
    preloadNavigationPages(); // Call the preloading function
    
});

/**
 * Dynamically adds <link rel="prefetch"> tags for key navigation pages
 * to improve perceived loading times when navigating from the index page.
 */
function preloadNavigationPages() {
    const pagesToPreload = [
        'product.html',
        'deals_products.html',
        'our_store.html',
        'contact.html' // Assuming a contact page exists
    ];

    pagesToPreload.forEach(page => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = page;
        document.head.appendChild(link);
    });
    console.log("Prefetching navigation pages...");
}