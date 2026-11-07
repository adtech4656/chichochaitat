import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { store, User } from './src/server/store.js';
import {
  authMiddleware,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  requireAdmin,
  sanitizeInput,
  parseAndValidateFirebaseToken,
} from './src/server/auth.js';
import { startFxService, refreshExchangeRates } from './src/server/fx.js';
import { PAGES_DATA, PropertyItem } from './src/data/inventory.js';
import { generateAutoReply } from './src/server/ai-agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

// Initialize background live FX update service
startFxService();

// Load translation files safely
let enTranslations: Record<string, string> = {};
let frTranslations: Record<string, string> = {};

try {
  enTranslations = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'lang/en.json'), 'utf-8'));
} catch (e) {
  console.warn('Could not read lang/en.json', e);
}

try {
  frTranslations = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'lang/fr.json'), 'utf-8'));
} catch (e) {
  console.warn('Could not read lang/fr.json', e);
}

function getFooterPages(locale: 'en' | 'fr') {
  const result: Record<string, { slug: string; title: string }[]> = {
    trust: [],
    company: [],
    legal: [],
  };

  for (const page of PAGES_DATA) {
    const localized = locale === 'fr' ? page.fr : page.en;
    if (result[page.group]) {
      result[page.group].push({
        slug: page.slug,
        title: localized.title,
      });
    }
  }

  return result;
}

// In-memory rate limiter for auth & high-value mutations
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimiter(limit = 15, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'client';
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= limit) {
      return res.status(429).json({ error: 'Too many attempts. Please try again in one minute.' });
    }
    entry.count++;
    next();
  };
}

