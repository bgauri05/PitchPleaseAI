import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { getInstagramConnectUrl } from '@/lib/scheduling';

export function Settings() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // WHAT: "Connected Accounts" used to be a dead button — this is what
  // actually kicks off the Instagram OAuth flow (instagram.py's
  // /connect route), same destination as the dedicated card on the
  // Scheduled Posts page.
  const handleItemClick = (label: string) => {
    if (label === 'Connected Accounts') {
      const businessId = localStorage.getItem('business_id');
      if (!businessId) {
        navigate('/setup');
        return;
      }
      window.location.href = getInstagramConnectUrl(businessId);
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { label: 'Profile Information', desc: 'Update your personal details' },
        { label: 'Email & Password', desc: 'Manage your login credentials' },
        { label: 'Connected Accounts', desc: 'Link social media accounts' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Notifications', desc: 'Configure email and push notifications' },
        { label: 'Language & Region', desc: 'Set your preferred language' },
        { label: 'Content Defaults', desc: 'Set default platforms and tone' },
      ],
    },
    {
      title: 'Business',
      items: [
        { label: 'Business Profile', desc: 'Update your business information' },
        { label: 'Brand Voice', desc: 'Adjust your brand tone settings' },
        { label: 'Target Audience', desc: 'Refine your audience details' },
      ],
    },
    {
      title: 'Security & Privacy',
      items: [
        { label: 'Privacy Settings', desc: 'Control your data and privacy' },
        { label: 'Two-Factor Authentication', desc: 'Add extra security' },
        { label: 'Sessions', desc: 'Manage active sessions' },
      ],
    },
    {
      title: 'Billing',
      items: [
        { label: 'Subscription Plan', desc: 'View and manage your plan' },
        { label: 'Payment Methods', desc: 'Update payment information' },
        { label: 'Billing History', desc: 'View past invoices' },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Help Center', desc: 'Find answers to common questions' },
        { label: 'Contact Support', desc: 'Get help from our team' },
        { label: 'Feature Requests', desc: 'Suggest new features' },
      ],
    },
  ];

  // Flatten to a running 01, 02, 03... index across all groups, matching
  // the numbered-row treatment used everywhere else in the bold system.
  let runningIndex = 0;

  return (
    <div className="-m-6 md:-m-8 bg-[#0A0A0A] text-white min-h-[calc(100vh-1px)] relative overflow-hidden">
      <div
        className="absolute bottom-0 right-[-10px] font-headline font-black text-white/5 pointer-events-none select-none"
        style={{ fontSize: 220, lineHeight: 1 }}
      >
        settings
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 py-14 md:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 mb-4">
            <span className="text-white">07 —</span> Settings
          </div>
          <h1 className="font-headline text-4xl sm:text-5xl font-extrabold tracking-tight mb-10">
            Manage your <span className="text-[#E4FF3D]">account.</span>
          </h1>

          {settingsSections.map((section, sectionIndex) => (
            <div key={section.title} className="mb-10">
              <div className="text-xs font-bold uppercase tracking-widest text-white/45 mb-1">
                {section.title}
              </div>
              {section.items.map((item) => {
                runningIndex += 1;
                const idx = String(runningIndex).padStart(2, '0');
                return (
                  <motion.button
                    key={item.label}
                    onClick={() => handleItemClick(item.label)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: sectionIndex * 0.05 }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                    className="w-full flex items-center justify-between gap-6 py-5 border-t border-white/15 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-xs text-white/40 w-6 flex-shrink-0">{idx}</span>
                      <span className="font-headline font-extrabold text-lg sm:text-xl">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/50">
                      <span className="text-xs hidden sm:inline">{item.desc}</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ))}

          {/* Sign out / danger zone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-4 border border-[#E4573A]/60 rounded-xl px-6 py-5 flex items-center justify-between gap-4"
          >
            <span className="font-headline font-extrabold text-[#E4573A]">Sign Out</span>
            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-full border border-white text-white text-sm font-semibold hover:bg-white hover:text-[#0A0A0A] transition-colors"
            >
              Sign Out
            </button>
          </motion.div>

          <button className="mt-4 w-full text-left text-xs text-white/30 hover:text-[#E4573A] transition-colors py-2">
            Delete Account
          </button>
        </motion.div>
      </div>
    </div>
  );
}
