/* AURÈLE shared site script — cart, category nav, media helpers.
   Loaded on every page so the cart and category list stay in sync
   as you move between the home page, category pages, and product pages. */

window.PRODUCTS = window.PRODUCTS || [];
window.CATEGORIES = window.CATEGORIES || [];

const CART_KEY = 'aurele_cart_v1';

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
let cart = loadCart();

async function loadJSON(path) {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    return await res.json();
  } catch (e) {
    console.error('Could not load ' + path, e);
    return null;
  }
}

/* Returns the first available image for a product, or its fallback gradient tone */
function mediaHTML(p, opts) {
  opts = opts || {};
  const cls = opts.cls || 'tone';
  const style = opts.style || 'width:100%;height:100%;object-fit:cover;';
  const imgs = (p && p.images) || [];
  if (imgs.length && imgs[0]) {
    return `<img src="${imgs[0]}" alt="${p.name}" class="${cls}" style="${style}">`;
  }
  if (p && p.image) {
    return `<img src="${p.image}" alt="${p.name}" class="${cls}" style="${style}">`;
  }
  return `<div class="${cls}" style="background:${(p && p.grad) || '#111'}"></div>`;
}

function categoryName(catId) {
  const c = window.CATEGORIES.find(c => c.id === catId);
  return c ? c.name : catId;
}

/* Renders category pill links into any container with this id, on any page */
async function renderCategoryNav(containerId, activeCatId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!window.CATEGORIES.length) {
    const data = await loadJSON('/categories.json');
    window.CATEGORIES = (data && data.categories) || [];
  }
  el.innerHTML = window.CATEGORIES.map(c => `
    <a href="/category/${c.id}" class="cat-pill${c.id === activeCatId ? ' active' : ''}">${c.name}</a>
  `).join('');
}

/* ---------- Cart ---------- */

function addToCart(id, qty) {
  qty = qty || 1;
  cart[id] = (cart[id] || 0) + qty;
  saveCart(cart);
  updateCartUI();
  openCart();
}
function changeQty(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart(cart);
  updateCartUI();
}
function cartCount() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function updateCartUI() {
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = cartCount();

  const itemsEl = document.getElementById('drawer-items');
  if (!itemsEl) return;

  const ids = Object.keys(cart).filter(id => window.PRODUCTS.find(x => x.id == id));
  if (ids.length === 0) {
    itemsEl.innerHTML = '<div class="empty-note">Your private allocation queue is empty.</div>';
  } else {
    itemsEl.innerHTML = ids.map(id => {
      const p = window.PRODUCTS.find(x => x.id == id);
      const qty = cart[id];
      return `
        <div class="drawer-item">
          <div class="drawer-thumb">${mediaHTML(p)}</div>
          <div class="drawer-item-info">
            <div class="name">${p.name}</div>
            <div class="price">$${p.price.toLocaleString()} × ${qty}</div>
          </div>
          <button class="qty-btn" onclick="changeQty(${p.id}, -1)">−</button>
          <span style="width:20px; text-align:center; font-size:0.8rem; font-family:'Space Mono';">${qty}</span>
          <button class="qty-btn" onclick="changeQty(${p.id}, 1)">+</button>
        </div>
      `;
    }).join('');
  }
  const total = ids.reduce((sum, id) => sum + window.PRODUCTS.find(x => x.id == id).price * cart[id], 0);
  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = '$' + total.toLocaleString();
}

function openCart() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('overlay').classList.add('open');
}
function closeCart() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

async function checkout() {
  const ids = Object.keys(cart);
  if (ids.length === 0) { alert('Queue is empty.'); return; }

  const checkoutBtn = document.getElementById('checkout-btn');
  const originalText = checkoutBtn.textContent;
  checkoutBtn.textContent = 'Processing…';
  checkoutBtn.disabled = true;

  const items = ids.map(id => ({ id: Number(id), qty: cart[id] }));

  try {
    const res = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || 'Checkout failed');
    }
    const data = await res.json();
    window.location.href = data.url;
  } catch (e) {
    console.error(e);
    alert('Something went wrong starting checkout. Please try again in a moment.');
    checkoutBtn.textContent = originalText;
    checkoutBtn.disabled = false;
  }
}

/* Injects the cart drawer markup once per page and wires it up.
   Call this after your page's own DOM is ready. */
function initCartUI() {
  if (document.getElementById('drawer')) { updateCartUI(); return; }

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="overlay" id="overlay" onclick="closeCart()"></div>
    <div class="drawer" id="drawer">
      <div class="drawer-head">
        <h3>Selected Pieces</h3>
        <button class="close-btn" onclick="closeCart()">&times;</button>
      </div>
      <div class="drawer-items" id="drawer-items"></div>
      <div class="drawer-foot">
        <div class="drawer-total"><span>Estimated Value</span><span id="cart-total">$0</span></div>
        <button class="checkout-btn" id="checkout-btn" onclick="checkout()">Proceed to Secure Payment</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  updateCartUI();
}

/* Keep cart in sync if the person has this site open in two tabs */
window.addEventListener('storage', (e) => {
  if (e.key === CART_KEY) {
    cart = loadCart();
    updateCartUI();
  }
});
