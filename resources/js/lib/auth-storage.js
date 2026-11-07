/**
 * LocalStorage Mock Authentication & Role Switcher Engine
 * Supports instant demo accounts, persistent sign-in/up without database requirements,
 * and reactive auth state across the entire application.
 */

export const DEMO_USERS = {
    buyer: {
        id: 1,
        name: 'Koffi Kouamé',
        email: 'kouame@example.com',
        role: 'customer',
        role_label: 'Acheteur Vérifié',
        phone: '+225 07 12 34 56',
        avatar: null,
        initials: 'KK',
        verified: true,
        saved_count: 4,
        credit_status: 'Pre-approved 85M XOF',
    },
    agent: {
        id: 2,
        name: 'Aya Koffi',
        email: 'aya.koffi@habitat.ci',
        role: 'agent',
        role_label: 'Agent Agréé KYC 3',
        phone: '+225 07 00 00 01',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        initials: 'AK',
        verified: true,
        agency: 'Koffi & Co. Immobilier',
        license_number: 'MCLU/CACI #CI-ABJ-2022-88',
        rating: 4.9,
    },
    owner: {
        id: 3,
        name: 'Ibrahim Touré',
        email: 'toure@chichoc.ci',
        role: 'customer',
        role_label: 'Propriétaire Mandant',
        phone: '+225 05 99 88 77',
        avatar: null,
        initials: 'IT',
        verified: true,
        properties_count: 3,
    },
};

const STORAGE_KEY = 'chichoc_auth_user';
const USERS_KEY = 'chichoc_registered_users';

export function getStoredUser(serverUser = null) {
    if (typeof window === 'undefined') return serverUser || DEMO_USERS.buyer;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('Error reading stored auth user:', e);
    }
    // Default fallback to buyer demo account if no user stored
    const defaultUser = serverUser || DEMO_USERS.buyer;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
    } catch (e) {}
    return defaultUser;
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

export function switchDemoUser(roleKey = 'buyer') {
    const selected = DEMO_USERS[roleKey] || DEMO_USERS.buyer;
    setStoredUser(selected);
    return selected;
}

export function mockLogin(email, password) {
    // Check demo users first
    for (const key of Object.keys(DEMO_USERS)) {
        if (DEMO_USERS[key].email.toLowerCase() === email.trim().toLowerCase()) {
            setStoredUser(DEMO_USERS[key]);
            return { success: true, user: DEMO_USERS[key] };
        }
    }

    // Check registered custom users
    let registered = [];
    try {
        const raw = localStorage.getItem(USERS_KEY);
        if (raw) registered = JSON.parse(raw);
    } catch (e) {}

    const found = registered.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (found) {
        setStoredUser(found);
        return { success: true, user: found };
    }

    // Default friendly login if unknown: create mock session
    const initials = email.substring(0, 2).toUpperCase();
    const newUser = {
        id: Date.now(),
        name: email.split('@')[0],
        email,
        role: 'customer',
        role_label: 'Membre Vérifié',
        phone: '+225 07 00 00 00',
        initials,
        verified: true,
    };
    setStoredUser(newUser);
    return { success: true, user: newUser };
}

export function mockRegister(name, email, password, role = 'customer') {
    const initials = name
        ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        : 'CC';

    const newUser = {
        id: Date.now(),
        name,
        email,
        role,
        role_label: role === 'agent' ? 'Agent Partenaire' : 'Acheteur / Locataire',
        phone: '+225 07 00 00 00',
        initials,
        verified: true,
    };

    // Store in registered list
    try {
        let registered = [];
        const raw = localStorage.getItem(USERS_KEY);
        if (raw) registered = JSON.parse(raw);
        registered.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(registered));
    } catch (e) {}

    setStoredUser(newUser);
    return { success: true, user: newUser };
}

export function mockLogout() {
    setStoredUser(null);
}
