/* productsidebar.js - Mobile Product Filter Sidebar Injector */

document.addEventListener('DOMContentLoaded', () => {
    async function injectProductSidebar() {
        try {
            const response = await fetch('productsidebar.html');
            if (!response.ok) return;
            const html = await response.text();
            
            const temp = document.createElement('div');
            temp.innerHTML = html;
            
            const sidebar = temp.querySelector('#product-filter-sidebar');
            const overlay = temp.querySelector('#filter-sidebar-overlay');
            
            if (sidebar) document.body.appendChild(sidebar);
            if (overlay) document.body.appendChild(overlay);

            setupToggleEvents();
            
            // Dispatch event so product.js knows mobile filters are ready to be populated
            document.dispatchEvent(new CustomEvent('productSidebarReady'));
        } catch (e) {
            console.error("Error injecting product sidebar:", e);
        }
    }

    function setupToggleEvents() {
        const sidebar = document.getElementById('product-filter-sidebar');
        const overlay = document.getElementById('filter-sidebar-overlay');
        const trigger = document.getElementById('mobile-filter-trigger');
        const closeBtn = document.getElementById('close-filter-sidebar');
        const applyBtn = document.getElementById('apply-mobile-filters');

        const open = () => {
            if (sidebar) sidebar.classList.add('open');
            if (overlay) overlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
        };

        const close = () => {
            if (sidebar) sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('visible');
            document.body.style.overflow = '';
        };

        if (trigger) trigger.addEventListener('click', open);
        if (closeBtn) closeBtn.addEventListener('click', close);
        if (overlay) overlay.addEventListener('click', close);
        if (applyBtn) applyBtn.addEventListener('click', close);
    }

    injectProductSidebar();
});