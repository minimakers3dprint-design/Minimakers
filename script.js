// 1. Winkelmand-status (Array met producten)
let cart = [];

// DOM Elementen ophalen
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('checkout-overlay');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const drawerTotal = document.getElementById('drawer-total');
const checkoutBtn = document.querySelector('.checkout-btn');
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutBtn = document.getElementById('close-checkout');
const checkoutForm = document.getElementById('checkout-form');

// 2. Knoppen "In winkelmand" activeren op productkaarten
document.querySelectorAll('.product-card').forEach(card => {
    const btn = card.querySelector('button');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const title = card.querySelector('h3').innerText;
        
        // Prijs uitlezen (bijv. "€12,50" -> 12.50)
        const priceText = card.querySelector('.price, p:not(.description)').innerText;
        const price = parseFloat(priceText.replace('€', '').replace(',', '.'));
        
        // Filament kleur ophalen (indien aanwezig)
        const select = card.querySelector('select');
        const color = select ? select.value : 'Standaard';

        addToCart(title, price, color);
        openCart();
    });
});

// 3. Product toevoegen of aantal verhogen (+1)
function addToCart(title, price, color) {
    // Zoek of product met dezelfde naam & kleur al in winkelmand zit
    const existingItem = cart.find(item => item.name === title && item.color === color);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: title,
            price: price,
            color: color,
            quantity: 1
        });
    }

    updateCartUI();
}

// 4. Aantal aanpassen (+ / -)
function changeQuantity(index, delta) {
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1); // Verwijder product als aantal 0 wordt
        }
    }
    updateCartUI();
}

// 5. Product direct verwijderen
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// 6. Winkelmandje weergave & totaalprijs bijwerken (met aantal BBOVEN de knoppen)
function updateCartUI() {
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-msg">Je winkelmand is nog leeg.</p>';
        if (drawerTotal) drawerTotal.innerText = '€0,00';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <div class="cart-item-details">
                <strong>${item.name}</strong>
                <span class="cart-item-color">Kleur: ${item.color}</span>
                <span class="cart-item-price">€${itemTotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="cart-item-controls">
                <!-- Aantal BBOVEN de knoppen -->
                <div class="qty-box">
                    <span class="qty-label">Aantal: <strong>${item.quantity}</strong></span>
                    <div class="qty-buttons">
                        <button type="button" class="qty-btn" onclick="changeQuantity(${index}, -1)">-</button>
                        <button type="button" class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
                    </div>
                </div>
                <button type="button" class="remove-btn" onclick="removeFromCart(${index})" title="Verwijderen">&times;</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    if (drawerTotal) {
        drawerTotal.innerText = `€${total.toFixed(2).replace('.', ',')}`;
    }
}

// 7. Cart Drawer Openen / Sluiten
const openCartBtn = document.getElementById('cart-btn') || document.querySelector('.cart-btn') || document.querySelector('.cart-icon');

function openCart() {
    if (cartDrawer) cartDrawer.classList.add('open');
    if (cartOverlay) cartOverlay.style.display = 'block';
}

function closeCart() {
    if (cartDrawer) cartDrawer.classList.remove('open');
    if (cartOverlay) cartOverlay.style.display = 'none';
}

// Knop in de header activeerbaar maken om de mand direct te openen
if (openCartBtn) {
    openCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
    });
}

if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
if (cartOverlay) cartOverlay.addEventListener('click', () => {
    closeCart();
    if (checkoutModal) checkoutModal.style.display = 'none';
});

// 8. Naar Afrekenen Modal
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Je winkelmandje is nog leeg!');
            return;
        }
        closeCart();
        if (checkoutModal) checkoutModal.style.display = 'block';
        if (cartOverlay) cartOverlay.style.display = 'block';
    });
}

if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', () => {
        if (checkoutModal) checkoutModal.style.display = 'none';
        if (cartOverlay) cartOverlay.style.display = 'none';
    });
}

// 9. Bestelling versturen naar SheetMonkey
if (checkoutForm) {
    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const naam = document.getElementById('klant-naam').value;
        const email = document.getElementById('klant-email').value;
        const adres = document.getElementById('klant-adres').value;
        const opmerking = document.getElementById('klant-opmerking')?.value || 'Geen';

        // Maak overzichtelijke lijst van bestelde producten met aantallen en kleur
        const bestellingTekst = cart.map(item => `${item.name} (${item.color}) x${item.quantity}`).join(', ');
        const totaal = drawerTotal ? drawerTotal.innerText : '€0,00';

        // Stuur gegevens naar SheetMonkey
        fetch('https://api.sheetmonkey.io/form/hivoKphDtEn4cWJfndjEiS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "Datum": new Date().toLocaleString("nl-NL"),
                "Naam": naam,
                "E-mail": email,
                "Adres": adres,
                "Opmerking": opmerking,
                "Bestelling": bestellingTekst,
                "Totaal": totaal
            })
        })
        .then(response => {
            alert('Bedankt voor je bestelling! We hebben je gegevens goed ontvangen.');
            
            // Winkelmandje legen en alles sluiten
            cart = [];
            updateCartUI();
            
            if (checkoutModal) checkoutModal.style.display = 'none';
            if (cartOverlay) cartOverlay.style.display = 'none';
            checkoutForm.reset();
        })
        .catch(error => {
            alert('Er ging iets mis bij het versturen van je bestelling. Probeer het opnieuw.');
            console.error('Error:', error);
        });
    });
}