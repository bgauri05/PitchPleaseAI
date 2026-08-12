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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = profile?.business_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = user?.email || '';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    { path: '/app', label: 'Dashboard', icon: Home },
    { path: '/app/generate', label: 'Generate Content', icon: Sparkles },
    { path: '/app/planner', label: 'Weekly Planner', icon: Calendar },
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
    const breadcrumbs = [{ label: 'Home', path: '/app' }];
    
    if (paths.length > 1) {
      const currentPath = paths[paths.length - 1];
      const item = navItems.find(nav => nav.path.endsWith(currentPath));
      if (item) {
        breadcrumbs.push({ label: item.label, path: item.path });
      }
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const showBackButton = location.pathname !== '/app';

  return (
    <div className="min-h-screen flex bg-[#fef8f4] text-[#1d1b19]">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed lg:sticky top-0 left-0 h-screen w-64 bg-white/90 backdrop-blur-md border-r border-[#e4beb7]/40 flex flex-col z-50 lg:translate-x-0 transition-transform shadow-[0_8px_32px_rgba(18,17,15,0.06)]"
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-[#e6e2de] flex items-center justify-between">
          <Logo size="md" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#5b403c] hover:text-[#1d1b19] p-2 hover:bg-[#f8f3ef] rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <motion.div
                  key={item.path}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden group text-sm font-medium ${
                      active
                        ? 'text-white'
                        : 'text-[#5b403c] hover:text-[#1d1b19]'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-[#b51d0d] rounded-xl shadow-sm"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    {!active && (
                      <div className="absolute inset-0 bg-[#f8f3ef] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    <Icon className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 pt-8 border-t border-[#e6e2de] space-y-1.5">
            <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/app/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#5b403c] hover:text-[#1d1b19] hover:bg-[#f8f3ef] transition-all"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            </motion.div>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[#e6e2de]">
          <motion.div 
            className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f3ef] border border-[#e4beb7]/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 bg-[#b51d0d] rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1d1b19] truncate">{displayName}</p>
              <p className="text-xs text-[#5b403c] truncate">{email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-[#5b403c] hover:text-[#b51d0d] hover:bg-white rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#e4beb7]/40 px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[#5b403c] hover:text-[#1d1b19] p-2 hover:bg-[#f8f3ef] rounded-xl transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-[#5b403c]">
              {showBackButton && (
                <button
                  onClick={() => navigate(-1)}
                  className="mr-2 p-1 text-[#5b403c] hover:text-[#1d1b19] hover:bg-[#f8f3ef] rounded-lg transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-[#e4beb7]" />}
                  <Link
                    to={crumb.path}
                    className={`hover:text-[#1d1b19] transition-colors ${
                      index === breadcrumbs.length - 1 ? 'font-semibold text-[#1d1b19]' : ''
                    }`}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-[#5b403c] hover:text-[#1d1b19] hover:bg-[#f8f3ef] rounded-xl transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#b51d0d] rounded-full" />
            </button>
            <div className="w-8 h-8 bg-[#b51d0d] rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}