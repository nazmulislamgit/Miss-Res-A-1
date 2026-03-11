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
