/**
 * Firebase SDK initialization for StoryForge frontend.
 * Handles Firebase Auth (Google Sign-In) and token management.
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD4ILtaB9E9Um4sa0IS_aEfZ4IUNODbkKw",
  authDomain: "storyforgegeminilive.firebaseapp.com",
  projectId: "storyforgegeminilive",
  storageBucket: "storyforgegeminilive.firebasestorage.app",
  messagingSenderId: "289406789692",
  appId: "1:289406789692:web:629bd6a2f36029b3a5bb39",
  measurementId: "G-EH6B6DPZTD",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google popup.
 * @returns The Firebase User object.
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Get the current user's ID token for API authentication.
 * @returns The JWT token string, or null if not signed in.
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/**
 * Subscribe to auth state changes.
 * @param callback Called with the User object (or null on sign-out).
 * @returns Unsubscribe function.
 */
export function onAuthStateChanged(
  callback: (user: User | null) => void
): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}

export type { User };
