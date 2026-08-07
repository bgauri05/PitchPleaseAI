import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Store, Building2, Users, Target, MessageCircle, Globe, Loader2, Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function BusinessSetup() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    targetAudience: '',
    brandTone: '',
    languages: [] as string[]
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fef8f4]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#b51d0d]" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.is_setup_complete) return <Navigate to="/app" replace />;

  const industries = [
    'Retail & E-commerce',
    'Food & Beverage',
    'Fashion & Beauty',
    'Technology',
    'Healthcare',
    'Education',
    'Real Estate',
    'Professional Services',
    'Arts & Crafts',
    'Other'
  ];

  const brandTones = [
    { value: 'professional', label: 'Professional', desc: 'Formal and business-focused', icon: Building2 },
    { value: 'friendly', label: 'Friendly', desc: 'Casual and approachable', icon: MessageCircle },
    { value: 'local', label: 'Local & Warm', desc: 'Community-focused and personal', icon: Users },
    { value: 'premium', label: 'Premium', desc: 'Luxury and high-end', icon: Target }
  ];

  const languages = [
    '🇬🇧 English',
    '🇮🇳 हिंदी (Hindi)',
    '🇮🇳 मराठी (Marathi)',
    '🇮🇳 ગુજરાતી (Gujarati)',
    '🇮🇳 தமிழ் (Tamil)',
    '🇮🇳 తెలుగు (Telugu)',
    '🇮🇳 বাংলা (Bengali)',
    '🇮🇳 ಕನ್ನಡ (Kannada)',
    '🇮🇳 മലയാളം (Malayalam)',
    '🇮🇳 ਪੰਜਾਬੀ (Punjabi)'
  ];

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { error } = await supabase.from('profiles').upsert({
        id: currentUser.id,
        business_name: formData.businessName,
        industry: formData.industry,
        brand_voice: formData.brandTone,
        languages: formData.languages,
        is_setup_complete: true,
      });

      if (error) {
        console.error('Profile save error:', error);
        alert('Failed to save profile. Please try again.');
        return;
      }

      await refreshProfile();
      navigate('/app');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (formData.languages.includes(lang)) {
      setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang) });
    } else {
      setFormData({ ...formData, languages: [...formData.languages, lang] });
    }
  };

  const progressPercent = Math.round((step / 3) * 100);

  return (
    <div className="min-h-screen bg-[#fef8f4] text-[#1d1b19] flex flex-col font-body antialiased relative overflow-hidden">
      {/* Top Thin Coral Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-[#ece7e3] z-50">
        <div
          className="h-full bg-[#b51d0d] transition-all duration-500 ease-in-out rounded-r-full shadow-[0_0_8px_rgba(181,29,13,0.4)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Back Button */}
      {step > 1 && (
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="absolute top-6 left-6 z-20 p-2.5 rounded-full text-[#5b403c] hover:bg-[#f8f3ef] hover:text-[#1d1b19] transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full h-full flex items-center justify-center p-6 my-auto relative z-10">
        <div className="w-full max-w-2xl">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-white rounded-[24px] p-8 md:p-14 shadow-[0_8px_24px_rgba(18,17,15,0.08)] hover:shadow-[0_12px_32px_rgba(18,17,15,0.12)] transition-all duration-300 flex flex-col items-center justify-center text-center border border-[#ece7e3]"
          >
            {/* Step Icon Badge */}
            <div className="w-16 h-16 bg-[#fef8f4] rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-[#e4beb7]/30 text-[#b51d0d]">
              {step === 1 && <Store className="w-8 h-8" />}
              {step === 2 && <Building2 className="w-8 h-8" />}
              {step === 3 && <Globe className="w-8 h-8" />}
            </div>

            {/* STEP 1: Business Name */}
            {step === 1 && (
              <>
                <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#1d1b19] mb-3 max-w-xl">
                  What is the name of your business?
                </h1>
                <p className="font-body text-[#5b403c] text-base mb-8 max-w-md">
                  This will be used across your PitchPleaseAI marketing assets and AI drafts.
                </p>

                <div className="w-full max-w-md mb-8">
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Royal Bakery or Acme Corp"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-white border border-[#e4beb7] rounded-xl px-5 py-4 text-base text-[#1d1b19] placeholder:text-[#8f706a]/50 focus:outline-none focus:border-[#1d1b19] focus:ring-1 focus:ring-[#1d1b19] transition-all shadow-sm"
                  />
                </div>
              </>
            )}

            {/* STEP 2: Industry & Tone */}
            {step === 2 && (
              <>
                <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#1d1b19] mb-3 max-w-xl">
                  Define your brand identity
                </h1>
                <p className="font-body text-[#5b403c] text-base mb-6 max-w-md">
                  Select your business industry and brand voice tone.
                </p>

                <div className="w-full max-w-lg flex flex-col gap-6 mb-8 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-[#1d1b19] mb-2 uppercase tracking-wider">
                      Industry Sector
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full bg-white border border-[#e4beb7] rounded-xl px-4 py-3 text-sm text-[#1d1b19] focus:outline-none focus:border-[#1d1b19]"
                    >
                      <option value="">Select an industry</option>
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1d1b19] mb-2 uppercase tracking-wider">
                      Brand Tone
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {brandTones.map((t) => {
                        const Icon = t.icon;
                        const isSelected = formData.brandTone === t.value;
                        return (
                          <div
                            key={t.value}
                            onClick={() => setFormData({ ...formData, brandTone: t.value })}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#b51d0d] bg-[#ffdad4]/20 ring-1 ring-[#b51d0d]'
                                : 'border-[#e4beb7] bg-white hover:bg-[#f8f3ef]'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-[#b51d0d]' : 'text-[#5b403c]'}`} />
                              <span className="font-semibold text-sm text-[#1d1b19]">{t.label}</span>
                            </div>
                            <span className="text-xs text-[#5b403c] block">{t.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* STEP 3: Target Languages */}
            {step === 3 && (
              <>
                <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#1d1b19] mb-3 max-w-xl">
                  Choose target languages
                </h1>
                <p className="font-body text-[#5b403c] text-base mb-6 max-w-md">
                  Select all languages in which you wish to generate tailored marketing posts.
                </p>

                <div className="w-full max-w-lg mb-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                    {languages.map((lang) => {
                      const isSelected = formData.languages.includes(lang);
                      return (
                        <button
                          type="button"
                          key={lang}
                          onClick={() => toggleLanguage(lang)}
                          className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-[#b51d0d] bg-[#b51d0d] text-white shadow-sm'
                              : 'border-[#e4beb7] bg-white text-[#1d1b19] hover:bg-[#f8f3ef]'
                          }`}
                        >
                          <span className="truncate">{lang}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 ml-1 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Step Action Buttons */}
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting || (step === 1 && !formData.businessName.trim())}
                className="bg-[#b51d0d] hover:bg-[#d83824] active:scale-[0.98] text-white px-8 py-3.5 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 group disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{step === 3 ? 'Complete Setup' : 'Continue'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/app')}
                className="px-6 py-3.5 rounded-xl font-medium text-sm text-[#5b403c] hover:bg-[#f8f3ef] transition-colors"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
