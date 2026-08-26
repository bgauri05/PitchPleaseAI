import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Home, Sparkles, Calendar, PartyPopper, FolderOpen, Send, Settings, LogOut, Menu, X, Bell, ArrowLeft, ChevronRight } from 'lucide-react';
import { Logo } from './Logo';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = profile?.business_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'My Business';
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = user?.email || '';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    { path: '/app', label: 'Dashboard', icon: Home },
    { path: '/app/generate', label: 'Content Generator', icon: Sparkles },
    { path: '/app/planner', label: 'Weekly Scheduler', icon: Calendar },
    { path: '/app/festivals', label: 'Festival Ideas', icon: PartyPopper },
    { path: '/app/library', label: 'Content Library', icon: FolderOpen },
    { path: '/app/scheduled', label: 'Scheduled Posts', icon: Send },
  ];

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname.startsWith(path);
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', path: '/app' }];

    if (paths.length > 1) {
      const currentPath = paths[paths.length - 1];
      const item = navItems.find(nav => nav.path.endsWith(currentPath));
      if (item) {
        breadcrumbs.push({ label: item.label, path: item.path });
      } else if (currentPath === 'settings') {
        breadcrumbs.push({ label: 'Brand Settings', path: '/app/settings' });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const showBackButton = location.pathname !== '/app';

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F1] text-[#111111] font-body w-full">
      {/* Top Header / Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DBDBD8]/40 px-6 py-4 flex items-center justify-between shadow-xs w-full gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <Logo size="md" />
        </div>

        {/* Nav Links (desktop/tablet) */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F4F4F1] p-1 rounded-2xl border border-[#DBDBD8]/60 overflow-x-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#0A0A0A] text-white shadow-xs'
                    : 'text-[#4A4A46] hover:text-[#111111] hover:bg-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Account Menu / Notification */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/app/scheduled')}
            className="p-2 text-[#4A4A46] hover:text-[#111111] hover:bg-[#F4F4F1] rounded-xl transition-all relative hidden sm:inline-flex"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0A0A0A] rounded-full" />
          </button>

          <Link
            to="/app/settings"
            className="hidden sm:flex items-center gap-2 p-1.5 pr-3 hover:bg-[#F4F4F1] rounded-full transition-all border border-[#DBDBD8]/40"
          >
            <div className="w-7 h-7 bg-[#0A0A0A] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {initials}
            </div>
            <span className="text-xs font-bold text-[#111111] hidden lg:inline">{displayName}</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="md:hidden text-[#4A4A46] hover:text-[#111111] p-2 hover:bg-[#F4F4F1] rounded-xl transition-all"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-md border-b border-[#DBDBD8]/40 w-full"
          >
            <div className="p-4 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#0A0A0A] text-white font-semibold'
                        : 'text-[#4A4A46] hover:text-[#111111] hover:bg-[#F4F4F1]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <Link
                to="/app/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive('/app/settings')
                    ? 'bg-[#0A0A0A] text-white font-semibold'
                    : 'text-[#4A4A46] hover:text-[#111111] hover:bg-[#F4F4F1]'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Brand Settings</span>
              </Link>
            </div>

            <div className="p-4 border-t border-[#DBDBD8]">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F4F4F1] border border-[#DBDBD8]/30">
                <div className="w-10 h-10 bg-[#0A0A0A] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111111] truncate">{displayName}</p>
                  <p className="text-xs text-[#4A4A46] truncate">{email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-[#4A4A46] hover:text-[#0A0A0A] hover:bg-white rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Breadcrumb bar */}
      <div className="w-full px-6 md:px-8 pt-4 flex items-center gap-2 text-sm text-[#4A4A46]">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="mr-1 p-1 text-[#4A4A46] hover:text-[#111111] hover:bg-[#F4F4F1] rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 text-[#DBDBD8]" />}
            <Link
              to={crumb.path}
              className={`hover:text-[#0A0A0A] transition-colors ${
                index === breadcrumbs.length - 1 ? 'font-bold text-[#111111]' : ''
              }`}
            >
              {crumb.label}
            </Link>
          </div>
        ))}
      </div>

      {/* Page Content */}
      <main className="flex-1 w-full p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
