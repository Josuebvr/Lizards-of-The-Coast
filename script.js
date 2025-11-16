
const PHONE_NUMBER = '5519988822112';
const grid = document.getElementById('catalogGrid');
const search = document.getElementById('search');
const cat = document.getElementById('filterCat');

let products = [];
let cart = [];

const isColorsPage = typeof window.isColorsPage !== 'undefined' ? window.isColorsPage : false;
const dataFile = isColorsPage ? 'cores.json' : 'produtos.json';

function isColorAvailable(p) {
    if (p == null) return false;
    if (Object.prototype.hasOwnProperty.call(p, 'available')) {
        const v = p.available;
        return v === true || v === 'true' || v === 1 || v === '1';
    }
    if (p.status) {
        const s = String(p.status).toLowerCase();
        return !(s.includes('indispon') || s.includes('indisponível') || s.includes('indisponivel'));
    }
    if (p.price != null) {
        const s = String(p.price).toLowerCase();
        return !s.includes('indispon');
    }
    return !Object.prototype.hasOwnProperty.call(p, 'price') || p.price === '' || p.price === null;
}

async function loadProducts() {
    try {
        const res = await fetch(dataFile);
        if (!res.ok) {
            throw new Error(`Erro ao carregar ${dataFile}: ${res.status}`);
        }
        products = await res.json();
        render();
    } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        grid.innerHTML = '<p style="color: red; grid-column: 1/-1; text-align: center;">Erro ao carregar dados. Verifique o console.</p>';
    }
}

function render() {
    const term = search ? search.value.toLowerCase() : '';
    const c = cat ? cat.value : '';
    grid.innerHTML = '';
    const filtered = products.filter(p => {
        const matchTerm = p.name.toLowerCase().includes(term) || p.desc.toLowerCase().includes(term);
        const matchCat = !c || p.category === c;
        return matchTerm && matchCat;
    });

    if (isColorsPage) {
        filtered.sort((a, b) => {
            const aa = isColorAvailable(a) ? 1 : 0;
            const bb = isColorAvailable(b) ? 1 : 0;
            if (aa === bb) return a.name.localeCompare(b.name);
            return aa > bb ? -1 : 1;
        });
    }

    filtered.forEach(p => {
        const el = document.createElement('div');
        el.className = 'card';

        const imgs = p.images && p.images.length ? p.images : (p.img ? [p.img] : []);

        let carouselHtml = '';
        if (imgs.length > 0) {
            const first = imgs[0];
            carouselHtml = `
        <div class="carousel" data-product-id="${p.id}" data-index="0">
          <button class="prev">‹</button>
          <img src="${first}" alt="${p.name}">
          <button class="next">›</button>
        </div>`;
        }

        const chipText = isColorsPage ? (p.price || 'Disponível') : (p.material ? p.material.toUpperCase() : '');
        el.innerHTML = `
            ${carouselHtml}
            <h3>${p.name}</h3>
            <p>${p.desc}</p>
            <div class="meta">
                <span class="chip">${chipText}</span>
                <button class="btn secondary" data-id="${p.id}">Ver</button>
            </div>`;

        el.__images = imgs;
        grid.appendChild(el);
    });
}

if (search) search.addEventListener('input', render);
if (cat) cat.addEventListener('input', render);

grid.addEventListener('click', (e) => {
    const btnPrev = e.target.closest('.carousel .prev');
    const btnNext = e.target.closest('.carousel .next');
    if (!btnPrev && !btnNext) return;

    e.stopPropagation();

    const carousel = e.target.closest('.carousel');
    if (!carousel) return;
    const card = carousel.closest('.card');
    const imgs = card && card.__images ? card.__images : [];
    if (!imgs || imgs.length === 0) return;

    let idx = parseInt(carousel.getAttribute('data-index') || '0', 10);
    if (btnPrev) {
        idx = (idx - 1 + imgs.length) % imgs.length;
    } else if (btnNext) {
        idx = (idx + 1) % imgs.length;
    }
    carousel.setAttribute('data-index', idx);
    const imgEl = carousel.querySelector('img');
    if (imgEl) imgEl.src = imgs[idx];
});

const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const modalName = document.getElementById('modalName');
const modalDesc = document.getElementById('modalDesc');
const modalMat = document.getElementById('modalMat');
const modalSize = document.getElementById('modalSize');
const modalPrice = document.getElementById('modalPrice');
const modalHex = document.getElementById('modalHex');
const addToCartBtn = document.getElementById('addToCart');
let currentProduct = null;

const carouselImg = document.getElementById('carouselImg');
const prevBtn = document.querySelector('.carousel .prev');
const nextBtn = document.querySelector('.carousel .next');
let currentImageIndex = 0;

if (!isColorsPage && addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
        if (!currentProduct) return;
        cart.push(currentProduct);
        updateCartCount();
        renderCart();
        modal.classList.remove('show');
    });
}

