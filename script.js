document.addEventListener('DOMContentLoaded', () => {

    // 1. Zoek- en Filterfunctionaliteit
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

    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', filterProducts);
    }

    // 2. Interactieve Toast-notificaties bij toevoegen aan winkelmand
    const toast = document.getElementById('toast');
    const cartButtons = document.querySelectorAll('.add-to-cart-btn');

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    cartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const productName = button.getAttribute('data-name');
            const colorSelect = card.querySelector('.select-box');
            const selectedColor = colorSelect ? colorSelect.value : 'Zwart';

            showToast(`✓ ${productName} (${selectedColor}) toegevoegd aan winkelmand!`);
        });
    });

});
