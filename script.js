document.addEventListener('DOMContentLoaded', () => {

    // === 1. ZOEK EN FILTER LOGICA ===
    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const productCards = document.querySelectorAll('.product-card');

    function filterProducts() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedCategory = categorySelect ? categorySelect.value : 'alle';

        productCards.forEach(card => {
            const title = card.querySelector('.product-title').textContent.toLowerCase();
            const category = card.getAttribute('data-category');

            const matchesSearch = title.includes(searchTerm);
            const matchesCategory = selectedCategory === 'alle' || category === selectedCategory;

            if (matchesSearch && matchesCategory) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    if (searchInput) searchInput.addEventListener('input', filterProducts);
    if (categorySelect) categorySelect.addEventListener('change', filterProducts);


    // === 2. WINKELMAND LOGICA ===
    let cart = [];

    const openCartBtn = document.getElementById('open-cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartBadge = document.getElementById('cart-badge');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Choice Modal
    const choiceModal = document.getElementById('choice-modal');
    const closeChoiceBtn = document.getElementById('close-choice-btn');
    const continueShoppingBtn = document.getElementById('continue-shopping-btn');
    const goToCheckoutBtn = document.getElementById('go-to-checkout-btn');

    // Checkout Modal Elements
    const checkoutModal = document.getElementById('checkout-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const checkoutStep1 = document.getElementById('checkout-step-1');
    const checkoutStep2 = document.getElementById('checkout-step-2');
    const checkoutReviewItems = document.getElementById('checkout-review-items');
    const reviewTotalPrice = document.getElementById('review-total-price');
    const backToShopBtn = document.getElementById('back-to-shop-btn');
    const proceedToStep2Btn = document.getElementById('proceed-to-step-2-btn');
    const backToStep1Btn = document.getElementById('back-to-step-1-btn');
    const cartDetailsInput = document.getElementById('cart-details-input');

    function openCart() {
        cartOverlay.classList.add('open');
        cartSidebar.classList.add('open');
        document.body.classList.add('cart-open');
    }

    function closeCart() {
        cartOverlay.classList.remove('open');
        cartSidebar.classList.remove('open');
        document.body.classList.remove('cart-open');
    }

    openCartBtn.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    function updateCartUI() {
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Je winkelmand is nog leeg.</p>';
            cartBadge.textContent = '0';
            cartTotalPrice.textContent = '€0,00';
            return;
        }

        cart.forEach((item, index) => {
            total += (item.price * item.quantity);

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('cart-item');
            
            itemDiv.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name} <span style="color:#64748b; font-size:0.85rem;">x${item.quantity}</span></div>
                    <div class="cart-item-color">Kleur: ${item.color}</div>
                    <div class="cart-item-price">€${(item.price * item.quantity).toFixed(2).replace('.', ',')}</div>
                </div>
                <button class="remove-item-btn" data-index="${index}">Verwijder</button>
            `;
            
            cartItemsContainer.appendChild(itemDiv);
        });

        cartTotalPrice.textContent = `€${total.toFixed(2).replace('.', ',')}`;
        const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItemsCount;

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const indexToRemove = e.target.getAttribute('data-index');
                cart.splice(indexToRemove, 1);
                updateCartUI();
                renderReviewItems();
            });
        });
    }

    // Product toevoegen
    const addButtons = document.querySelectorAll('.add-to-cart-btn');
    addButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            
            const product = {
                id: button.getAttribute('data-id'),
                name: button.getAttribute('data-name'),
                price: parseFloat(button.getAttribute('data-price')),
                image: button.getAttribute('data-image'),
                color: card.querySelector('.select-box').value,
                quantity: 1
            };

            const existingItem = cart.find(item => item.id === product.id && item.color === product.color);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push(product);
            }

            updateCartUI();
            choiceModal.classList.add('open');
        });
    });

    continueShoppingBtn.addEventListener('click', () => choiceModal.classList.remove('open'));
    closeChoiceBtn.addEventListener('click', () => choiceModal.classList.remove('open'));

    goToCheckoutBtn.addEventListener('click', () => {
        choiceModal.classList.remove('open');
        openCheckoutModal();
    });

    // === 3. TWEESTAPS AFREKENEN LOGICA ===
    function renderReviewItems() {
        if (!checkoutReviewItems) return;
        checkoutReviewItems.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            checkoutReviewItems.innerHTML = '<p class="empty-cart-msg">Je winkelmand is leeg.</p>';
            reviewTotalPrice.textContent = '€0,00';
            return;
        }

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const div = document.createElement('div');
            div.classList.add('review-item');
            div.innerHTML = `
                <div class="review-item-info">
                    <div class="review-item-title">${item.name}</div>
                    <div class="review-item-sub">Kleur: ${item.color} | €${item.price.toFixed(2).replace('.', ',')} p.st.</div>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn minus-btn" data-index="${index}">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn plus-btn" data-index="${index}">+</button>
                </div>
                <button class="remove-item-btn" data-index="${index}">Verwijder</button>
            `;
            checkoutReviewItems.appendChild(div);
        });

        reviewTotalPrice.textContent = `€${total.toFixed(2).replace('.', ',')}`;

        // Plus, Min en Verwijder knoppen in de review
        document.querySelectorAll('.minus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                if (cart[idx].quantity > 1) {
                    cart[idx].quantity -= 1;
                } else {
                    cart.splice(idx, 1);
                }
                updateCartUI();
                renderReviewItems();
            });
        });

        document.querySelectorAll('.plus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                cart[idx].quantity += 1;
                updateCartUI();
                renderReviewItems();
            });
        });
    }

    function openCheckoutModal() {
        if (cart.length === 0) {
            alert("Je winkelmand is leeg!");
            return;
        }
        closeCart();
        renderReviewItems();
        checkoutStep1.classList.add('active');
        checkoutStep2.classList.remove('active');
        checkoutModal.classList.add('open');
    }

    checkoutBtn.addEventListener('click', openCheckoutModal);
    closeModalBtn.addEventListener('click', () => checkoutModal.classList.remove('open'));
    backToShopBtn.addEventListener('click', () => checkoutModal.classList.remove('open'));

    // Ga naar Stap 2 (Gegevens invullen)
    proceedToStep2Btn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert("Voeg eerst producten toe aan je winkelmand!");
            return;
        }

        // Bouw de besteltekst op voor het verborgen formulierveld
        let total = 0;
        let detailsTekst = "";

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            detailsTekst += `${item.quantity}x ${item.name} (${item.color}) - €${itemTotal.toFixed(2).replace('.', ',')}\n`;
        });

        detailsTekst += `\nTotaalbedrag: €${total.toFixed(2).replace('.', ',')}`;
        
        if (cartDetailsInput) {
            cartDetailsInput.value = detailsTekst;
        }

        checkoutStep1.classList.remove('active');
        checkoutStep2.classList.add('active');
    });

    // Terug naar Stap 1
    backToStep1Btn.addEventListener('click', () => {
        checkoutStep2.classList.remove('active');
        checkoutStep1.classList.add('active');
    });

});