window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
        document.body.classList.add('scrolled');
    } else {
        document.body.classList.remove('scrolled');
    }
});

document.addEventListener('click', e => {
    const b = e.target.closest('[data-id]');
    if (!b) return;
    const p = products.find(x => x.id === b.dataset.id);
    currentProduct = p;
    currentImageIndex = 0;
    modal.classList.add('show');

    if (p.images && p.images.length > 0) {
        carouselImg.src = p.images[0];
    } else {
        carouselImg.src = p.img;
    }

    modalName.textContent = p.name;
    modalDesc.textContent = p.desc;

    if (isColorsPage) {
        if (modalHex) {
            modalHex.style.backgroundColor = p.hex || '#ddd';
            modalHex.parentElement.style.display = 'block';
        }
    } else {
        if (modalHex) modalHex.parentElement.style.display = 'none';
    }

    modalPrice.textContent = p.price;

    const moreBtn = document.getElementById('moreBtn');
    if (moreBtn) {
        moreBtn.textContent = 'Ver mais';
        modalDesc.classList.remove('expanded');

        setTimeout(() => {
            const isTextTruncated = modalDesc.scrollHeight > modalDesc.clientHeight;
            if (isColorsPage || !isTextTruncated) {
                moreBtn.style.display = 'none';
            } else {
                moreBtn.style.display = 'inline-block';
            }
        }, 0);
    }
});

prevBtn.onclick = () => {
    if (!currentProduct.images) return;
    currentImageIndex = (currentImageIndex - 1 + currentProduct.images.length) % currentProduct.images.length;
    carouselImg.src = currentProduct.images[currentImageIndex];
};

nextBtn.onclick = () => {
    if (!currentProduct.images) return;
    currentImageIndex = (currentImageIndex + 1) % currentProduct.images.length;
    carouselImg.src = currentProduct.images[currentImageIndex];
};


function updateCartCount() {
    document.getElementById('cartCount').textContent = cart.length;
}

document.getElementById('closeModal').onclick = () => modal.classList.remove('show');
modal.onclick = e => { if (e.target === modal) modal.classList.remove('show'); };

if (!isColorsPage) {
    const cartModal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    const openCart = document.getElementById('openCart');
    const closeCart = document.getElementById('closeCart');

    openCart.onclick = () => {
        renderCart();
        cartModal.classList.add('show');
    };
    closeCart.onclick = () => cartModal.classList.remove('show');
    cartModal.onclick = e => { if (e.target === cartModal) cartModal.classList.remove('show'); };

    function renderCart() {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p>Seu carrinho está vazio.</p>';
            document.getElementById('cartTotal').textContent = '';
            return;
        }

        cartItems.innerHTML = cart.map((p, i) => `
        <div class="cart-item" data-index="${i}" style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding:6px 0;">
          <span>${p.name}</span>
          <button class="remove-item" style="background:none;border:none;color:#f97316;cursor:pointer;">Remover</button>
        </div>
      `).join('');

        const total = cart.reduce((sum, p) => sum + parseFloat(p.price.replace(/[^\d.-]/g, '')), 0);
        document.getElementById('cartTotal').textContent = `Total: R$ ${total.toFixed(2)}`;
    }

    cartItems.addEventListener('click', e => {
        if (e.target.classList.contains('remove-item')) {
            const index = e.target.closest('.cart-item').dataset.index;
            cart.splice(index, 1);
            updateCartCount();
            renderCart();
        }
    });

    document.getElementById('sendCart').onclick = () => {
        if (cart.length === 0) return;
        const msg = "Olá! Gostaria de pedir os seguintes produtos:\n\n" +
            cart.map(p => `- ${p.name}`).join('\n');
        window.open(`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    };
}

grid.addEventListener('click', (e) => {
    const btnPrev = e.target.closest('.carousel .prev');
    const btnNext = e.target.closest('.carousel .next');
    if (!btnPrev && !btnNext) return;

    e.stopPropagation();

    const carousel = e.target.closest('.carousel');
    if (!carousel) return;
    const card = carousel.closest('.card');
    const imgs = card && card.__images ? card.__images : [];
    if (!imgs || imgs.length === 0) return;

    let idx = parseInt(carousel.getAttribute('data-index') || '0', 10);
    if (btnPrev) {
        idx = (idx - 1 + imgs.length) % imgs.length;
    } else if (btnNext) {
        idx = (idx + 1) % imgs.length;
    }
    carousel.setAttribute('data-index', idx);
    const imgEl = carousel.querySelector('img');
    if (imgEl) imgEl.src = imgs[idx];
});

loadProducts();

const moreBtn = document.getElementById("moreBtn");

moreBtn.onclick = () => {
    modalDesc.classList.toggle("expanded");
    moreBtn.textContent = modalDesc.classList.contains("expanded")
        ? "Ver menos"
        : "Ver mais";
};

