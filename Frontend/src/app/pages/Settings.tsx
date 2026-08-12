import { motion } from 'motion/react';
import { User, Bell, Globe, Lock, CreditCard, HelpCircle, LogOut } from 'lucide-react';
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
      icon: User,
      items: [
        { label: 'Profile Information', desc: 'Update your personal details' },
        { label: 'Email & Password', desc: 'Manage your login credentials' },
        { label: 'Connected Accounts', desc: 'Link social media accounts' },
      ]
    },
    {
      title: 'Preferences',
      icon: Bell,
      items: [
        { label: 'Notifications', desc: 'Configure email and push notifications' },
        { label: 'Language & Region', desc: 'Set your preferred language' },
        { label: 'Content Defaults', desc: 'Set default platforms and tone' },
      ]
    },
    {
      title: 'Business',
      icon: Globe,
      items: [
        { label: 'Business Profile', desc: 'Update your business information' },
        { label: 'Brand Voice', desc: 'Adjust your brand tone settings' },
        { label: 'Target Audience', desc: 'Refine your audience details' },
      ]
    },
    {
      title: 'Security & Privacy',
      icon: Lock,
      items: [
        { label: 'Privacy Settings', desc: 'Control your data and privacy' },
        { label: 'Two-Factor Authentication', desc: 'Add extra security' },
        { label: 'Sessions', desc: 'Manage active sessions' },
      ]
    },
    {
      title: 'Billing',
      icon: CreditCard,
      items: [
        { label: 'Subscription Plan', desc: 'View and manage your plan' },
        { label: 'Payment Methods', desc: 'Update payment information' },
        { label: 'Billing History', desc: 'View past invoices' },
      ]
    },
    {
      title: 'Support',
      icon: HelpCircle,
      items: [
        { label: 'Help Center', desc: 'Find answers to common questions' },
        { label: 'Contact Support', desc: 'Get help from our team' },
        { label: 'Feature Requests', desc: 'Suggest new features' },
      ]
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Settings</h1>
          <p className="text-[#64748B]">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {settingsSections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
                className="bg-white rounded-3xl shadow-lg overflow-hidden"
              >
                <div className="p-6 border-b-2 border-[#E5E7EB] flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F8FAFC] rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#2EC4B6]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#0F172A]">{section.title}</h2>
                </div>
                <div className="divide-y divide-[#E5E7EB]">
                  {section.items.map((item, itemIndex) => (
                    <motion.button
                      key={itemIndex}
                      onClick={() => handleItemClick(item.label)}
                      whileHover={{ backgroundColor: '#F8FAFC' }}
                      className="w-full p-6 text-left transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-medium text-[#0F172A] mb-1">{item.label}</div>
                        <div className="text-sm text-[#64748B]">{item.desc}</div>
                      </div>
                      <div className="text-[#CBD5E1] group-hover:text-[#2EC4B6] transition-colors">
                        →
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-red-200"
          >
            <div className="p-6 bg-red-50 border-b-2 border-red-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-900">Danger Zone</h2>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={handleSignOut}
                className="w-full p-4 bg-orange-50 border-2 border-orange-200 rounded-xl text-orange-600 hover:bg-orange-100 transition-colors font-medium"
              >
                Sign Out
              </button>
              <button className="w-full p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 hover:bg-red-100 transition-colors">
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
