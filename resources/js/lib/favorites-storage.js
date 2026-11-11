/**
 * Client-Side LocalStorage Favorites & Wishlist Engine
 * Persists favorite properties locally without requiring authentication,
 * syncs with browser cookies for server compatibility,
 * and broadcasts reactive updates via 'chichoc:favorites-change'.
 */

const STORAGE_KEY = 'chichoc_favorite_ids';
const DEFAULT_FAVORITES = [1, 4]; // Initial curated sample properties

function getCookie(name) {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function updateGuestCookie(ids) {
    if (typeof document === 'undefined') return;
    try {
        const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toUTCString();
        document.cookie = `cch_guest_wishlist=${encodeURIComponent(JSON.stringify(ids))}; expires=${expires}; path=/; SameSite=Lax`;
    } catch (e) {
        console.warn('Could not set guest wishlist cookie:', e);
    }
}

export function getStoredFavorites() {
    if (typeof window === 'undefined') return DEFAULT_FAVORITES;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.map((id) => Number(id)).filter((id) => !isNaN(id));
            }
        }

        // Fallback to cookie if present
        const cookieRaw = getCookie('cch_guest_wishlist');
        if (cookieRaw) {
            const parsedCookie = JSON.parse(cookieRaw);
            if (Array.isArray(parsedCookie)) {
                const ids = parsedCookie.map((id) => Number(id)).filter((id) => !isNaN(id));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
                return ids;
            }
        }

        // Initialize with default demo favorites
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FAVORITES));
        updateGuestCookie(DEFAULT_FAVORITES);
        return DEFAULT_FAVORITES;
    } catch (e) {
        console.warn('Error reading stored favorites:', e);
        return DEFAULT_FAVORITES;
    }
}

export function isPropertyFavorite(propertyId) {
    if (!propertyId) return false;
    const favorites = getStoredFavorites();
    return favorites.includes(Number(propertyId));
}

export function getFavoritesCount() {
    return getStoredFavorites().length;
}

export function toggleStoredFavorite(propertyId) {
    if (typeof window === 'undefined' || !propertyId) return { isFavorite: false, count: 0 };
    const numId = Number(propertyId);
    const current = getStoredFavorites();
    const index = current.indexOf(numId);
    let updated;
    let isFavorite;

    if (index >= 0) {
        updated = current.filter((id) => id !== numId);
        isFavorite = false;
    } else {
        updated = [...current, numId];
        isFavorite = true;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        updateGuestCookie(updated);
    } catch (e) {
        console.warn('Error writing stored favorites:', e);
    }

    // Broadcast reactive event across all components in the page
    window.dispatchEvent(
        new CustomEvent('chichoc:favorites-change', {
            detail: {
                id: numId,
                isFavorite,
                favorites: updated,
                count: updated.length,
            },
        })
    );

    // Optimistic background sync with server route
    try {
        fetch(`/properties/${numId}/save`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        }).catch(() => {});
    } catch (_) {}

    return { isFavorite, count: updated.length, favorites: updated };
}

export function setStoredFavorites(ids) {
    if (typeof window === 'undefined') return;
    const cleanIds = (ids || []).map((id) => Number(id)).filter((id) => !isNaN(id));
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanIds));
        updateGuestCookie(cleanIds);
    } catch (e) {}

    window.dispatchEvent(
        new CustomEvent('chichoc:favorites-change', {
            detail: {
                favorites: cleanIds,
                count: cleanIds.length,
            },
        })
    );
}
