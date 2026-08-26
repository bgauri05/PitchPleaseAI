import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://sjvrdlljuolezzoyyqsq.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder';

// WHAT: authentication moved to Firebase (see ./firebase.ts, AuthContext.tsx)
// — Supabase is still used for every table (businesses, brand_memory,
// scheduled_posts, generated_content) and now trusts Firebase's ID token
// instead of its own auth session, via Supabase's "Third-Party Auth"
// integration (must be configured in the Supabase dashboard — see
// FIREBASE_AUTH_MIGRATION.md). The `accessToken` callback runs on every
// request this client makes; returning `null` when signed out sends the
// request as the anon role, same as before.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => {
    return (await auth.currentUser?.getIdToken(false)) ?? null;
  },
});