function getSharedProps(req: Request) {
  const locale: 'en' | 'fr' = req.cookies.locale === 'en' ? 'en' : 'fr';
  const currencies = store.getCurrencies();
  const currency = req.cookies.currency && currencies[req.cookies.currency] ? req.cookies.currency : 'XOF';
  const user: User | undefined = (req as any).user;

  return {
    auth: {
      user: user
        ? {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role,
            initials: user.initials,
            permissions: user.permissions,
            is_admin: user.role === 'admin' || user.role === 'superadmin',
            member_since: user.member_since,
            backend_url: user.role === 'agent' ? '/agent/kyc' : '/admin/verification',
            saved_properties: user.saved_properties || [],
            price_drop_subscriptions: user.price_drop_subscriptions || [],
          }
        : null,
      guest_saved_properties: (() => {
        try {
          const raw = req.cookies['cch_guest_wishlist'];
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      })(),
    },
    locale,
    currencies,
    currency,
    site: {
      name: 'ChiChoc-Habitat',
      tagline: locale === 'fr' ? 'Habitat vérifié' : 'Verified living',
      email: 'hello@chichochabitat.ci',
      phone: '+225 07 00 00 00',
      address: 'Cocody, Abidjan, Côte d’Ivoire',
    },
    translations: locale === 'fr' ? frTranslations : enTranslations,
    footerPages: getFooterPages(locale),
    siteStats: {
      approved: store.getPublishedProperties().length,
      agents: 3,
    },
    flash: {
      success: req.cookies.cch_flash_success || null,
      error: req.cookies.cch_flash_error || null,
    },
    errors: (req as any).validationErrors || {},
  };
}

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function startServer() {
  const app = express();

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(authMiddleware);

  // Clear flash cookies after consumption
  app.use((req, res, next) => {
    if (req.cookies.cch_flash_success) res.clearCookie('cch_flash_success');
    if (req.cookies.cch_flash_error) res.clearCookie('cch_flash_error');
    next();
  });

  // Serve static files in public
  app.use(express.static(path.resolve(__dirname, 'public')));

  let vite: any = null;
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
  }

  async function renderInertia(
    req: Request,
    res: Response,
    component: string,
    pageProps: Record<string, any>,
  ) {
    const shared = getSharedProps(req);
    const mergedProps = { ...shared, ...pageProps };
    const pagePayload = {
      component,
      props: mergedProps,
      url: req.originalUrl,
      version: '1.0',
    };

    if (req.headers['x-inertia']) {
      res.set('X-Inertia', 'true');
      return res.json(pagePayload);
    }

    const templatePath = path.resolve(__dirname, isProd ? 'dist/index.html' : 'index.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    if (!isProd && vite) {
      html = await vite.transformIndexHtml(req.originalUrl, html);
    }

    const jsonString = JSON.stringify(pagePayload);
    const safeScriptJson = jsonString.replace(/<\/script/gi, '<\\/script');
    const safeAttrJson = escapeHtmlAttr(jsonString);

    html = html
      .replace('__INERTIA_PAGE_SCRIPT__', safeScriptJson)
      .replace('__INERTIA_PAGE_ATTR__', safeAttrJson)
      .replace('__INERTIA_PAGE__', safeAttrJson);

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  }

  // ==========================================
  // Public Page Routes
  // ==========================================

  // Homepage
  app.get('/', async (req, res) => {
    const locale: 'en' | 'fr' = req.cookies.locale === 'en' ? 'en' : 'fr';
    const user = (req as any).user;
    const allPublished = store.getPublishedProperties(user);
    const featured = allPublished.slice(0, 6);

    const categories = {
      buy: allPublished.filter((p) => p.intent === 'sale').length,
      rent: allPublished.filter((p) => p.intent === 'rent').length,
      land: allPublished.filter((p) => p.type === 'Land').length,
      commercial: allPublished.filter((p) => p.type === 'Shop').length,
      hospitality: allPublished.filter((p) => p.type === 'Hotel').length,
    };

    const market = featured.slice(0, 3).map((p) => ({
      id: p.id,
      region: p.city,
      published: p.published,
      title: p.title,
      type: p.type,
      intent_label: locale === 'fr' ? (p.intent === 'rent' ? 'Par mois' : 'À vendre') : (p.intent === 'rent' ? 'Per month' : 'For sale'),
      area: p.area,
      price: p.price,
      href: p.href,
    }));

    const content = {
      eyebrow: locale === 'fr' ? 'Marché vérifié · Côte d’Ivoire' : 'Verified marketplace · Côte d’Ivoire',
      title_line1: locale === 'fr' ? 'Trouvez votre' : 'Find Your',
      title_line2: locale === 'fr' ? 'habitat vérifié.' : 'Verified Habitat.',
      subtitle:
        locale === 'fr'
          ? 'Des maisons, des terrains et des locaux commerciaux réellement fiables — chaque photo prise sur place, chaque agent contrôlé, chaque annonce approuvée avant de vous parvenir.'
          : 'Homes, land, and commercial space you can actually trust — every photo captured on site, every agent identity-checked, every listing approved before it reaches you.',
      tagline: locale === 'fr' ? 'Habitat vérifié' : 'Verified living',
      stats: {
        listings: `${allPublished.length}.4k`,
        agents: '1,860',
        approval: '98.7',
        response: '4 min',
      },
    };

    const locations = Array.from(
      new Set([
        ...allPublished.map((p) => p.city),
        ...allPublished.map((p) => p.district).filter(Boolean),
      ]),
    ).sort();

    const filters = {
      cities: Array.from(new Set(allPublished.map((p) => p.city))).sort(),
      locations,
      types: Array.from(new Set(allPublished.map((p) => p.type))).sort(),
    };

    await renderInertia(req, res, 'Home', {
      properties: allPublished,
      categories,
      market,
      content,
      filters,
    });
  });

  // Search & Explorer & Map
  app.get(['/properties', '/search', '/explorer', '/map', '/carte'], async (req, res) => {
    const user = (req as any).user;
    const list = store.getPublishedProperties(user);
    const tags = Array.from(new Set(list.flatMap((p) => p.tags))).sort();

    const filters = {
      cities: Array.from(new Set(list.map((p) => p.city))).sort(),
      types: Array.from(new Set(list.map((p) => p.type))).sort(),
      subTypes: [],
      amenities: tags,
      budgets: [
        { label: 'Under 25M', min: 0, max: 25000000 },
        { label: '25M – 60M', min: 25000000, max: 60000000 },
        { label: '60M – 120M', min: 60000000, max: 120000000 },
        { label: '120M+', min: 120000000, max: null },
      ],
    };

    const isMapView = req.path.includes('map') || req.path.includes('carte') || req.query.view === 'map';

    await renderInertia(req, res, 'Search', {
      properties: list,
      filters,
      initialView: isMapView ? 'map' : 'grid',
      stats: {
        listings: list.length,
      },
    });
  });

  // Dedicated Bespoke Request Route
  app.get(['/demande', '/demandes', '/request', '/requests/new'], async (req, res) => {
    const propertyRequests = store.getPropertyRequests();
    await renderInertia(req, res, 'Demande', {
      propertyRequests,
    });
  });

  // Property details
  app.get('/properties/:slug', async (req, res) => {
    const { slug } = req.params;
    const user = (req as any).user;
    const property = store.getPropertyBySlug(slug, user);

    if (!property) {
      return res.status(404).redirect('/properties');
    }

    const allPublished = store.getPublishedProperties(user);
    const similar = allPublished
      .filter((p) => p.slug !== slug && p.type === property.type)
      .slice(0, 3);

    await renderInertia(req, res, 'PropertyShow', {
      property,
      similar,
    });
  });

  // Dedicated Agent Profile Route
  app.get(['/agents/:idOrSlug', '/agent/profile/:idOrSlug'], async (req, res) => {
    const { idOrSlug } = req.params;
    const user = (req as any).user;
    const agent = store.getAgentBySlugOrId(idOrSlug);

    if (!agent) {
      res.cookie('cch_flash_error', 'Agent not found.', { maxAge: 8000 });
      return res.redirect(303, '/properties');
    }

    const properties = store.getPropertiesByAgentId(agent.id, user);

    const stats = {
      activeListings: properties.length,
      dealsClosed: agent.deals,
      rating: agent.rating,
      responseRate: '100%',
      avgResponse: agent.response,
      memberSince: agent.since,
      kycStatus: 'Verified & Audited',
      reviewCount: Math.round(agent.deals * 0.82),
    };

    await renderInertia(req, res, 'AgentShow', {
      agent,
      properties,
      stats,
    });
  });

  app.get('/agents', (req, res) => {
    res.redirect(303, '/properties');
  });

  // Static content pages
  app.get('/pages/:slug', async (req, res) => {
    const { slug } = req.params;
    const locale = req.cookies.locale === 'en' ? 'en' : 'fr';
    const pageItem = PAGES_DATA.find((p) => p.slug === slug);

    if (!pageItem) {
      return res.status(404).redirect('/');
    }

    const localized = locale === 'fr' ? pageItem.fr : pageItem.en;

    await renderInertia(req, res, 'Page', {
      page: {
        slug: pageItem.slug,
        title: localized.title,
        group: pageItem.group,
        body: localized.body,
        updated_at: '21 October 2026',
      },
    });
  });

  // User Dashboard (Account & Saved Properties / Agent View Analytics)
  app.get(['/account', '/dashboard'], async (req, res) => {
    const user: User | undefined = (req as any).user;
    if (!user) {
      res.cookie('cch_flash_error', 'Please sign in to view your account dashboard.', { maxAge: 10000 });
      return res.redirect(303, '/');
    }

    const saved = store.getSavedPropertiesForUser(user.id);
    const priceAlerts = store.getPriceDropSubscriptionsForUser(user.id);
    const offers = store.getOffersForUser(user.id);
    const chats = store.getConversationsForUser(user.id);
    const propertyRequests = user.role === 'agent' || user.role === 'admin'
      ? store.getPropertyRequests()
      : store.getPropertyRequests({ user_id: user.id });
    const agentStats = store.getAgentStats30Days(user.id === 2 ? 1 : user.id);

    await renderInertia(req, res, 'Dashboard', {
      saved,
      priceAlerts,
      offers,
      chats,
      propertyRequests,
      agentStats,
      initialTab: (req.query.tab as string) || null,
      customer: {
        name: user.name,
        initials: user.initials,
        email: user.email,
        phone: user.phone,
        member_since: user.member_since,
        role: user.role,
      },
      hasListings: true,
    });
  });

  // Dedicated Wishlist Page (Persisted across sessions)
  app.get(['/wishlist', '/favoris'], async (req, res) => {
    const user: User | undefined = (req as any).user;
    let savedProperties: PropertyItem[] = [];
    let isGuest = false;

    if (user) {
      savedProperties = store.getSavedPropertiesForUser(user.id);
    } else {
      isGuest = true;
      let guestIds: number[] = [];
      try {
        const raw = req.cookies['cch_guest_wishlist'];
        if (raw) guestIds = JSON.parse(raw);
      } catch {
        guestIds = [];
      }
      if (!Array.isArray(guestIds)) guestIds = [];
      savedProperties = store.getPropertiesBySavedIds(guestIds, undefined);
    }

    await renderInertia(req, res, 'Wishlist', {
      savedProperties,
      isGuest,
      user: user
        ? {
            name: user.name,
            email: user.email,
            role: user.role,
          }
        : null,
    });
  });

  // Dedicated Property Comparison Page
  app.get(['/compare', '/comparer'], async (req, res) => {
    const user: User | undefined = (req as any).user;
    let ids: number[] = [];
    if (typeof req.query.ids === 'string') {
      ids = req.query.ids.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    } else if (Array.isArray(req.query.ids)) {
      ids = req.query.ids.map((s) => parseInt(String(s), 10)).filter((n) => !isNaN(n));
    }

    const comparedProperties = store.getPropertiesByIds(ids, user);
    const allPublished = store.getPublishedProperties(user);
    const availableProperties = allPublished.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      currency: p.currency,
      city: p.city,
      district: p.district,
      type: p.type,
      image: p.image,
      beds: p.beds,
      baths: p.baths,
      area: p.area,
    }));

    await renderInertia(req, res, 'Compare', {
      initialIds: ids,
      comparedProperties,
      availableProperties,
    });
  });

  // Dedicated Agent 30-Day View Analytics Dashboard Route
  app.get(['/agent/analytics', '/agent/stats'], async (req, res) => {
    const user: User | undefined = (req as any).user;
    const agentStats = store.getAgentStats30Days(user?.id === 2 ? 1 : user?.id);
    await renderInertia(req, res, 'Agent/Analytics', {
      stats: agentStats,
      agent: agentStats.agent,
    });
  });

  // Agent Stats API
  app.get('/api/agent/stats-30d', (req, res) => {
    const agentIdOrSlug = (req.query.agent as string) || undefined;
    const stats = store.getAgentStats30Days(agentIdOrSlug);
    res.json({ success: true, stats });
  });

  // Agent onboarding & KYC
  app.get(['/agent/kyc', '/become-agent/kyc'], async (req, res) => {
    const user = (req as any).user;
    await renderInertia(req, res, 'Agent/Kyc', {
      applicant: {
        name: user?.name || 'Aya Koffi',
        email: user?.email || 'aya@koffi-immobilier.ci',
        phone: user?.phone || '+225 07 00 00 01',
        agency: 'Koffi & Co. Immobilier',
      },
    });
  });

  // Agent Capture
  app.get(['/agent/capture', '/become-agent/capture'], async (req, res) => {
    await renderInertia(req, res, 'Agent/Upload', {
      requirement: {
        title: 'Mansard View Residence',
        address: 'Cocody, Abidjan',
        distance_m: 42,
        tolerance_m: 100,
        lat: 5.3599,
        lng: -3.9866,
      },
      checklist: [
        { key: 'front', label: 'Front elevation', required: true },
        { key: 'living', label: 'Living room', required: true },
        { key: 'kitchen', label: 'Kitchen', required: true },
        { key: 'bedroom1', label: 'Bedroom 1', required: true },
        { key: 'bathroom1', label: 'Bathroom 1', required: true },
        { key: 'garden', label: 'Garden & Pool', required: false },
        { key: 'street', label: 'Street view & context', required: true },
      ],
    });
  });

  // Admin Verification Console
  app.get('/admin/verification', async (req, res) => {
    // If not admin, authenticate as default admin for demo preview
    let user = (req as any).user;
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      const admin = store.getUserById(4);
      if (admin) {
        user = admin;
        (req as any).user = admin;
        setSessionCookie(res, admin);
      }
    }

    const queue = store.getVerificationQueue();
    const counts = {
      all: queue.length,
      pending: queue.filter((i) => i.status === 'pending').length,
      in_review: queue.filter((i) => i.status === 'in_review').length,
      approved: queue.filter((i) => i.status === 'approved').length,
      needs_info: queue.filter((i) => i.status === 'needs_info').length,
    };

    const propertyRequests = store.getPropertyRequests();

    await renderInertia(req, res, 'Admin/Verification', {
      queue,
      counts,
      propertyRequests,
    });
  });

  // ==========================================
  // Auth API Endpoints (Secured & Rate-limited)
  // ==========================================

  function mergeGuestWishlistIfExists(req: express.Request, res: express.Response, userId: number) {
    try {
      const raw = req.cookies['cch_guest_wishlist'];
      if (raw) {
        const guestIds = JSON.parse(raw);
        if (Array.isArray(guestIds) && guestIds.length > 0) {
          store.mergeGuestWishlist(userId, guestIds);
          res.clearCookie('cch_guest_wishlist', { path: '/' });
        }
      }
    } catch {
      // ignore
    }
  }

  app.post('/register', rateLimiter(10, 60000), (req, res) => {
    const { name, email, phone, password } = sanitizeInput(req.body);

    if (!name || !email || !password) {
      res.cookie('cch_flash_error', 'Name, email, and password are required.', { maxAge: 10000 });
      return res.redirect(303, req.headers.referer || '/');
    }

    if (password.length < 6) {
      res.cookie('cch_flash_error', 'Password must be at least 6 characters long.', { maxAge: 10000 });
      return res.redirect(303, req.headers.referer || '/');
    }

    try {
      const user = store.createUser(name, email, phone || '', password);
      mergeGuestWishlistIfExists(req, res, user.id);
      setSessionCookie(res, user);
      res.cookie('cch_flash_success', `Welcome to ChiChoc-Habitat, ${user.name}!`, { maxAge: 10000 });
      res.redirect(303, req.headers.referer || '/account');
    } catch (err: any) {
      res.cookie('cch_flash_error', err.message || 'Registration failed.', { maxAge: 10000 });
      res.redirect(303, req.headers.referer || '/');
    }
  });

  app.post('/login', rateLimiter(15, 60000), (req, res) => {
    const { email, password } = sanitizeInput(req.body);

    if (!email || !password) {
      res.cookie('cch_flash_error', 'Please enter your email and password.', { maxAge: 10000 });
      return res.redirect(303, req.headers.referer || '/');
    }

    const user = store.getUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      res.cookie('cch_flash_error', 'Invalid email or password.', { maxAge: 10000 });
      return res.redirect(303, req.headers.referer || '/');
    }

    mergeGuestWishlistIfExists(req, res, user.id);
    setSessionCookie(res, user);
    res.cookie('cch_flash_success', `Welcome back, ${user.name}!`, { maxAge: 10000 });
    res.redirect(303, req.headers.referer || '/account');
  });

  app.post('/logout', (req, res) => {
    clearSessionCookie(res);
    res.cookie('cch_flash_success', 'You have been signed out.', { maxAge: 10000 });
    if (req.headers.accept?.includes('application/json') || req.headers['content-type']?.includes('application/json')) {
      return res.json({ success: true });
    }
    res.redirect(303, '/');
  });

  // Firebase Session Sync Endpoint:
  // Verifies Firebase ID Token, links or creates the local user profile,
  // and establishes a server-side HttpOnly signed session cookie.
  app.post('/auth/firebase-session', rateLimiter(20, 60000), (req, res) => {
    try {
      const { idToken, email, name, phone, uid } = sanitizeInput(req.body);

      if (!idToken || !email) {
        return res.status(400).json({ success: false, error: 'Firebase ID token and email are required.' });
      }

      const decoded = parseAndValidateFirebaseToken(idToken);
      if (!decoded || (decoded.email && decoded.email.toLowerCase() !== email.toLowerCase())) {
        return res.status(401).json({ success: false, error: 'Invalid or expired Firebase authentication token.' });
      }

      let user = store.getUserByEmail(email);
      if (!user) {
        const displayName = name || decoded.name || email.split('@')[0];
        const randomPassword = `fb_${uid || Math.random().toString(36).substring(2)}`;
        user = store.createUser(displayName, email, phone || '', randomPassword);
      }

      setSessionCookie(res, user);
      res.cookie('cch_flash_success', `Welcome to Chic Choc Habitat, ${user.name}!`, { maxAge: 10000 });

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          initials: user.initials,
        },
      });
    } catch (err: any) {
      console.error('Firebase session error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to establish server session.' });
    }
  });

  // ==========================================
  // Core Business Actions & Workflows
  // ==========================================

  // Locale switcher (persists user choice for 1 year)
  app.post('/locale/:locale', (req, res) => {
    const locale = req.params.locale === 'en' ? 'en' : 'fr';
    res.cookie('locale', locale, {
      maxAge: 365 * 24 * 3600 * 1000,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });
    if (req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, locale });
    }
    res.redirect(303, req.headers.referer || '/');
  });

  // Currency switcher (persists user choice for 1 year, defaults to XOF)
  app.post('/currency/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const currencies = store.getCurrencies();
    const activeCode = currencies[code] ? code : 'XOF';
    res.cookie('currency', activeCode, {
      maxAge: 365 * 24 * 3600 * 1000,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });
    if (req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, currency: activeCode });
    }
    res.redirect(303, req.headers.referer || '/');
  });

  // Save / Favorite Property (Persists in user profile session or guest cookie)
  app.post('/properties/:id/save', (req, res) => {
    const user = (req as any).user;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'invalid_id', message: 'Invalid property id' });
    }

    if (user) {
      const saved = store.toggleSaveProperty(user.id, id);
      if (req.headers['x-inertia']) {
        return res.redirect(303, req.headers.referer || '/wishlist');
      }
      return res.json({
        success: true,
        saved,
        property_id: id,
        total_saved: user.saved_properties?.length || 0,
        saved_ids: user.saved_properties || [],
      });
    }

    // Guest wishlist persisted in browser session cookie
    let guestIds: number[] = [];
    try {
      const raw = req.cookies['cch_guest_wishlist'];
      if (raw) guestIds = JSON.parse(raw);
    } catch {
      guestIds = [];
    }
    if (!Array.isArray(guestIds)) guestIds = [];

    const idx = guestIds.indexOf(id);
    let saved = false;
    if (idx >= 0) {
      guestIds.splice(idx, 1);
      saved = false;
    } else {
      guestIds.push(id);
      saved = true;
    }

    res.cookie('cch_guest_wishlist', JSON.stringify(guestIds), {
      maxAge: 30 * 24 * 3600 * 1000,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });

    if (req.headers['x-inertia']) {
      return res.redirect(303, req.headers.referer || '/wishlist');
    }
    return res.json({
      success: true,
      saved,
      property_id: id,
      total_saved: guestIds.length,
      saved_ids: guestIds,
      is_guest: true,
    });
  });

  // Subscribe / Unsubscribe to Price Drop Notifications
  app.post('/properties/:id/price-drop-subscribe', (req, res) => {
    const user = (req as any).user;
    if (!user) {
      if (req.headers['x-inertia']) {
        res.cookie('cch_flash_error', 'Please sign in to subscribe to price drop notifications.', { maxAge: 10000 });
        return res.redirect(303, req.headers.referer || '/');
      }
      return res.status(401).json({ error: 'unauthenticated', message: 'Please sign in to subscribe to price drop notifications.' });
    }

    const id = parseInt(req.params.id, 10);
    const subscribed = store.togglePriceDropSubscription(user.id, id);
    const prop = store.getPropertyById(id);

    const msg = subscribed
      ? `Price drop notifications activated for ${prop?.title || 'this property'}.`
      : `Price drop notifications disabled for ${prop?.title || 'this property'}.`;

    if (req.headers['x-inertia']) {
      res.cookie('cch_flash_success', msg, { maxAge: 10000 });
      return res.redirect(303, req.headers.referer || '/');
    }
    return res.json({
      success: true,
      subscribed,
      property_id: id,
      message: msg,
      total_subscribed: (user.price_drop_subscriptions || []).length,
    });
  });

  // Create Commercial Offer
  app.post('/offers', rateLimiter(10, 60000), (req, res) => {
    let user = (req as any).user;
    if (!user) {
      user = store.getUserById(1)!;
      setSessionCookie(res, user);
    }

    const { property_id, discount_percent, amount, message } = sanitizeInput(req.body);
    const propId = parseInt(property_id, 10);
    const numAmount = parseInt(amount, 10);
    const discount = parseInt(discount_percent, 10) || 3;

    try {
      store.createOffer(user.id, propId, numAmount, discount, message);
      res.cookie('cch_flash_success', 'Your offer has been recorded and submitted to the agent.', { maxAge: 10000 });
      res.redirect(303, '/account');
    } catch (err: any) {
      res.cookie('cch_flash_error', err.message || 'Failed to place offer.', { maxAge: 10000 });
      res.redirect(303, req.headers.referer || '/');
    }
  });

  // Accept Offer
  app.post('/offers/:id/accept', (req, res) => {
    const offerId = parseInt(req.params.id, 10);
    const offer = store.acceptOffer(offerId);

    if (offer) {
      res.cookie('cch_flash_success', `Offer accepted! Reference: ${offer.deal?.reference}`, { maxAge: 10000 });
    } else {
      res.cookie('cch_flash_error', 'Offer not found.', { maxAge: 10000 });
    }
    res.redirect(303, req.headers.referer || '/account');
  });

  // Reject Offer
  app.post('/offers/:id/reject', (req, res) => {
    const offerId = parseInt(req.params.id, 10);
    store.rejectOffer(offerId);
    res.cookie('cch_flash_success', 'Offer rejected.', { maxAge: 10000 });
    res.redirect(303, req.headers.referer || '/account');
  });

  // Schedule Official Appointment (Neutral Intermediation Protocol)
  app.post('/appointments/schedule', rateLimiter(10, 60000), (req, res) => {
    let user = (req as any).user;
    if (!user) {
      user = store.getUserById(1)!;
      setSessionCookie(res, user);
    }

    const { property_id, agent_id, date, time_slot, appointment_type, phone, notes } = sanitizeInput(req.body);
    const propId = parseInt(property_id, 10);
    const property = store.getPropertyById(propId);

    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found.' });
    }

    const slotLabel = time_slot === 'morning' ? 'Matinée (09h00 - 12h00)' : time_slot === 'afternoon' ? 'Après-midi (14h00 - 17h00)' : 'Samedi matin (10h00 - 13h00)';
    const typeLabel = appointment_type === 'visit' ? 'Visite physique sur site' : appointment_type === 'legal' ? 'Revue des titres & ACD' : 'Signature notariée / Bail';

    const appointmentTicket = {
      id: Date.now(),
      user_id: user.id,
      property_id: propId,
      agent_id: agent_id || property.agent?.id || 1,
      date,
      time_slot: slotLabel,
      type: typeLabel,
      phone: phone || user.phone || '',
      notes: notes || '',
      status: 'confirmed_supervised',
      created_at: new Date().toISOString(),
    };

    // Record ticket into in-app chat thread supervised by ChiChoc Habitat
    try {
      store.createConversation(
        user.id,
        propId,
        `[DEMANDE DE RENDEZ-VOUS EN 2 ÉTAPES — CONCIERGERIE CHICHOC HABITAT]\nBien : ${property.title}\nDate sollicitée : ${date} (${slotLabel})\nType : ${typeLabel}\nContact : ${phone || user.phone || 'Non renseigné'}\nNotes : ${notes || 'Aucune'}\n\nProtocole d'intermédiation : La Conciergerie ChiChoc Habitat coordonne directement avec l'agent/propriétaire (${property.agent?.name || 'Agréé'}) pour verrouiller le créneau et délivrer votre pass de visite officielle supervisée.`
      );
    } catch (e) {
      // ignore if conversation already opened
    }

    res.cookie('cch_flash_success', 'Votre demande de rendez-vous a été transmise à la Conciergerie ChiChoc Habitat.', { maxAge: 10000 });
    return res.json({
      success: true,
      appointment: appointmentTicket,
      message: 'Demande de rendez-vous enregistrée. La Conciergerie ChiChoc Habitat coordonne avec l’agent pour délivrer votre pass de visite.',
    });
  });

  // GeoJSON / GPS Property coordinates endpoint for interactive maps
  app.get('/api/properties/geo', (req, res) => {
    const properties = store.getPublishedProperties();
    const geo = properties.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      price: p.price,
      currency: p.currency,
      intent_label: p.intent_label,
      type: p.type,
      location: p.location,
      district: p.district,
      city: p.city,
      lat: p.lat,
      lng: p.lng,
      image: p.image,
      href: p.href,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      area: p.area,
    }));
    res.json(geo);
  });

  // Customer Property Requests API (Mandats de recherche sur-mesure)
  app.get('/api/property-requests', (req, res) => {
    const user = (req as any).user;
    const requests = user && user.role === 'customer'
      ? store.getPropertyRequests({ user_id: user.id })
      : store.getPropertyRequests();
    res.json(requests);
  });

  app.post('/api/property-requests', rateLimiter(10, 60000), (req, res) => {
    let user = (req as any).user;
    if (!user) {
      user = store.getUserById(1)!;
      setSessionCookie(res, user);
    }

    const payload = sanitizeInput(req.body);
    const newRequest = store.createPropertyRequest({
      user_id: user.id,
      user_name: payload.user_name || user.name,
      user_phone: payload.user_phone || user.phone,
      user_email: payload.user_email || user.email,
      intent: payload.intent || 'sale',
      type: payload.type || 'House',
      city: payload.city || 'Abidjan',
      district: payload.district || 'Cocody',
      budget_min: Number(payload.budget_min) || 25000000,
      budget_max: Number(payload.budget_max) || 60000000,
      currency: payload.currency || 'XOF',
      lat: payload.lat ? Number(payload.lat) : undefined,
      lng: payload.lng ? Number(payload.lng) : undefined,
      bedrooms_min: payload.bedrooms_min ? Number(payload.bedrooms_min) : undefined,
      bathrooms_min: payload.bathrooms_min ? Number(payload.bathrooms_min) : undefined,
      surface_min: payload.surface_min ? Number(payload.surface_min) : undefined,
      facilities: Array.isArray(payload.facilities)
        ? payload.facilities
        : typeof payload.facilities === 'string'
        ? payload.facilities.split(',').map((f: string) => f.trim()).filter(Boolean)
        : [],
      notes: payload.notes || '',
    });

    res.cookie('cch_flash_success', 'Votre demande sur-mesure a été transmise au réseau d’agents certifiés.', { maxAge: 10000 });

    if (req.headers['x-inertia'] || !req.headers.accept?.includes('application/json')) {
      return res.redirect(303, req.headers.referer || '/account');
    }

    return res.status(201).json({
      success: true,
      request: newRequest,
      message: 'Demande sur-mesure diffusée aux agents vérifiés.',
    });
  });

  // Agent Claims Customer Property Request
  app.post('/api/property-requests/:id/claim', rateLimiter(15, 60000), (req, res) => {
    let user = (req as any).user;
    if (!user) {
      // Default to certified agent Aya Koffi for demo purposes if not logged in as agent
      user = store.getUserById(2)!;
      setSessionCookie(res, user);
    }

    const requestId = parseInt(req.params.id, 10);
    const { message, recommended_property_id } = sanitizeInput(req.body);
    const recId = recommended_property_id ? parseInt(recommended_property_id, 10) : undefined;

    const success = store.claimPropertyRequest(
      requestId,
      user.id,
      user.name,
      message || `L'agent certifié ${user.name} a pris en charge votre demande et prépare un dossier complet.`,
      recId,
    );

    if (success) {
      res.cookie('cch_flash_success', 'Demande client prise en charge avec succès.', { maxAge: 10000 });
      if (req.headers['x-inertia'] || !req.headers.accept?.includes('application/json')) {
        return res.redirect(303, req.headers.referer || '/account');
      }
      return res.json({ success: true, message: 'Demande réclamée et notifiée au client.' });
    }

    return res.status(404).json({ success: false, error: 'Demande introuvable.' });
  });

  // Start new conversation from property (Supports direct chat & AI auto-reply)
  app.post('/chat/conversations', async (req, res) => {
    let user = (req as any).user;
    if (!user) {
      user = store.getUserById(1)!;
      setSessionCookie(res, user);
    }

    const { property_id, message, text } = sanitizeInput(req.body);
    const propId = parseInt(property_id, 10);
    const bodyText = text || message || 'Hello, I am interested in this verified property.';
    const prop = store.getPropertyById(propId);

    try {
      const convo = store.startConversation(user.id, propId, bodyText);

      // Trigger instant AI Auto-Reply if message is from customer
      let aiText = '';
      if (prop) {
        aiText = await generateAutoReply({
          property: prop,
          customerName: user.name,
          customerMessage: bodyText,
          conversationHistory: convo.messages,
        });
        store.addAgentOrAiReply(convo.id, aiText, true);
      }

      if (req.headers.accept?.includes('application/json') || req.headers['content-type']?.includes('application/json')) {
        const fullConvos = store.getConversationsForUser(user.id);
        const active = fullConvos.find((c) => c.id === convo.id) || convo;
        return res.json({
          success: true,
          conversation: active,
          reply: aiText,
        });
      }

      res.cookie('cch_flash_success', 'Message sent to the verified agent. Immediate reply received.', { maxAge: 10000 });
      res.redirect(303, '/account');
    } catch (err: any) {
      if (req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ error: err.message || 'Could not start conversation.' });
      }
      res.cookie('cch_flash_error', err.message || 'Could not start conversation.', { maxAge: 10000 });
      res.redirect(303, req.headers.referer || '/');
    }
  });

  // Send message inside conversation (with instant grounded AI auto-reply)
  app.post('/chat/conversations/:id/messages', async (req, res) => {
    let user = (req as any).user;
    if (!user) {
      user = store.getUserById(1)!;
      setSessionCookie(res, user);
    }

    const conversationId = parseInt(req.params.id, 10);
    const { message, text } = sanitizeInput(req.body);
    const bodyText = text || message;

    if (bodyText) {
      const newMsg = store.addChatMessage(conversationId, user, bodyText);
      const convo = store.getConversationById(conversationId);
      const prop = convo ? store.getPropertyById(convo.property_id) : undefined;

      // If user is not the agent, auto-reply as agent/AI
      let aiText = '';
      if (user.role !== 'agent' && prop) {
        aiText = await generateAutoReply({
          property: prop,
          customerName: user.name,
          customerMessage: bodyText,
          conversationHistory: convo?.messages || [],
        });
        store.addAgentOrAiReply(conversationId, aiText, true);
      }

      if (req.headers.accept?.includes('application/json') || req.headers['content-type']?.includes('application/json')) {
        const fullConvos = store.getConversationsForUser(user.id);
        const active = fullConvos.find((c) => c.id === conversationId);
        return res.json({
          success: true,
          message: newMsg,
          reply: aiText,
          conversation: active,
        });
      }
    }

    res.redirect(303, req.headers.referer || '/account');
  });

  // Process Deal Escrow Payment (injects real receipt directly into chat)
  app.post('/chat/conversations/:id/payment', async (req, res) => {
    let user = (req as any).user;
    if (!user) {
      user = store.getUserById(1)!;
      setSessionCookie(res, user);
    }

    const conversationId = parseInt(req.params.id, 10);
    const payload = sanitizeInput(req.body);

    try {
      const result = store.processDealPayment(conversationId, payload, user);

      if (req.headers.accept?.includes('application/json') || req.headers['content-type']?.includes('application/json')) {
        const fullConvos = store.getConversationsForUser(user.id);
        const active = fullConvos.find((c) => c.id === conversationId) || result.conversation;
        return res.json({
          success: true,
          message: 'Paiement sécurisé validé. Reçu archivé dans votre fil de discussion.',
          conversation: active,
          receipt: result.receipt,
        });
      }

      res.cookie(
        'cch_flash_success',
        `Paiement sécurisé validé (${result.receipt.amount_xof.toLocaleString('fr-FR')} F CFA). Reçu archivé dans le chat.`,
        { maxAge: 10000 }
      );
      res.redirect(303, req.headers.referer || '/account');
    } catch (err: any) {
      if (req.headers.accept?.includes('application/json') || req.headers['content-type']?.includes('application/json')) {
        return res.status(400).json({ success: false, error: err.message || 'Erreur lors du traitement du paiement.' });
      }
      res.cookie('cch_flash_error', err.message || 'Erreur lors du traitement du paiement.', { maxAge: 10000 });
      return res.redirect(303, req.headers.referer || '/account');
    }
  });

  // Refresh live FX rates on demand
  app.post('/api/currency/refresh', async (req, res) => {
    const refreshed = await refreshExchangeRates();
    return res.json({
      success: true,
      refreshed,
      currencies: store.getCurrencies(),
    });
  });

  // Admin Verification Decision
  app.post('/admin/verification/:id/decision', (req, res) => {
    const user = (req as any).user;
    const propertyId = parseInt(req.params.id, 10);
    const { decision, note } = sanitizeInput(req.body);

    const reviewer = user ? `${user.name} (Reviewer)` : 'Admin Team';
    const success = store.setVerificationDecision(propertyId, decision, note, reviewer);

    if (success) {
      const msg = decision === 'approved' ? 'Listing approved & published live to marketplace!' : `Listing updated to ${decision}.`;
      res.cookie('cch_flash_success', msg, { maxAge: 10000 });
    } else {
      res.cookie('cch_flash_error', 'Could not update verification decision.', { maxAge: 10000 });
    }

    res.redirect(303, '/admin/verification');
  });

  // Agent KYC Submission
  app.post(['/kyc', '/become-agent/kyc'], (req, res) => {
    const user = (req as any).user;
    const payload = sanitizeInput(req.body);

    store.submitKyc({
      name: payload.name || user?.name || 'Agent Applicant',
      email: payload.email || user?.email || 'applicant@koffi.ci',
      phone: payload.phone || user?.phone || '+225 07 00 00 00',
      agency: payload.agency || 'Independent Agency',
      user_id: user?.id,
    });

    res.cookie('cch_flash_success', 'KYC application submitted successfully. Verification status: Approved.', { maxAge: 10000 });
    res.redirect(303, '/account');
  });

  // Agent Capture Submission
  app.post(['/capture', '/become-agent/capture'], (req, res) => {
    const payload = sanitizeInput(req.body);

    const newProp = store.submitPropertyListing({
      title: payload.title || 'Mansard View Residence',
      city: 'Abidjan',
      district: 'Cocody',
      location: 'Cocody, Abidjan',
      price: parseInt(payload.price, 10) || 54000000,
      intent: payload.intent || 'sale',
      type: payload.type || 'House',
      description: payload.description || 'Verified property captured via GPS-validated camera.',
    });

    res.cookie('cch_flash_success', `Property captured and queued for verification! (ID: ${newProp.id})`, { maxAge: 10000 });
    res.redirect(303, '/properties');
  });

  // Fallback route
  app.use((req, res) => {
    if (req.headers['x-inertia']) {
      return res.redirect(303, '/');
    }
    res.redirect(303, '/');
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChiChoc-Habitat secured server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
