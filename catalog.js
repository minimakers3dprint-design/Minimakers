// Publieke catalogus uit Supabase. De productgegevens en foto's worden dynamisch getoond;
// de HTML hoeft niet voor ieder nieuw product apart aangepast te worden.
document.addEventListener('DOMContentLoaded', async () => {
  const config = window.MINIMAKERS_SUPABASE;
  const grid = document.querySelector('.products-grid');
  if (!grid || !config?.url || !config?.anonKey || config.url.includes('JOUW-') || !window.supabase) return;
  try {
    const client = window.supabase.createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.from('products').select('id,legacy_id,name,description,price,image,category,stock,active').eq('active', true).order('id');
    if (error || !data?.length) return;
    const cards = [...grid.querySelectorAll('.product-card')];
    grid.querySelectorAll('.category-header').forEach(header => header.remove());
    const renderedCards = new Set();

    for (const product of data) {
      const oldCard = product.legacy_id ? cards.find(card => card.querySelector('.add-to-cart-btn')?.dataset.id === product.legacy_id) : null;
      const source = productImageUrl(product.image, client);
      if (oldCard) {
        const button = oldCard.querySelector('.add-to-cart-btn');
        const title = oldCard.querySelector('.product-title');
        const price = oldCard.querySelector('.price-tag');
        const description = oldCard.querySelector('.product-description');
        const image = oldCard.querySelector('.product-image');
        if (title) title.textContent = product.name;
        if (price) price.textContent = euro(product.price);
        if (description) description.textContent = product.description || '';
        if (image) { if (source) image.src = source; else image.removeAttribute('src'); image.alt = product.name; }
        button.dataset.name = product.name;
        button.dataset.price = String(product.price);
        button.dataset.image = source;
        button.dataset.id = product.legacy_id;
        button.disabled = product.stock === 0;
        oldCard.dataset.category = categoryKey(product.category);
        renderedCards.add(oldCard);
      } else {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.dataset.category = categoryKey(product.category);
        const imageWrap = document.createElement('div');
        imageWrap.className = 'card-image-wrapper';
        const image = document.createElement('img');
        image.className = 'product-image';
        image.alt = product.name;
        image.loading = 'lazy';
        if (source) image.src = source;
        imageWrap.append(image);
        const content = document.createElement('div');
        content.className = 'card-content';
        const title = document.createElement('h3');
        title.className = 'product-title';
        title.textContent = product.name;
        const price = document.createElement('div');
        price.className = 'price-tag';
        price.textContent = euro(product.price);
        const description = document.createElement('p');
        description.className = 'product-description';
        description.textContent = product.description || '';
        const button = document.createElement('button');
        button.className = 'btn add-to-cart-btn';
        button.type = 'button';
        button.textContent = product.stock === 0 ? 'Momenteel uitverkocht' : 'In winkelmand';
        button.dataset.id = `db-${product.id}`;
        button.dataset.name = product.name;
        button.dataset.price = String(product.price);
        button.dataset.image = source;
        button.disabled = product.stock === 0;
        const colorGroup = document.createElement('div');
        colorGroup.className = 'color-select-group';
        const colorSelectWrap = document.createElement('div');
        colorSelectWrap.className = 'color-select';
        const colorLabel = document.createElement('label');
        colorLabel.textContent = 'Kies kleur filament:';
        const colorSelect = document.createElement('select');
        colorSelect.className = 'select-box';
        colorSelect.dataset.colorLabel = 'Kleur';
        for (const color of ['Zwart', 'Wit', 'Rood', 'Groen', 'Oranje', 'Donkerblauw', 'Lichtblauw', 'Grijs', 'Bruin']) {
          const option = document.createElement('option');
          option.value = color;
          option.textContent = color;
          colorSelect.append(option);
        }
        colorSelectWrap.append(colorLabel, colorSelect);
        colorGroup.append(colorSelectWrap);
        content.append(title, price, description, colorGroup, button);
        card.append(imageWrap, content);
        grid.append(card);
        renderedCards.add(card);
      }
    }
    cards.forEach(card => { if (!renderedCards.has(card)) card.remove(); });
    document.dispatchEvent(new CustomEvent('minimakers:catalog-loaded'));
    document.getElementById('category-select')?.dispatchEvent(new Event('change', { bubbles: true }));
  } catch (error) {
    console.warn('Supabase-catalogus niet beschikbaar; bestaande catalogus blijft staan.', error);
  }

  function euro(value) { return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0); }
  function categoryKey(value) {
    const s = String(value || '').toLowerCase();
    return /feest|kerst|sint/.test(s) ? 'Feestdagen' : /fidget|toy|speel/.test(s) ? 'fidgets' : 'gadgets';
  }
  function productImageUrl(value, client) {
    if (typeof value !== 'string' || !value || value.includes('..') || value.startsWith('/')) return '';
    if (value.startsWith('products/')) return client.storage.from('product-images').getPublicUrl(value).data.publicUrl;
    return /^[a-z0-9][a-z0-9._/-]*\.(?:jpe?g|png|webp|avif)$/i.test(value) ? value : '';
  }
});
