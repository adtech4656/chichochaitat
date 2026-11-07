import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: 'select_account',
});

/**
 * Sign in with Email and Password via Firebase Auth,
 * then exchange the Firebase ID token for a secure server-side HttpOnly session.
 */
export async function signInWithFirebase(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
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

    return { user: data.user, firebaseUser: userCredential.user };
}

/**
 * Register a new user with Email and Password via Firebase Auth,
 * update the profile name, and sync the server-side HttpOnly session.
 */
export async function registerWithFirebase({ name, email, phone, password }) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    if (name) {
        try {
            await updateProfile(userCredential.user, { displayName: name });
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
            name: name || userCredential.user.displayName || email.split('@')[0],
            phone: phone || '',
            uid: userCredential.user.uid,
        }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed to sync with server');
    }

    return { user: data.user, firebaseUser: userCredential.user };
}

/**
 * Sign in with Google Popup via Firebase Auth,
 * then establish the server-side HttpOnly session.
 */
export async function signInWithGoogle() {
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

    return { user: data.user, firebaseUser: userCredential.user };
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

    await fetch('/logout', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
        },
    });
}
