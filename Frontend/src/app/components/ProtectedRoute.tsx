import { Navigate, Outlet } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// WHAT: Previously this only checked `localStorage.getItem('business_id')`
//       — meaning /app was reachable by anyone who had *any* business_id
//       sitting in localStorage, real login or not. Meanwhile
//       Frontend/src/lib/content.ts already gates saving generated
//       content and the weekly plan behind `supabase.auth.getUser()` via
//       Row Level Security, so an unauthenticated visitor could reach the
//       whole dashboard while every save silently no-op'd. This makes the
//       route guard match what the rest of the app already assumes: a
//       real, logged-in Supabase session.
// HOW:  `useAuth()` (Frontend/src/contexts/AuthContext.tsx) tracks the
//       Supabase session. While it's still resolving on first load, we
//       show a spinner rather than redirecting — bouncing straight to
//       /auth before the session check finishes would log out anyone with
//       a valid, persisted session on every hard refresh.
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const businessId = localStorage.getItem('business_id');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F4F1]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!businessId) return <Navigate to="/setup" replace />;

  return <Outlet />;
}
