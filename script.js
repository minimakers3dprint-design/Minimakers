document.addEventListener('DOMContentLoaded', () => {
    // === REVIEWS SYSTEEM ===
    const reviewForm = document.getElementById('review-form');
    const reviewsList = document.getElementById('reviews-list');

    function escapeHTML(str) {
        return String(str || '').replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    function loadReviews() {
        if (!reviewsList) return;
        let savedReviews = [];
        try {
            savedReviews = JSON.parse(localStorage.getItem('minimakers_reviews') || 'null');
        } catch (e) {
            savedReviews = null;
        }

        if (!Array.isArray(savedReviews)) {
            savedReviews = [
                { id: 1, name: 'Daan', rating: 5, text: 'Super fijne multiclicker! Snelle levering in IJmuiden.' },
                { id: 2, name: 'Sophie', rating: 5, text: 'Heel blij met mijn telefoonhouder en erg duurzaam materiaal!' }
            ];
            try {
                localStorage.setItem('minimakers_reviews', JSON.stringify(savedReviews));
            } catch (e) {}
        }

        reviewsList.innerHTML = '';
        if (savedReviews.length === 0) {
            reviewsList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Nog geen reviews. Schrijf hierboven de eerste!</p>';
            return;
        }

        savedReviews.forEach(rev => {
            const stars = '⭐'.repeat(Math.max(1, Math.min(5, Number(rev.rating) || 5)));
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            reviewItem.innerHTML = `
                <div class="review-content">
                    <div class="review-author">${escapeHTML(rev.name)}</div>
                    <div class="review-stars">${stars}</div>
                    <div class="review-text">${escapeHTML(rev.text)}</div>
                </div>
                <button type="button" class="delete-review-btn" data-id="${rev.id}">Verwijder</button>
            `;
            reviewsList.appendChild(reviewItem);
        });
    }

    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('review-name');
            const ratingInput = document.getElementById('review-rating');
            const textInput = document.getElementById('review-text');

            if (!nameInput || !ratingInput || !textInput) return;

            const name = nameInput.value.trim();
            const rating = parseInt(ratingInput.value, 10) || 5;
            const text = textInput.value.trim();

            if (!name || !text) return;

            const newReview = {
                id: Date.now(),
                name,
                rating,
                text
            };

            let savedReviews = [];
            try {
                savedReviews = JSON.parse(localStorage.getItem('minimakers_reviews') || '[]');
            } catch (e) {
                savedReviews = [];
            }

            savedReviews.unshift(newReview);
            try {
                localStorage.setItem('minimakers_reviews', JSON.stringify(savedReviews));
            } catch (e) {}

            reviewForm.reset();
            loadReviews();
        });
    }

    if (reviewsList) {
        reviewsList.addEventListener('click', (e) => {
            const btn = e.target.closest('.delete-review-btn');
            if (!btn || !reviewsList.contains(btn)) return;

            const idToDelete = parseInt(btn.getAttribute('data-id'), 10);
            let savedReviews = [];
            try {
                savedReviews = JSON.parse(localStorage.getItem('minimakers_reviews') || '[]');
            } catch (e) {
                savedReviews = [];
            }

            savedReviews = savedReviews.filter(rev => rev.id !== idToDelete);
            try {
                localStorage.setItem('minimakers_reviews', JSON.stringify(savedReviews));
            } catch (e) {}
            loadReviews();
        });
    }

    loadReviews();

    // === PERSISTENTE WINKELMAND & KORTING ===
    let cart = [];
    let appliedDiscount = { code: '', percentage: 0, fixedAmount: 0 };
    const PENDING_ORDER_KEY = 'minimakers_pending_order_v1';
    let pendingOrder = null;

    try {
        pendingOrder = JSON.parse(localStorage.getItem(PENDING_ORDER_KEY) || 'null');
    } catch (error) {
        pendingOrder = null;
    }

    function savePendingOrder() {
        try {
            if (pendingOrder) {
                localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(pendingOrder));
            } else {
                localStorage.removeItem(PENDING_ORDER_KEY);
            }
        } catch (error) {
            // The order can still be sent if the browser blocks storage.
        }
    }

    function createOrderId() {
        return window.crypto && typeof window.crypto.randomUUID === 'function'
            ? window.crypto.randomUUID()
            : `mm-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    }

    // Beschikbare kortingscodes (Voeg hier eenvoudig meer codes toe!)
    const VALID_COUPONS = {
        'FAMILIE': { percentage: 100, fixedAmount: 0, label: '100% korting' },
        'VRIENDENKORTING': { percentage: 5, fixedAmount: 0, label: '5% korting' },
    };

    try {
        const savedCart = JSON.parse(localStorage.getItem('minimakers_cart') || '[]');
        cart = Array.isArray(savedCart) ? savedCart : [];
    } catch (error) {
        cart = [];
    }

    function saveCart() {
        localStorage.setItem('minimakers_cart', JSON.stringify(cart));
    }

    // === ZOEKEN EN FILTEREN ===
    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const productCards = document.querySelectorAll('.product-card');

    function filterProducts() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedCategory = categorySelect ? categorySelect.value : 'alle';

        productCards.forEach(card => {
            const titleElement = card.querySelector('.product-title');
            const title = titleElement ? titleElement.textContent.toLowerCase() : '';
            const category = card.getAttribute('data-category');

            card.style.display =
                title.includes(searchTerm) &&
                (selectedCategory === 'alle' || category === selectedCategory)
                    ? ''
                    : 'none';
        });
    }

    if (searchInput) searchInput.addEventListener('input', filterProducts);
    if (categorySelect) categorySelect.addEventListener('change', filterProducts);

    // === ELEMENTEN ===
    const openCartBtn = document.getElementById('open-cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartBadge = document.getElementById('cart-badge');
    const checkoutBtn = document.getElementById('checkout-btn');

    const choiceModal = document.getElementById('choice-modal');
    const closeChoiceBtn = document.getElementById('close-choice-btn');
    const continueShoppingBtn = document.getElementById('continue-shopping-btn');
    const goToCheckoutBtn = document.getElementById('go-to-checkout-btn');

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
    const orderForm = document.getElementById('order-form');

    const couponInput = document.getElementById('coupon-input');
    const applyCouponBtn = document.getElementById('apply-coupon-btn');
    const couponMessage = document.getElementById('coupon-message');

    const successModal = document.getElementById('success-modal');
    const finishOrderBtn = document.getElementById('finish-order-btn');
    const successMessageText = document.getElementById('success-message-text');

    const optionWhatsapp = document.getElementById('option-whatsapp');
    const optionEmail = document.getElementById('option-email');
    const contactInputLabel = document.getElementById('contact-input-label');
    const customerContactInput = document.getElementById('customer-contact');

    const submitBtn = document.getElementById('submit-order-btn');

    // === HULPFUNCTIES ===
    const formatPrice = amount =>
        '€' + Number(amount || 0).toFixed(2).replace('.', ',');

    function openCart() {
        if (cartOverlay) cartOverlay.classList.add('open');
        if (cartSidebar) cartSidebar.classList.add('open');
        document.body.classList.add('cart-open');
    }

    function closeCart() {
        if (cartOverlay) cartOverlay.classList.remove('open');
        if (cartSidebar) cartSidebar.classList.remove('open');
        document.body.classList.remove('cart-open');
    }

    function removeCartItem(index) {
        if (!Number.isInteger(index) || index < 0 || index >= cart.length) return;

        cart.splice(index, 1);
        saveCart();
        updateCartUI();
        renderReviewItems();
    }

    // === WINKELMAND WEERGEVEN ===
    function updateCartUI() {
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML =
                '<p class="empty-cart-msg">Je winkelmand is nog leeg.</p>';

            if (cartBadge) cartBadge.textContent = '0';
            if (cartTotalPrice) cartTotalPrice.textContent = formatPrice(0);

            saveCart();
            return;
        }

        cart.forEach((item, index) => {
            const itemPrice = Number(item.price) || 0;
            const quantity = Math.max(1, Number(item.quantity) || 1);
            total += itemPrice * quantity;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';

            const image = document.createElement('img');
            image.src = item.image || '';
            image.alt = item.name || 'Product';
            image.className = 'cart-item-img';

            const info = document.createElement('div');
            info.className = 'cart-item-info';

            const title = document.createElement('div');
            title.className = 'cart-item-title';
            title.textContent = (item.name || 'Product') + ' ';

            const quantityText = document.createElement('span');
            quantityText.style.color = '#64748b';
            quantityText.style.fontSize = '0.85rem';
            quantityText.textContent = 'x' + quantity;
            title.appendChild(quantityText);

            const color = document.createElement('div');
            color.className = 'cart-item-color';
            color.textContent = item.color || '';

            const price = document.createElement('div');
            price.className = 'cart-item-price';
            price.textContent = formatPrice(itemPrice * quantity);

            info.append(title, color, price);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-item-btn';
            removeBtn.dataset.index = String(index);
            removeBtn.textContent = 'Verwijder';

            itemDiv.append(image, info, removeBtn);
            cartItemsContainer.appendChild(itemDiv);
        });

        if (cartTotalPrice) cartTotalPrice.textContent = formatPrice(total);

        if (cartBadge) {
            cartBadge.textContent = String(
                cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
            );
        }

        saveCart();
    }

    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', event => {
            const button = event.target.closest('.remove-item-btn');
            if (!button || !cartItemsContainer.contains(button)) return;

            removeCartItem(Number(button.dataset.index));
        });
    }

    // === PRODUCT TOEVOEGEN ===
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', event => {
            const card = event.currentTarget.closest('.product-card');
            if (!card) return;

            const colorStringArray = [];

            card.querySelectorAll('.select-box').forEach(select => {
                const labelName = select.getAttribute('data-color-label') || 'Kleur';
                colorStringArray.push(`${labelName}: ${select.value}`);
            });

            const product = {
                id: button.getAttribute('data-id'),
                name: button.getAttribute('data-name') || 'Product',
                price: Number.parseFloat((button.getAttribute('data-price') || '').replace(',', '.')) || 0,
                image: button.getAttribute('data-image') || '',
                color: colorStringArray.join(', '),
                quantity: 1
            };

            const existingItem = cart.find(
                item => item.id === product.id && item.name === product.name && item.color === product.color
            );

            if (existingItem) {
                existingItem.quantity = (Number(existingItem.quantity) || 1) + 1;
            } else {
                cart.push(product);
            }

            updateCartUI();

            if (choiceModal) choiceModal.classList.add('open');
        });
    });

    if (openCartBtn) openCartBtn.addEventListener('click', openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', () => choiceModal?.classList.remove('open'));
    }

    if (closeChoiceBtn) {
        closeChoiceBtn.addEventListener('click', () => choiceModal?.classList.remove('open'));
    }

    if (goToCheckoutBtn) {
        goToCheckoutBtn.addEventListener('click', () => {
            if (choiceModal) choiceModal.classList.remove('open');
            openCheckoutModal();
        });
    }

    // === KORTINGSCODE LOGICA ===
    if (applyCouponBtn && couponInput) {
        applyCouponBtn.addEventListener('click', () => {
            const code = couponInput.value.trim().toUpperCase();

            if (!code) {
                couponMessage.textContent = 'Vul een kortingscode in.';
                couponMessage.className = 'coupon-message error';
                return;
            }

            if (VALID_COUPONS[code]) {
                appliedDiscount = {
                    code: code,
                    ...VALID_COUPONS[code]
                };
                couponMessage.textContent = `Kortingscode '${code}' toegepast (${appliedDiscount.label})!`;
                couponMessage.className = 'coupon-message success';
                renderReviewItems();
            } else {
                appliedDiscount = { code: '', percentage: 0, fixedAmount: 0 };
                couponMessage.textContent = 'Ongeldige kortingscode.';
                couponMessage.className = 'coupon-message error';
                renderReviewItems();
            }
        });
    }

    // === AFREKENOVERZICHT ===
    function renderReviewItems() {
        if (!checkoutReviewItems) return;

        checkoutReviewItems.innerHTML = '';
        let subtotal = 0;

        if (cart.length === 0) {
            checkoutReviewItems.innerHTML =
                '<p class="empty-cart-msg">Je winkelmand is leeg.</p>';

            if (reviewTotalPrice) reviewTotalPrice.textContent = formatPrice(0);
            if (proceedToStep2Btn) proceedToStep2Btn.disabled = true;
            return;
        }

        if (proceedToStep2Btn) proceedToStep2Btn.disabled = false;

        cart.forEach((item, index) => {
            const itemPrice = Number(item.price) || 0;
            const quantity = Math.max(1, Number(item.quantity) || 1);
            subtotal += itemPrice * quantity;

            const div = document.createElement('div');
            div.className = 'review-item';

            const info = document.createElement('div');
            info.className = 'review-item-info';

            const title = document.createElement('div');
            title.className = 'review-item-title';
            title.textContent = item.name || 'Product';

            const sub = document.createElement('div');
            sub.className = 'review-item-sub';
            sub.textContent = `${item.color || ''} | ${formatPrice(itemPrice)} p.st.`;

            info.append(title, sub);

            const controls = document.createElement('div');
            controls.className = 'qty-controls';

            const minusBtn = document.createElement('button');
            minusBtn.type = 'button';
            minusBtn.className = 'qty-btn minus-btn';
            minusBtn.dataset.index = String(index);
            minusBtn.textContent = '-';
            minusBtn.setAttribute('aria-label', 'Aantal verminderen');

            const quantityText = document.createElement('span');
            quantityText.textContent = String(quantity);

            const plusBtn = document.createElement('button');
            plusBtn.type = 'button';
            plusBtn.className = 'qty-btn plus-btn';
            plusBtn.dataset.index = String(index);
            plusBtn.textContent = '+';
            plusBtn.setAttribute('aria-label', 'Aantal verhogen');

            controls.append(minusBtn, quantityText, plusBtn);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-item-btn';
            removeBtn.dataset.index = String(index);
            removeBtn.textContent = 'Verwijder';

            div.append(info, controls, removeBtn);
            checkoutReviewItems.appendChild(div);
        });

        // Berekend eindbedrag inclusief eventuele korting
        let discountAmount = 0;
        if (appliedDiscount.percentage > 0) {
            discountAmount = subtotal * (appliedDiscount.percentage / 100);
        } else if (appliedDiscount.fixedAmount > 0) {
            discountAmount = appliedDiscount.fixedAmount;
        }

        const finalTotal = Math.max(0, subtotal - discountAmount);

        if (reviewTotalPrice) {
            if (discountAmount > 0) {
                reviewTotalPrice.innerHTML = `<span style="text-decoration: line-through; font-size: 0.9rem; color: #94a3b8; margin-right: 6px;">${formatPrice(subtotal)}</span> ${formatPrice(finalTotal)}`;
            } else {
                reviewTotalPrice.textContent = formatPrice(finalTotal);
            }
        }
    }

    if (checkoutReviewItems) {
        checkoutReviewItems.addEventListener('click', event => {
            const button = event.target.closest('button');
            if (!button || !checkoutReviewItems.contains(button)) return;

            const index = Number(button.dataset.index);
            if (!Number.isInteger(index) || index < 0 || index >= cart.length) return;

            if (button.classList.contains('remove-item-btn')) {
                removeCartItem(index);
                return;
            }

            if (button.classList.contains('minus-btn')) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity--;
                } else {
                    cart.splice(index, 1);
                }
            } else if (button.classList.contains('plus-btn')) {
                cart[index].quantity++;
            } else {
                return;
            }

            saveCart();
            updateCartUI();
            renderReviewItems();
        });
    }

    function openCheckoutModal() {
        if (cart.length === 0) {
            alert('Je winkelmand is leeg!');
            return;
        }

        closeCart();
        renderReviewItems();

        if (checkoutStep1) checkoutStep1.classList.add('active');
        if (checkoutStep2) checkoutStep2.classList.remove('active');
        if (checkoutModal) checkoutModal.classList.add('open');
    }

    if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutModal);

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => checkoutModal?.classList.remove('open'));
    }

    if (backToShopBtn) {
        backToShopBtn.addEventListener('click', () => checkoutModal?.classList.remove('open'));
    }

    // === CONTACTMETHODE ===
    if (optionWhatsapp && optionEmail && contactInputLabel && customerContactInput) {
        optionWhatsapp.addEventListener('click', () => {
            optionWhatsapp.classList.add('active');
            optionEmail.classList.remove('active');

            const input = optionWhatsapp.querySelector('input');
            if (input) input.checked = true;

            contactInputLabel.textContent = 'Telefoonnummer (WhatsApp) *';
            customerContactInput.type = 'tel';
            customerContactInput.placeholder = '06 12345678';
        });

        optionEmail.addEventListener('click', () => {
            optionEmail.classList.add('active');
            optionWhatsapp.classList.remove('active');

            const input = optionEmail.querySelector('input');
            if (input) input.checked = true;

            contactInputLabel.textContent = 'E-mailadres *';
            customerContactInput.type = 'email';
            customerContactInput.placeholder = 'jouwnaam@gmail.com';
        });
    }

    // === NAAR STAP 2 ===
    if (proceedToStep2Btn) {
        proceedToStep2Btn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Voeg eerst producten toe aan je winkelmand!');
                return;
            }

            const details = cart.map(item => {
                const itemTotal = item.price * item.quantity;
                return `${item.quantity}x ${item.name} (${item.color}) - ${formatPrice(itemTotal)}`;
            });

            const subtotal = cart.reduce(
                (sum, item) => sum + item.price * item.quantity, 0
            );

            let discountAmount = 0;
            if (appliedDiscount.percentage > 0) {
                discountAmount = subtotal * (appliedDiscount.percentage / 100);
            } else if (appliedDiscount.fixedAmount > 0) {
                discountAmount = appliedDiscount.fixedAmount;
            }

            const finalTotal = Math.max(0, subtotal - discountAmount);

            details.push('');
            details.push(`Subtotaal: ${formatPrice(subtotal)}`);

            if (appliedDiscount.code) {
                details.push(`Kortingscode (${appliedDiscount.code}): -${formatPrice(discountAmount)}`);
            }

            details.push(`Totaalbedrag: ${formatPrice(finalTotal)}`);

            if (cartDetailsInput) cartDetailsInput.value = details.join('\n');

            if (checkoutStep1) checkoutStep1.classList.remove('active');
            if (checkoutStep2) checkoutStep2.classList.add('active');
        });
    }

    if (backToStep1Btn) {
        backToStep1Btn.addEventListener('click', () => {
            if (checkoutStep2) checkoutStep2.classList.remove('active');
            if (checkoutStep1) checkoutStep1.classList.add('active');
        });
    }

    // === BESTELLING VERSTUREN ===
    if (orderForm) {
        orderForm.addEventListener('submit', async event => {
            event.preventDefault();

            if (cart.length === 0) {
                alert('Je winkelmand is leeg!');
                return;
            }

            if (submitBtn) {
                submitBtn.textContent = 'Bestelling plaatsen...';
                submitBtn.disabled = true;
            }

            const formData = new FormData(orderForm);
            const contactMethod = formData.get('Contactmethode');
            const customerName = formData.get('Naam');
            const customerContact = formData.get('Contactgegevens');

            const items = cart.map(item => {
                const quantity = Math.max(1, Number(item.quantity) || 1);
                const unitPrice = Math.round((Number(item.price) || 0) * 100) / 100;
                return {
                    productId: String(item.id ?? ''),
                    name: String(item.name ?? ''),
                    color: String(item.color ?? ''),
                    quantity,
                    unitPrice,
                    lineTotal: Math.round(unitPrice * quantity * 100) / 100
                };
            });
            const subtotal = cart.reduce(
                (sum, item) => sum + item.price * item.quantity, 0
            );

            let discountAmount = 0;
            if (appliedDiscount.percentage > 0) {
                discountAmount = subtotal * (appliedDiscount.percentage / 100);
            } else if (appliedDiscount.fixedAmount > 0) {
                discountAmount = appliedDiscount.fixedAmount;
            }

            const finalTotal = Math.round(Math.max(0, subtotal - discountAmount) * 100) / 100;
            const details = items.map(item =>
                `${item.quantity}x ${item.name} (${item.color}) - ${formatPrice(item.lineTotal)}`
            );
            details.push('');
            details.push(`Subtotaal: ${formatPrice(subtotal)}`);
            if (appliedDiscount.code) {
                details.push(`Kortingscode (${appliedDiscount.code}): -${formatPrice(discountAmount)}`);
            }
            details.push(`Totaalbedrag: ${formatPrice(finalTotal)}`);
            const detailsTekst = details.join('\n');
            const cartSnapshot = JSON.stringify({
                items,
                total: finalTotal,
                discountCode: appliedDiscount.code || '',
                contactMethod: contactMethod || '',
                customerName: customerName || '',
                customerContact: customerContact || ''
            });

            if (cartDetailsInput) cartDetailsInput.value = detailsTekst;

            // These extra fields are invisible to shoppers and keep the checkout UI unchanged.
            if (!pendingOrder || pendingOrder.cartSnapshot !== cartSnapshot) {
                pendingOrder = {
                    id: createOrderId(),
                    cartSnapshot,
                    sheetSubmitted: false,
                    emailSubmitted: false
                };
                savePendingOrder();
            }

            const orderId = pendingOrder.id;
            const orderItemsJson = JSON.stringify({
                orderId,
                items,
                subtotal: Math.round(subtotal * 100) / 100,
                discountCode: appliedDiscount.code || '',
                discountAmount: Math.round(discountAmount * 100) / 100,
                total: finalTotal,
                currency: 'EUR'
            });

            formData.set('Bestelling', detailsTekst);
            formData.set('OrderID', orderId);
            formData.set('OrderItemsJSON', orderItemsJson);
            formData.set('Totaalbedrag', finalTotal.toFixed(2));

            const emailData = new FormData();
            emailData.append('access_key', 'e1c6c373-1e32-4e71-bb0c-0f94cbcdd270');
            emailData.append('subject', `Nieuwe bestelling van ${customerName}!`);
            emailData.append('Naam', customerName || '');
            emailData.append('Voorkeur contact', contactMethod || '');
            emailData.append('Contactgegevens', customerContact || '');
            emailData.append('Bestelling', detailsTekst);
            emailData.append('OrderID', orderId);
            emailData.append('Totaalbedrag', finalTotal.toFixed(2));

            // Send both requests together so the email does not wait for SheetMonkey.
            // Save each success separately; retrying then only repeats the unfinished step.
            const sendToSheet = pendingOrder.sheetSubmitted
                ? Promise.resolve(true)
                : fetch(orderForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: { Accept: 'application/json' }
                }).then(response => {
                    if (!response.ok) throw new Error('SheetMonkey');
                    pendingOrder.sheetSubmitted = true;
                    savePendingOrder();
                    return true;
                });

            const sendEmail = pendingOrder.emailSubmitted
                ? Promise.resolve(true)
                : fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: emailData
                }).then(async response => {
                    const result = await response.json();
                    if (!response.ok || result.success === false) throw new Error('Web3Forms');
                    pendingOrder.emailSubmitted = true;
                    savePendingOrder();
                    return true;
                });

            let results = [];
            try {
                results = await Promise.allSettled([sendToSheet, sendEmail]);
                if (!pendingOrder.sheetSubmitted || !pendingOrder.emailSubmitted) {
                    throw new Error('The order did not complete in both services.');
                }
                showSuccessScreen(contactMethod);
            } catch (error) {
                console.error('Bestelling versturen mislukt:', error, results);
                alert('Er ging iets mis bij het versturen van je bestelling. Probeer het opnieuw.');

                if (submitBtn) {
                    submitBtn.textContent = 'Verstuur Bestelling';
                    submitBtn.disabled = false;
                }
            }
        });
    }

    function showSuccessScreen(method) {
        if (checkoutModal) checkoutModal.classList.remove('open');

        if (successMessageText) {
            successMessageText.textContent =
                method === 'WhatsApp'
                    ? 'We hebben je bestelling in goede orde ontvangen! Zodra we bezig zijn met je bestelling, sturen we je een berichtje met een betaalverzoek via WhatsApp.'
                    : 'We hebben je bestelling in goede orde ontvangen! Zodra we bezig zijn met je bestelling, sturen we je een berichtje met een betaalverzoek via e-mail.';
        }

        if (successModal) successModal.classList.add('open');

        cart = [];
        pendingOrder = null;
        savePendingOrder();
        appliedDiscount = { code: '', percentage: 0, fixedAmount: 0 };
        if (couponInput) couponInput.value = '';
        if (couponMessage) couponMessage.textContent = '';

        saveCart();
        updateCartUI();
        renderReviewItems();

        if (submitBtn) {
            submitBtn.textContent = 'Verstuur Bestelling';
            submitBtn.disabled = false;
        }
    }

    if (finishOrderBtn) {
        finishOrderBtn.addEventListener('click', () => {
            if (successModal) successModal.classList.remove('open');
        });
    }

    // === INITIALISEREN ===
    updateCartUI();
});
