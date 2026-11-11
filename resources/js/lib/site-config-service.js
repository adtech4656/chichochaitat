/**
 * Site Configuration Service & Client-Side Cache
 * Fetches dynamic site configurations (branding, contact details, social links, stats, and text copy)
 * from `/api/site-config` and notifies listeners when changes occur.
 */

const STORAGE_KEY = 'chichoc_site_config';

export const DEFAULT_SITE_CONFIG = {
    name: 'ChiChoc Habitat',
    logoText: 'CHIC CHOC',
    logoHighlight: 'HABITAT',
    logoBadge: 'Agréé MCLU & CDC-CI',
    tagline_fr: 'Portail Immobilier Agréé & Tiers de Confiance Séquestre',
    tagline_en: 'Verified Real Estate Portal & Escrow Intermediary',
    subtitle_fr: 'Des maisons, des terrains avec ACD et des locaux commerciaux réellement fiables en Côte d’Ivoire.',
    subtitle_en: 'Trusted homes, titled land with ACD, and commercial space across Côte d’Ivoire.',
    phone: '+225 07 00 00 00',
    whatsapp: '+225 07 00 00 00',
    whatsappMessage_fr: 'Bonjour Conciergerie ChiChoc Habitat, je souhaite obtenir des informations.',
    whatsappMessage_en: 'Hello ChiChoc Habitat Concierge, I would like to inquire about listings.',
    email: 'contact@chichochabitat.ci',
    address: 'Cocody Ambassades, Boulevard de France, Abidjan, Côte d’Ivoire',
    hours: 'Lundi - Samedi : 08h00 - 18h30 (GMT)',
    escrowPartner: 'Caisse des Dépôts et Consignations (CDC-CI) & Notaires Titulaires',
    stats: {
        listings: '9.4k',
        agents: '1,860',
        approval: '98.7%',
        response: '< 15 min',
    },
    social: {
        facebook: 'https://facebook.com/chichochabitat',
        instagram: 'https://instagram.com/chichochabitat',
        linkedin: 'https://linkedin.com/company/chichoc-habitat',
    },
};

let inMemoryConfig = null;
let fetchPromise = null;

/**
 * Reads cached site config from memory or localStorage.
 */
export function getLocalSiteConfig(initialFallback = null) {
    if (inMemoryConfig) return inMemoryConfig;

    if (typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                inMemoryConfig = { ...DEFAULT_SITE_CONFIG, ...initialFallback, ...JSON.parse(raw) };
                return inMemoryConfig;
            }
        } catch (e) {
            console.warn('Failed to read cached site config:', e);
        }
    }

    inMemoryConfig = { ...DEFAULT_SITE_CONFIG, ...initialFallback };
    return inMemoryConfig;
}

/**
 * Stores updated site config locally and notifies subscribers.
 */
export function saveLocalSiteConfig(newConfig) {
    inMemoryConfig = { ...DEFAULT_SITE_CONFIG, ...(inMemoryConfig || {}), ...newConfig };
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryConfig));
            window.dispatchEvent(new CustomEvent('chichoc:site-config-change', { detail: inMemoryConfig }));
        } catch (e) {
            console.warn('Failed to persist site config in localStorage:', e);
        }
    }
    return inMemoryConfig;
}

/**
 * Service Layer function: Fetches live site configuration from /api/site-config.
 * Deduplicates in-flight requests and handles errors gracefully.
 */
export async function fetchSiteConfig(forceRefresh = false) {
    if (!forceRefresh && inMemoryConfig && fetchPromise === null) {
        return inMemoryConfig;
    }

    if (fetchPromise) {
        return fetchPromise;
    }

    fetchPromise = (async () => {
        try {
            const res = await fetch('/api/site-config', {
                headers: { Accept: 'application/json' },
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch site config: ${res.statusText}`);
            }

            const data = await res.json();
            const merged = saveLocalSiteConfig(data);
            return merged;
        } catch (error) {
            console.warn('Could not fetch /api/site-config, utilizing fallback config:', error);
            return getLocalSiteConfig();
        } finally {
            fetchPromise = null;
        }
    })();

    return fetchPromise;
}

/**
 * Updates site configuration on the backend and updates local store.
 */
export async function updateSiteConfig(updates) {
    const res = await fetch('/api/site-config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(updates),
    });

    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update site configuration');
    }

    const payload = await res.json();
    const updated = payload.site || updates;
    return saveLocalSiteConfig(updated);
}
