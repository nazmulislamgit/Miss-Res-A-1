// --- CONFIGURATION ---
const API_URL = 'https://fakestoreapi.com/products';

// --- STATE MANAGEMENT ---
let cart = JSON.parse(localStorage.getItem('swiftCart_cart')) || [];
let allProducts = [];
let currentCategory = 'all';
// --- DOM Element ---
const productGrid = document.getElementById('product-grid');
const trendingGrid = document.getElementById('trending-grid');
const categoryContainer = document.getElementById('category-filters');
const cartBtn = document.getElementById('cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total-price');
const cartCountElement = document.getElementById('cart-count');
const modal = document.getElementById('product-modal');
const modalBody = document.getElementById('modal-body-content');
const closeModalBtn = document.querySelector('.close-modal');
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupEventListeners();
});

async function init() {
    updateCartUI();
    await fetchCategories();
    await fetchProducts();
}

// --- API FUNCTIONS ---
async function fetchProducts() {
    try {
        const res = await fetch(API_URL);
        allProducts = await res.json();
        
        renderTrending(allProducts);
        renderProducts(allProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        productGrid.innerHTML = '<p>Failed to load products. Please try again later.</p>';
    }
}

async function fetchCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`);
        const categories = await res.json();
        renderCategories(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function fetchProductDetails(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`);
        const product = await res.json();
        return product;
    } catch (error) {
        console.error('Error details:', error);
    }
}

// --- RENDERING FUNCTIONS ---
function renderTrending(products) {
    // Sort by rating count/rate descending and take top 3
    const sorted = [...products].sort((a, b) => b.rating.rate - a.rating.rate);
    const top3 = sorted.slice(0, 3);
    
    trendingGrid.innerHTML = top3.map(product => createProductCard(product)).join('');
}

function renderProducts(products) {
    productGrid.innerHTML = products.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
    return `
        <div class="product-card">
            <div class="card-img">
                <img src="${product.image}" alt="${product.title}" loading="lazy">
            </div>
            <div class="card-body">
                <span class="category-badge">${product.category}</span>
                <h3 class="product-title" title="${product.title}">${product.title}</h3>
                <div class="rating">
                    ${generateStars(product.rating.rate)}
                    <span>(${product.rating.count})</span>
                </div>
                <div class="price">$${product.price.toFixed(2)}</div>
                <div class="card-actions">
                    <button class="btn btn-outline" onclick="openProductModal(${product.id})">Details</button>
                    <button class="btn btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
                </div>
            </div>
        </div>
    `;
}

function renderCategories(categories) {
    // Keep 'All' button and append dynamic ones
    const allBtn = categoryContainer.querySelector('[data-category="all"]');
    categoryContainer.innerHTML = '';
    categoryContainer.appendChild(allBtn);

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.classList.add('filter-btn');
        btn.dataset.category = cat;
        btn.textContent = cat;
        categoryContainer.appendChild(btn);
    });
}

function generateStars(rate) {
    const fullStars = Math.floor(rate);
    const hasHalf = rate % 1 >= 0.5;
    let html = '';
    
    for(let i=0; i<fullStars; i++) html += '<i class="fa-solid fa-star"></i>';
    if(hasHalf) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    
    // Fill remaining with empty stars if needed for layout consistency (optional)
    return html;
}

// --- FILTERING LOGIC ---
async function handleCategoryClick(e) {
    if (!e.target.classList.contains('filter-btn')) return;

    // Update Active Class
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    const category = e.target.dataset.category;
    currentCategory = category;

    productGrid.innerHTML = '<div class="loader"></div>';

    try {
        let products;
        if (category === 'all') {
            products = allProducts; // Use cached if available
        } else {
            const res = await fetch(`${API_URL}/category/${category}`);
            products = await res.json();
        }
        renderProducts(products);
    } catch (error) {
        productGrid.innerHTML = '<p>Error loading category.</p>';
    }
}

// --- CART LOGIC ---
function addToCart(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveCart();
    updateCartUI();
    openCart();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function updateQty(id, change) {
    const item = cart.find(item => item.id === id);
    if (!item) return;

    item.qty += change;
    if (item.qty <= 0) {
        removeFromCart(id);
    } else {
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('swiftCart_cart', JSON.stringify(cart));
}

function updateCartUI() {
    // Update Count
    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    cartCountElement.textContent = totalQty;

    // Update Sidebar List
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg" style="text-align:center; color:var(--gray); margin-top:20px;">Your cart is empty.</p>';
        cartTotalElement.textContent = '$0.00';
        return;
    }

    let total = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
        total += item.price * item.qty;
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}">
                <div class="item-details">
                    <div class="item-title">${item.title}</div>
                    <div class="item-price">$${item.price} x ${item.qty}</div>
                    <div class="item-controls">
                        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    cartTotalElement.textContent = `$${total.toFixed(2)}`;
}

// --- MODAL LOGIC ---
async function openProductModal(id) {
    modal.classList.add('show');
    modalBody.innerHTML = '<div class="loader"></div>';

    const product = await fetchProductDetails(id);

    modalBody.innerHTML = `
        <div class="modal-grid">
            <div class="modal-img">
                <img src="${product.image}" alt="${product.title}">
            </div>
            <div class="modal-info">
                <span class="category-badge">${product.category}</span>
                <h2>${product.title}</h2>
                <div class="rating">
                    ${generateStars(product.rating.rate)}
                    <span>(${product.rating.count} reviews)</span>
                </div>
                <h3 class="price">$${product.price}</h3>
                <p class="modal-desc">${product.description}</p>
                <button class="btn btn-primary btn-block" onclick="addToCart(${product.id}); closeModal();">Add to Cart</button>
            </div>
        </div>
    `;
}

function closeModal() {
    modal.classList.remove('show');
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Filter Clicks
    categoryContainer.addEventListener('click', handleCategoryClick);

    // Cart Sidebar Toggles
    cartBtn.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    // Mobile Menu
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close Modal
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Newsletter
    document.getElementById('newsletter-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = document.getElementById('newsletter-msg');
        msg.textContent = 'Thank you for subscribing!';
        e.target.reset();
        setTimeout(() => msg.textContent = '', 3000);
    });

    // Expose functions globally for HTML onclick attributes
    window.addToCart = addToCart;
    window.updateQty = updateQty;
    window.removeFromCart = removeFromCart;
    window.openProductModal = openProductModal;
    window.closeModal = closeModal;
}

function openCart() {
    cartSidebar.classList.add('open');
    cartOverlay.style.display = 'block';
}

function closeCart() {
    cartSidebar.classList.remove('open');
    cartOverlay.style.display = 'none';
}
