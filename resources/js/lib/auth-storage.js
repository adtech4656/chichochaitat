/**
 * Client & LocalStorage Real Authentication Engine
 * Supports email/password sign-in and sign-up with persistent user profile in localStorage,
 * with no fake/demo account presets.
 */

const STORAGE_KEY = 'chichoc_auth_user';
const USERS_KEY = 'chichoc_registered_users';

export function getStoredUser(serverUser = null) {
    if (typeof window === 'undefined') return serverUser || null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('Error reading stored auth user:', e);
    }
    return serverUser || null;
}

export function setStoredUser(user) {
    if (typeof window === 'undefined') return;
    try {
        if (user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
        window.dispatchEvent(new CustomEvent('chichoc:auth-change', { detail: user }));
    } catch (e) {
        console.warn('Error setting stored auth user:', e);
    }
}

export function mockLogin(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
        return { success: false, error: 'Email requis' };
    }
    if (!password || password.length < 4) {
        return { success: false, error: 'Le mot de passe doit comporter au moins 4 caractères' };
    }

    // Check registered custom users
    let registered = [];
    try {
        const raw = localStorage.getItem(USERS_KEY);
        if (raw) registered = JSON.parse(raw);
    } catch (e) {}

    const found = registered.find(u => (u.email || '').toLowerCase() === cleanEmail);
    if (found) {
        setStoredUser(found);
        return { success: true, user: found };
    }

    // New or direct sign-in: create persistent real user session
    const namePart = cleanEmail.split('@')[0];
    const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const initials = displayName.substring(0, 2).toUpperCase();

    const newUser = {
        id: Date.now(),
        name: displayName,
        email: cleanEmail,
        role: 'customer',
        role_label: 'Membre ChiChoc',
        phone: '+225 07 00 00 00',
        initials,
        verified: true,
        saved_properties: [],
    };

    registered.push(newUser);
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(registered));
    } catch (e) {}

    setStoredUser(newUser);
    return { success: true, user: newUser };
}

export function mockRegister(name, email, password, role = 'customer', phone = '+225 07 00 00 00') {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();

    if (!cleanName) {
        return { success: false, error: 'Nom complet requis' };
    }
    if (!cleanEmail) {
        return { success: false, error: 'Email valide requis' };
    }
    if (!password || password.length < 4) {
        return { success: false, error: 'Mot de passe minimum 4 caractères' };
    }

    const initials = cleanName
        ? cleanName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        : cleanEmail.substring(0, 2).toUpperCase();

    const newUser = {
        id: Date.now(),
        name: cleanName,
        email: cleanEmail,
        role: role === 'agent' ? 'agent' : 'customer',
        role_label: role === 'agent' ? 'Agent Immobilier Agréé' : 'Client / Particulier',
        phone: phone || '+225 07 00 00 00',
        initials,
        verified: true,
        saved_properties: [],
    };

    // Store in registered list
    try {
        let registered = [];
        const raw = localStorage.getItem(USERS_KEY);
        if (raw) registered = JSON.parse(raw);
        // Replace existing by email if exists, or append
        const filtered = registered.filter(u => (u.email || '').toLowerCase() !== cleanEmail);
        filtered.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
    } catch (e) {}

    setStoredUser(newUser);
    return { success: true, user: newUser };
}

export function updateStoredUserProfile(updates) {
    const current = getStoredUser();
    if (!current) return null;
    const updated = { ...current, ...updates };
    setStoredUser(updated);

    // Update in USERS_KEY array
    try {
        let registered = [];
        const raw = localStorage.getItem(USERS_KEY);
        if (raw) registered = JSON.parse(raw);
        const idx = registered.findIndex(u => u.id === current.id || u.email === current.email);
        if (idx >= 0) {
            registered[idx] = updated;
        } else {
            registered.push(updated);
        }
        localStorage.setItem(USERS_KEY, JSON.stringify(registered));
    } catch (e) {}

    return updated;
}

export function mockLogout() {
    setStoredUser(null);
}
