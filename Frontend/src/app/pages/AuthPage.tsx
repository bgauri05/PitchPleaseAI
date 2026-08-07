import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, User, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link, Navigate } from 'react-router';
import { Logo } from '../components/Logo';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function AuthPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!authLoading && user) {
    return <Navigate to={profile?.is_setup_complete ? '/app' : '/setup'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            setError('Account not found or wrong password.');
          } else {
            setError(error.message);
          }
          return;
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app' },
    });
  };

  return (
    <div className="min-h-screen bg-[#fef8f4] flex flex-col antialiased text-[#1d1b19] selection:bg-[#b51d0d] selection:text-white">
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
            backgroundImage: 'radial-gradient(circle at 2px 2px, #1d1b19 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_8px_24px_rgba(18,17,15,0.08)] hover:shadow-[0_12px_32px_rgba(18,17,15,0.12)] transition-all duration-300 p-8 md:p-12 relative z-10 flex flex-col gap-6 border border-[#ece7e3]"
        >
          {/* Header text */}
          <div className="text-center flex flex-col gap-1">
            <h1 className="font-headline text-3xl font-bold text-[#1d1b19]">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="font-body text-[#5b403c] text-sm">
              {isSignUp ? 'Join PitchPleaseAI today.' : 'Sign in to continue to PitchPleaseAI.'}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="relative flex w-full border-b border-[#e6e2de]">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors relative z-10 ${
                !isSignUp ? 'text-[#b51d0d]' : 'text-[#5b403c] hover:text-[#1d1b19]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors relative z-10 ${
                isSignUp ? 'text-[#b51d0d]' : 'text-[#5b403c] hover:text-[#1d1b19]'
              }`}
            >
              Sign Up
            </button>
            <div
              className={`absolute bottom-[-1px] left-0 w-1/2 h-[2px] bg-[#b51d0d] transition-transform duration-300 ease-in-out ${
                isSignUp ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl text-[#93000a] text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1d1b19]">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b403c]/60 w-4 h-4" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-[#E5E0D5] rounded-xl pl-10 pr-4 py-3 text-sm text-[#1d1b19] placeholder:text-[#5b403c]/50 focus:border-[#1d1b19] focus:ring-1 focus:ring-[#1d1b19] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1d1b19]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b403c]/60 w-4 h-4" />
                <input
                  type="email"
                  required
                  placeholder="hello@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#E5E0D5] rounded-xl pl-10 pr-4 py-3 text-sm text-[#1d1b19] placeholder:text-[#5b403c]/50 focus:border-[#1d1b19] focus:ring-1 focus:ring-[#1d1b19] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[#1d1b19]">Password</label>
                {!isSignUp && (
                  <a href="#" className="text-xs text-[#b51d0d] font-medium hover:underline">
                    Forgot?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b403c]/60 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#E5E0D5] rounded-xl pl-10 pr-10 py-3 text-sm text-[#1d1b19] placeholder:text-[#5b403c]/50 focus:border-[#1d1b19] focus:ring-1 focus:ring-[#1d1b19] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5b403c]/60 hover:text-[#1d1b19] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#b51d0d] hover:bg-[#d83824] active:scale-[0.98] text-white font-medium text-sm py-3.5 rounded-xl transition-all duration-150 mt-2 flex justify-center items-center gap-2 group shadow-sm disabled:opacity-50"
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
          <div className="flex items-center gap-4 text-[#5b403c] text-xs font-medium before:h-px before:flex-1 before:bg-[#e6e2de] after:h-px after:flex-1 after:bg-[#e6e2de]">
            or continue with
          </div>

          {/* Social Auth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full bg-transparent border-[1.5px] border-[#1d1b19] text-[#1d1b19] font-medium text-sm py-3.5 rounded-xl hover:bg-[#f8f3ef] active:scale-[0.98] transition-all duration-150 flex justify-center items-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
              <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.58C14.73 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.7 5.84 14.09H2.15V16.94C3.96 20.54 7.68 23 12 23Z" fill="#34A853" />
              <path d="M5.84 14.09C5.62 13.44 5.5 12.74 5.5 12C5.5 11.26 5.62 10.56 5.84 9.91V7.06H2.15C1.41 8.54 1 10.22 1 12C1 13.78 1.41 15.46 2.15 16.94L5.84 14.09Z" fill="#FBBC05" />
              <path d="M12 5.36C13.62 5.36 15.07 5.92 16.21 7.01L19.36 3.86C17.45 2.08 14.97 1 12 1C7.68 1 3.96 3.46 2.15 7.06L5.84 9.91C6.7 7.3 9.13 5.36 12 5.36Z" fill="#EA4335" />
            </svg>
            <span>Google</span>
          </button>
        </motion.div>
      </main>
    </div>
  );
}
