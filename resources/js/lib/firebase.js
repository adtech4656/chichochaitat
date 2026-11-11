import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    updateProfile,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';
import { setStoredUser } from './auth-storage';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: 'select_account',
});

/**
 * Format Firebase Auth errors into friendly, localized messages
 */
export function formatFirebaseAuthError(error) {
    if (!error) return 'Une erreur est survenue.';
    const code = error.code || '';

    switch (code) {
        case 'auth/invalid-email':
            return 'Adresse email invalide.';
        case 'auth/user-disabled':
            return 'Ce compte utilisateur a été désactivé.';
        case 'auth/user-not-found':
            return 'Aucun compte trouvé avec cette adresse email.';
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Identifiants incorrects. Veuillez vérifier votre email et mot de passe.';
        case 'auth/email-already-in-use':
            return 'Cette adresse email est déjà utilisée par un autre compte.';
        case 'auth/weak-password':
            return 'Le mot de passe doit comporter au moins 6 caractères.';
        case 'auth/too-many-requests':
            return 'Trop de tentatives infructueuses. Veuillez réessayer dans quelques minutes.';
        case 'auth/popup-closed-by-user':
            return 'La fenêtre de connexion a été fermée.';
        case 'auth/network-request-failed':
            return 'Erreur de connexion réseau. Vérifiez votre accès internet.';
        default:
            return error.message || 'Échec de l’authentification.';
    }
}

/**
 * Sign in with Email and Password via Firebase Auth,
 * syncs with local storage and creates server session.
 */
export async function signInWithFirebase(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const idToken = await userCredential.user.getIdToken();

        const response = await fetch('/auth/firebase-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                idToken,
                email: userCredential.user.email,
                name: userCredential.user.displayName || email.split('@')[0],
                uid: userCredential.user.uid,
            }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Server session synchronization failed');
        }

        const appUser = {
            id: data.user.id || Date.now(),
            name: data.user.name || userCredential.user.displayName || email.split('@')[0],
            email: userCredential.user.email,
            role: data.user.role || 'customer',
            role_label: data.user.role === 'agent' ? 'Agent Agréé' : 'Membre ChiChoc',
            initials: data.user.initials || userCredential.user.email.substring(0, 2).toUpperCase(),
            uid: userCredential.user.uid,
            verified: userCredential.user.emailVerified || true,
            saved_properties: data.user.saved_properties || [],
        };

        setStoredUser(appUser);
        return { success: true, user: appUser, firebaseUser: userCredential.user };
    } catch (err) {
        throw new Error(formatFirebaseAuthError(err));
    }
}

/**
 * Register a new user with Email and Password via Firebase Auth,
 * sets display name, creates server session, and stores profile locally.
 */
export async function registerWithFirebase({ name, email, phone, password }) {
    try {
        const cleanName = (name || '').trim();
        const cleanEmail = (email || '').trim();

        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

        if (cleanName) {
            try {
                await updateProfile(userCredential.user, { displayName: cleanName });
            } catch (e) {
                console.warn('Could not update Firebase displayName', e);
            }
        }

        const idToken = await userCredential.user.getIdToken();

        const response = await fetch('/auth/firebase-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                idToken,
                email: userCredential.user.email,
                name: cleanName || userCredential.user.displayName || cleanEmail.split('@')[0],
                phone: phone || '',
                uid: userCredential.user.uid,
            }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Registration failed to sync with server');
        }

        const appUser = {
            id: data.user.id || Date.now(),
            name: cleanName || userCredential.user.displayName || cleanEmail.split('@')[0],
            email: userCredential.user.email,
            phone: phone || '',
            role: data.user.role || 'customer',
            role_label: 'Membre ChiChoc',
            initials: cleanName
                ? cleanName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
                : cleanEmail.substring(0, 2).toUpperCase(),
            uid: userCredential.user.uid,
            verified: true,
            saved_properties: [],
        };

        setStoredUser(appUser);
        return { success: true, user: appUser, firebaseUser: userCredential.user };
    } catch (err) {
        throw new Error(formatFirebaseAuthError(err));
    }
}

/**
 * Send password reset email via Firebase Auth.
 */
export async function resetPasswordWithFirebase(email) {
    const cleanEmail = (email || '').trim();
    if (!cleanEmail) {
        throw new Error('Veuillez saisir votre adresse email pour recevoir le lien de réinitialisation.');
    }

    try {
        await sendPasswordResetEmail(auth, cleanEmail);
        return {
            success: true,
            message: 'Un lien de réinitialisation a été envoyé à votre adresse email.',
        };
    } catch (err) {
        throw new Error(formatFirebaseAuthError(err));
    }
}

/**
 * Sign in with Google Popup via Firebase Auth,
 * then establish the server-side HttpOnly session.
 */
export async function signInWithGoogle() {
    try {
        const userCredential = await signInWithPopup(auth, googleProvider);
        const idToken = await userCredential.user.getIdToken();

        const response = await fetch('/auth/firebase-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                idToken,
                email: userCredential.user.email,
                name: userCredential.user.displayName || 'Google User',
                photoURL: userCredential.user.photoURL,
                uid: userCredential.user.uid,
            }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Google login session synchronization failed');
        }

        const appUser = {
            id: data.user.id || Date.now(),
            name: data.user.name || userCredential.user.displayName || 'Google User',
            email: userCredential.user.email,
            role: data.user.role || 'customer',
            role_label: data.user.role === 'agent' ? 'Agent Agréé' : 'Membre ChiChoc',
            initials: (userCredential.user.displayName || 'GU').substring(0, 2).toUpperCase(),
            uid: userCredential.user.uid,
            avatar: userCredential.user.photoURL,
            verified: true,
            saved_properties: data.user.saved_properties || [],
        };

        setStoredUser(appUser);
        return { success: true, user: appUser, firebaseUser: userCredential.user };
    } catch (err) {
        throw new Error(formatFirebaseAuthError(err));
    }
}

/**
 * Sign out from Firebase Auth and clear server-side session.
 */
export async function signOutFromFirebase() {
    try {
        await signOut(auth);
    } catch (e) {
        console.warn('Firebase signout error', e);
    }

    setStoredUser(null);

    await fetch('/logout', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
        },
    }).catch(() => {});
}

/**
 * Listen to auth state changes to keep application in sync.
 */
export function onFirebaseAuthStateChange(callback) {
    return onAuthStateChanged(auth, (firebaseUser) => {
        callback(firebaseUser);
    });
}
