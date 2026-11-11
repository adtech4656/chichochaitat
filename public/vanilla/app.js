/**
 * ChiChoc Habitat - Vanilla JavaScript + GSAP Integration
 * Connects directly to Node.js Express REST API endpoints.
 */

// Global state
let properties = [];
let siteConfig = {};
let currentCurrency = 'XOF';
let currentLocale = 'fr';
let favorites = JSON.parse(localStorage.getItem('cch_favorites') || '[]');

// DOM Elements
const propertyGrid = document.getElementById('property-grid');
const searchCity = document.getElementById('search-city');
const searchType = document.getElementById('search-type');
const searchIntent = document.getElementById('search-intent');
const searchBtn = document.getElementById('search-btn');
const favCountEl = document.getElementById('fav-count');

// Initialize GSAP Timeline for Hero
function initGsapAnimations() {
  if (typeof gsap === 'undefined') return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('.header', { y: -80, opacity: 0, duration: 0.8 })
    .from('.hero-badge', { scale: 0.8, opacity: 0, duration: 0.5 }, '-=0.4')
    .from('.hero-title', { y: 40, opacity: 0, duration: 0.8 }, '-=0.3')
    .from('.hero-subtitle', { y: 25, opacity: 0, duration: 0.6 }, '-=0.4')
    .from('.search-card', { y: 30, opacity: 0, duration: 0.7 }, '-=0.3')
    .from('.notice-box', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2');
}

// Animate property cards on load/filter
function animateCards() {
  if (typeof gsap === 'undefined') return;
  gsap.fromTo(
    '.property-card',
    { opacity: 0, y: 30, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
  );
}

// Fetch Global Site Configuration from Express backend
async function loadSiteConfig() {
  try {
    const res = await fetch('/api/site-config');
    if (res.ok) {
      siteConfig = await res.json();
      applySiteConfig();
    }
  } catch (err) {
    console.warn('Could not load site-config, using fallback', err);
  }
}

function applySiteConfig() {
  const brandName = document.getElementById('brand-title');
  if (brandName && siteConfig.logoText) {
    brandName.innerHTML = `${siteConfig.logoText} <span class="text-gradient">${siteConfig.logoHighlight || 'HABITAT'}</span>`;
  }
  const footerContact = document.getElementById('footer-contact');
  if (footerContact && siteConfig.phone) {
    footerContact.textContent = `${siteConfig.email || 'contact@chichochabitat.ci'} · ${siteConfig.phone}`;
  }
}

// Fetch Properties from Express backend
async function loadProperties() {
  try {
    const res = await fetch('/api/properties/geo');
    if (res.ok) {
      properties = await res.json();
      populateFilters();
      renderProperties(properties);
    }
  } catch (err) {
    console.error('Failed to fetch properties from backend', err);
  }
}

function populateFilters() {
  if (!properties || properties.length === 0) return;
  const cities = Array.from(new Set(properties.map(p => p.city))).sort();
  const types = Array.from(new Set(properties.map(p => p.type))).sort();

  if (searchCity) {
    searchCity.innerHTML = '<option value="all">Toutes les villes</option>' +
      cities.map(c => `<option value="${c}">${c}</option>`).join('');
  }
  if (searchType) {
    searchType.innerHTML = '<option value="all">Tous les types</option>' +
      types.map(t => `<option value="${t}">${t}</option>`).join('');
  }
}

function formatPrice(amount) {
  if (!amount) return '0 F CFA';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' F CFA';
}

function toggleFavorite(id) {
  const numId = Number(id);
  const idx = favorites.indexOf(numId);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push(numId);
  }
  localStorage.setItem('cch_favorites', JSON.stringify(favorites));
  updateFavoritesUI();
}

function updateFavoritesUI() {
  if (favCountEl) {
    favCountEl.textContent = favorites.length;
  }
  document.querySelectorAll('.btn-fav').forEach(btn => {
    const id = Number(btn.getAttribute('data-id'));
    if (favorites.includes(id)) {
      btn.classList.add('active');
      btn.innerHTML = '❤️';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '🤍';
    }
  });
}

function renderProperties(list) {
  if (!propertyGrid) return;

  if (list.length === 0) {
    propertyGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: #94A3B8;">
        <p style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</p>
        <p style="font-weight: bold; font-size: 1.1rem; color: #FFF;">Aucun bien ne correspond à ces critères</p>
        <p style="font-size: 0.85rem;">Essayez d'élargir votre localisation ou votre type de bien.</p>
      </div>
    `;
    return;
  }

  propertyGrid.innerHTML = list.map(item => {
    const isFav = favorites.includes(item.id);
    const detailUrl = `/properties/${item.slug || item.id}`;

    return `
      <article class="property-card" data-id="${item.id}">
        <div class="property-thumb">
          <img src="${item.image}" alt="${item.title}" loading="lazy" />
          <div class="card-badges">
            <span class="badge-tag ${item.intent_label?.toLowerCase().includes('louer') || item.intent === 'rent' ? 'badge-rent' : 'badge-sale'}">
              ${item.intent_label || (item.intent === 'rent' ? 'À LOUER' : 'À VENDRE')}
            </span>
            <span class="badge-tag" style="background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(52, 211, 153, 0.4);">
              GPS ±8m
            </span>
          </div>
          <button type="button" class="btn-fav ${isFav ? 'active' : ''}" data-id="${item.id}" onclick="toggleFavorite(${item.id})">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>

        <div class="card-body">
          <p class="card-location">📍 ${item.district ? `${item.district}, ${item.city}` : item.city}</p>
          <h3 class="card-title">${item.title}</h3>
          <p class="card-specs">
            ${item.bedrooms ? `${item.bedrooms} ch. · ` : ''}
            ${item.bathrooms ? `${item.bathrooms} sdb. · ` : ''}
            ${item.area} m² · Titre ACD Vérifié
          </p>

          <div class="card-footer">
            <p class="card-price">${formatPrice(item.price)}</p>
            <a href="${detailUrl}" class="btn" style="padding: 0.4rem 0.85rem; font-size: 0.75rem;">Voir la fiche →</a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  animateCards();
  updateFavoritesUI();
}

function filterProperties() {
  const city = searchCity ? searchCity.value : 'all';
  const type = searchType ? searchType.value : 'all';
  const intent = searchIntent ? searchIntent.value : 'all';

  const filtered = properties.filter(p => {
    const matchCity = city === 'all' || p.city === city || p.district === city;
    const matchType = type === 'all' || p.type === type;
    const matchIntent = intent === 'all' || (p.intent_label && p.intent_label.toLowerCase().includes(intent)) || p.intent === intent;
    return matchCity && matchType && matchIntent;
  });

  renderProperties(filtered);
}

// Event Listeners
if (searchBtn) {
  searchBtn.addEventListener('click', filterProperties);
}
if (searchCity) searchCity.addEventListener('change', filterProperties);
if (searchType) searchType.addEventListener('change', filterProperties);
if (searchIntent) searchIntent.addEventListener('change', filterProperties);

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  initGsapAnimations();
  loadSiteConfig();
  loadProperties();
  updateFavoritesUI();
});
