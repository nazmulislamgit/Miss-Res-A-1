// --- CONFIGURATION ---
const API_URL = 'https://fakestoreapi.com/products';

// --- STATE MANAGEMENT ---
let cart = JSON.parse(localStorage.getItem('swiftCart_cart')) || [];
let allProducts = [];
let currentCategory = 'all';