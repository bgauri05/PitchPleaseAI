/**
 * Firebase client — authentication only.
 * ---------------------------------------
 * WHAT: Initializes the Firebase app and exports its Auth instance. This is
 * now the ONLY thing handling sign-up/sign-in/session state — Supabase
 * (see ./supabase.ts) is still used for everything else (businesses,
 * brand_memory, scheduled_posts, generated_content), configured to trust
 * the Firebase ID token via Supabase's Third-Party Auth integration.
 *
 * SETUP REQUIRED (see FIREBASE_AUTH_MIGRATION.md):
 *   1. Create/select a project at https://console.firebase.google.com
 *   2. Authentication → Sign-in method → enable Email/Password (and Google,
 *      if you want "Continue with Google" to keep working).
 *   3. Project settings → General → "Your apps" → add a Web app → copy the
 *      config values below into Frontend/.env.local as VITE_FIREBASE_*.
 *   4. In Supabase: Authentication → Sign In / Providers → Third-Party Auth
 *      → add Firebase, using this same Firebase Project ID.
 *
 * These VITE_FIREBASE_* values are NOT secret — Firebase's web config is
 * safe to ship in client-side code by design (same as VITE_SUPABASE_ANON_KEY).
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Guard against re-initializing on Vite HMR (initializeApp throws if called
// twice for the same app).
const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
