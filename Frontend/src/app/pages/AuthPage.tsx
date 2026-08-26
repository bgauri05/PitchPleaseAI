import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, User, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router';
import { Logo } from '../components/Logo';
import { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL as string;
const API_KEY = import.meta.env.VITE_API_KEY as string;

// WHAT: Firebase custom claims (needed for Supabase's RLS policies to
// recognize this user as `authenticated`) can only be set server-side with
// the Firebase Admin SDK — a browser can never set its own claims. This
// calls the new backend endpoint right after signup; it verifies the
// caller's own fresh ID token and stamps `role: authenticated` on that
// same uid. See backend/app/api/v1/endpoints/auth.py.
async function grantAuthenticatedClaim(idToken: string): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/set-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        Authorization: `Bearer ${idToken}`,
      },
    });
  } catch {
    // Best-effort — if this fails, Supabase requests will still work as
    // the `anon` role until the user logs in again on a working connection.
  }
}

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const { user, profile, isLoading: authLoading } = useAuth();
  const modeParam = searchParams.get('mode');
  const brandName = searchParams.get('brand_name') || searchParams.get('business_name') || '';

  const [isSignUp, setIsSignUp] = useState(modeParam === 'signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (modeParam === 'signup') {
      setIsSignUp(true);
    } else if (modeParam === 'login') {
      setIsSignUp(false);
    }
  }, [modeParam]);

  if (!authLoading && user) {
    const setupPath = brandName ? `/setup?business_name=${encodeURIComponent(brandName)}` : '/setup';
    return <Navigate to={profile?.is_setup_complete ? '/app' : setupPath} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsRateLimited(false);
    setIsLoading(true);
    try {
      if (isSignUp) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName) {
          await updateProfile(credential.user, { displayName: fullName });
        }
        // Firebase (unlike Supabase's default config) does NOT require email
        // verification before the user is signed in — this is what actually
        // removes the "email rate limit exceeded" blocker from before, since
        // there's no confirmation email standing between signup and use.
        const idToken = await credential.user.getIdToken();
        await grantAuthenticatedClaim(idToken);
        // Force a token refresh so the just-granted `role: authenticated`
        // claim is present on the NEXT request Supabase makes — otherwise
        // the stale cached token (with no claim) would get treated as
        // unauthenticated by RLS until the natural ~1hr refresh.
        await credential.user.getIdToken(true);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/email-already-in-use') {
        setIsRateLimited(true); // reuses the existing "switch to Log In" banner UI
        setError('An account with this email already exists. Click "Log In" below.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Account not found or wrong password.');
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await credential.user.getIdToken();
      await grantAuthenticatedClaim(idToken);
      await credential.user.getIdToken(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled in your Firebase project settings. Please sign up/in with email.');
      } else if (code === 'auth/popup-closed-by-user') {
        // User cancelled — not an error worth showing.
      } else {
        setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F1] flex flex-col antialiased text-[#111111] selection:bg-[#0A0A0A] selection:text-white">
      {/* Header */}
      <header className="sticky top-0 w-full z-50 flex justify-center items-center px-6 py-4 h-16 bg-transparent">
        <Link to="/">
          <Logo size="md" />
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Radial Dots Pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #111111 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_8px_24px_rgba(18,17,15,0.08)] hover:shadow-[0_12px_32px_rgba(18,17,15,0.12)] transition-all duration-300 p-8 md:p-12 relative z-10 flex flex-col gap-6 border border-[#DBDBD8]"
        >
          {/* Header text */}
          <div className="text-center flex flex-col gap-1">
            <h1 className="font-headline text-3xl font-bold text-[#111111]">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="font-body text-[#4A4A46] text-sm">
              {isSignUp ? 'Join PitchPleaseAI today.' : 'Sign in to continue to PitchPleaseAI.'}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="relative flex w-full border-b border-[#DBDBD8]">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors relative z-10 ${
                !isSignUp ? 'text-[#0A0A0A]' : 'text-[#4A4A46] hover:text-[#111111]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors relative z-10 ${
                isSignUp ? 'text-[#0A0A0A]' : 'text-[#4A4A46] hover:text-[#111111]'
              }`}
            >
              Sign Up
            </button>
            <div
              className={`absolute bottom-[-1px] left-0 w-1/2 h-[2px] bg-[#0A0A0A] transition-transform duration-300 ease-in-out ${
                isSignUp ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-[#FFE7DE] border border-[#E4573A]/30 rounded-xl text-[#E4573A] text-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
              {isRateLimited && (
                <div className="flex items-center gap-2 pt-1.5 border-t border-[#E4573A]/20">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError(null);
                      setIsRateLimited(false);
                    }}
                    className="text-xs font-bold text-[#0A0A0A] bg-white px-3 py-1.5 rounded-lg border border-[#0A0A0A]/30 hover:bg-[#F4F4F1] transition-colors cursor-pointer"
                  >
                    Switch to Log In Tab
                  </button>
                  <Link
                    to={brandName ? `/setup?business_name=${encodeURIComponent(brandName)}` : '/setup'}
                    className="text-xs font-medium text-[#4A4A46] underline hover:text-[#111111]"
                  >
                    Skip to Setup
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#111111]">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A4A46]/60 w-4 h-4" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-[#F4F4F1] rounded-xl pl-10 pr-4 py-3 text-sm text-[#111111] placeholder:text-[#4A4A46]/50 focus:border-[#111111] focus:ring-1 focus:ring-[#111111] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111111]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A4A46]/60 w-4 h-4" />
                <input
                  type="email"
                  required
                  placeholder="hello@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#F4F4F1] rounded-xl pl-10 pr-4 py-3 text-sm text-[#111111] placeholder:text-[#4A4A46]/50 focus:border-[#111111] focus:ring-1 focus:ring-[#111111] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[#111111]">Password</label>
                {!isSignUp && (
                  <a href="#" className="text-xs text-[#0A0A0A] font-medium hover:underline">
                    Forgot?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A4A46]/60 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#F4F4F1] rounded-xl pl-10 pr-10 py-3 text-sm text-[#111111] placeholder:text-[#4A4A46]/50 focus:border-[#111111] focus:ring-1 focus:ring-[#111111] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A4A46]/60 hover:text-[#111111] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full bg-[#0A0A0A] hover:bg-[#262626] active:scale-[0.98] text-white font-medium text-sm py-3.5 rounded-xl transition-all duration-150 mt-2 flex justify-center items-center gap-2 group shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Log In'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 text-[#4A4A46] text-xs font-medium before:h-px before:flex-1 before:bg-[#DBDBD8] after:h-px after:flex-1 after:bg-[#DBDBD8]">
            or continue with
          </div>

          {/* Social Auth - Google Button */}
          <button
            type="button"
            disabled={isGoogleLoading || isLoading}
            onClick={handleGoogleSignIn}
            className="w-full bg-transparent border-[1.5px] border-[#111111] text-[#111111] font-medium text-sm py-3.5 rounded-xl hover:bg-[#F4F4F1] active:scale-[0.98] transition-all duration-150 flex justify-center items-center gap-3 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#111111]" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
                  <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.58C14.73 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.7 5.84 14.09H2.15V16.94C3.96 20.54 7.68 23 12 23Z" fill="#34A853" />
                  <path d="M5.84 14.09C5.62 13.44 5.5 12.74 5.5 12C5.5 11.26 5.62 10.56 5.84 9.91V7.06H2.15C1.41 8.54 1 10.22 1 12C1 13.78 1.41 15.46 2.15 16.94L5.84 14.09Z" fill="#FBBC05" />
                  <path d="M12 5.36C13.62 5.36 15.07 5.92 16.21 7.01L19.36 3.86C17.45 2.08 14.97 1 12 1C7.68 1 3.96 3.46 2.15 7.06L5.84 9.91C6.7 7.3 9.13 5.36 12 5.36Z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
