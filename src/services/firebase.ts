import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { UserProfile } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const SESSION_TOKEN_KEY = 'gs_oauth_access_token_v1';

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Sheets readonly scope
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let cachedAccessToken: string | null = (() => {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
})();

export const mapFirebaseUser = (firebaseUser: User): UserProfile => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    role: 'user',
  };
};

/**
 * Initializes auth listener for persistent Firebase sign-in state
 */
export const initAuth = (
  onAuthSuccess?: (user: UserProfile, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const profile = mapFirebaseUser(firebaseUser);
      if (onAuthSuccess) {
        onAuthSuccess(profile, cachedAccessToken);
      }
    } else {
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });

  return unsubscribe;
};

/**
 * Initiates Google Sign-In with Firebase Popup and obtains Google Sheets access token
 */
export const googleSignIn = async (): Promise<{
  user: UserProfile;
  accessToken: string;
} | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || '';

    if (token) {
      cachedAccessToken = token;
      try {
        sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      } catch (err) {
        console.warn('Unable to write to sessionStorage:', err);
      }
    }

    const profile = mapFirebaseUser(result.user);
    return {
      user: profile,
      accessToken: token,
    };
  } catch (error: any) {
    console.error('Firebase Google Sign-In Error:', error);
    throw error;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setManualAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
};

export const logout = async (): Promise<void> => {
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // ignore
  }
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('SignOut warning:', err);
  }
};

