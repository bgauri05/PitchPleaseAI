import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Sparkles, CheckCircle2, XCircle, RefreshCw, 
  Linkedin, Twitter, Instagram, Play, Bot, Database, CalendarDays,
  ShieldCheck, HelpCircle
} from 'lucide-react';
import { Link } from 'react-router';
import { Logo } from '../components/Logo';
import { CapabilityBar } from '../components/CapabilityBar';
import { FeatureSliderSection } from '../components/FeatureSliderSection';
import { FeedbackBentoSection } from '../components/FeedbackBentoSection';
import { CarBicycleVisual } from '../components/CarBicycleVisual';
import { BrandJourneyMap } from '../components/BrandJourneyMap';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { useRef, useState, useEffect } from 'react';

export function LandingPage() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);

  // Festivals dataset preserved
  const festivals = [
    { name: 'Diwali', emoji: '🪔', color: 'from-[#FF9F1C] to-[#FFB088]', glow: 'rgba(255, 159, 28, 0.4)', sample: 'Brighten up your sales this festive season!' },
    { name: 'Eid', emoji: '🌙', color: 'from-[#22C55E] to-[#16A34A]', glow: 'rgba(34, 197, 94, 0.4)', sample: 'Warm wishes & exclusive holiday discounts.' },
    { name: 'Holi', emoji: '🎨', color: 'from-[#FF6B9D] to-[#FF9F1C]', glow: 'rgba(255, 107, 157, 0.4)', sample: 'Add vibrant colors to your marketing campaign!' },
    { name: 'Navratri', emoji: '💃', color: 'from-[#6366F1] to-[#8B5CF6]', glow: 'rgba(99, 102, 241, 0.4)', sample: '9 days of festivity & special customer offers.' },
    { name: 'Independence Day', emoji: '🇮🇳', color: 'from-[#FF9F1C] to-[#22C55E]', glow: 'rgba(255, 159, 28, 0.4)', sample: 'Celebrate freedom with our special package.' },
  ];

  // Testimonials dataset preserved
  const testimonials = [
    { 
      name: 'Priya Sharma', 
      business: 'Boutique Owner, Mumbai',
      avatar: 'PS',
      text: 'PitchPleaseAI transformed how I market my boutique. Festival posts that used to take hours now take minutes!',
      gradient: 'from-pink-500 to-purple-500'
    },
    { 
      name: 'Rajesh Kumar', 
      business: 'Tech Startup, Bangalore',
      avatar: 'RK',
      text: 'Finally, marketing content in both English and Hindi. Perfect for reaching all my customers across India.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      name: 'Meera Patel', 
      business: 'Cafe Owner, Delhi',
      avatar: 'MP',
      text: 'The AI understands my brand voice perfectly. It\'s like having a dedicated marketing team in my pocket!',
      gradient: 'from-orange-500 to-rose-500'
    },
  ];

  // Real backend platforms
  const supportedPlatforms = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'from-blue-600 to-blue-400',
      description: 'Professional thought leadership, industry insights, and b2b campaign copy tailored for corporate networks.',
      previewText: '🚀 Exciting milestone! We just published our Q3 guide on scaling local retail brand voices using AI context...'
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      icon: Twitter,
      color: 'from-sky-500 to-cyan-400',
      description: 'Punchy threads, trending hashtag hooks, and concise announcements engineered for viral engagement.',
      previewText: 'Thread: 5 ways Indian D2C brands are automating festival marketing without losing authenticity 🧵👇'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'from-pink-500 via-rose-500 to-yellow-500',
      description: 'Engaging captions, carousel scripts, and hashtag strategies paired with festive story templates.',
      previewText: '✨ Diwali Special! 🪔 Bring festive warmth to your customer base. Swipe left for exclusive festival packages 🛍️'
    }
  ];

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1d1b19] font-body relative overflow-x-hidden antialiased">
      {/* Sticky Navigation */}
      <motion.header 
        className="sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-slate-100 shadow-xs"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Logo size="md" />
          </motion.div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#5b403c]">
            <a href="#campaign-slider" className="hover:text-[#b51d0d] transition-colors">Platform Engine</a>
            <a href="#feedbacks" className="hover:text-[#b51d0d] transition-colors">Reviews & Stats</a>
            <a href="#features" className="hover:text-[#b51d0d] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#b51d0d] transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-[#b51d0d] transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            {/* WHAT: this used to point to /setup — meaning "Sign In" for a
                returning user actually dropped them into a blank business
                setup wizard instead of a login form. /auth (AuthPage.tsx)
                is the real login/signup page; it wasn't reachable from
                anywhere in the app until now. */}
            <Link
              to="/auth"
              className="text-sm font-semibold text-[#5b403c] hover:text-[#1d1b19] transition-all"
            >
              Sign In
            </Link>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                to="/setup"
                className="px-5 py-2.5 rounded-xl bg-[#b51d0d] hover:bg-[#d83824] text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 block"
              >
                Start Free
              </Link>
            </motion.div>
          </div>
        </nav>
      </motion.header>

      {/* SECTION 1: HERO HEADER & SLIDER SHOWCASE */}
      <section className="relative overflow-hidden pt-12 lg:pt-16 pb-0 bg-white">
        <motion.div 
          className="container mx-auto px-6 max-w-7xl relative z-10 text-center"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          {/* Centered Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="max-w-4xl mx-auto mb-10"
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 bg-[#f8f3ef] border border-[#e4beb7]/60 px-4 py-1.5 rounded-full mb-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-[#5647c8]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5647c8]">
                Put AI agents to work for marketing
              </span>
            </motion.div>
            
            {/* Main Headline */}
            <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1d1b19] mb-6 leading-[1.12] tracking-tight">
              AI marketing agents that{' '}
              <span className="text-[#b51d0d]">
                actually know your brand
              </span>
            </h1>
            
            {/* Subhead */}
            <p className="font-body text-lg sm:text-xl text-[#5b403c] mb-8 leading-relaxed max-w-2xl mx-auto">
              <strong className="text-[#1d1b19] font-semibold">Researcher, Creator, and Sentinel</strong> agents draft, refine, and approve social content in your brand voice — festival calendar included.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 items-center justify-center mb-12">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link 
                  to="/setup"
                  className="px-8 py-4 rounded-xl bg-[#b51d0d] hover:bg-[#d83824] text-white font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-3"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
              
              <motion.button 
                onClick={scrollToHowItWorks}
                className="bg-white border-[1.5px] border-[#1d1b19] px-7 py-4 rounded-xl hover:bg-[#f8f3ef] transition-all font-semibold text-[#1d1b19] flex items-center gap-2"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Play className="w-4 h-4 text-[#1d1b19] fill-[#1d1b19]" />
                See it in action
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature Slider Showcase Right at the Start of Website */}
        <div id="campaign-slider">
          <FeatureSliderSection />
        </div>
      </section>

      {/* SECTION 2: SOCIAL PROOF BAR */}
      <CapabilityBar />

      {/* SECTION 5: HOW IT WORKS (Interactive Car Journey Roadmap) */}
      <BrandJourneyMap />



      {/* SECTION 6: FESTIVAL-AWARE CONTENT (FEATURE DEEP-DIVE) */}
      <section className="py-24 relative z-10 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Visual Cards */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
            >
              {festivals.map((fest, idx) => (
                <motion.div
                  key={fest.name}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="glass-card-strong rounded-2xl p-4 text-center border border-white/40 shadow-sm cursor-pointer"
                >
                  <div className="text-4xl mb-2">{fest.emoji}</div>
                  <div className="text-sm font-bold text-[#0F172A] mb-1">{fest.name}</div>
                  <div className="text-[11px] text-[#64748B] line-clamp-2">{fest.sample}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Right: Copy */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-[#f8f3ef] border border-[#e4beb7]/50 px-3.5 py-1.5 rounded-full mb-4">
                <span className="text-sm">🪔</span>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#b51d0d]">
                  Cultural Intelligence
                </span>
              </div>
              <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1d1b19] mb-6 leading-tight">
                Diwali, Eid, Holi, Independence Day —{' '}
                <span className="text-[#b51d0d]">
                  PitchPleaseAI drafts for it automatically
                </span>
              </h2>
              <p className="text-lg text-[#64748B] mb-6 leading-relaxed">
                Unlike generic Western marketing AI tools, PitchPleaseAI comes pre-loaded with an Indian festival calendar. It anticipates holiday rushes and generates culturally authentic campaigns ahead of time.
              </p>
              <div className="glass-card rounded-2xl p-4 border border-white/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF9F1C] to-[#FF6B9D] text-white flex items-center justify-center font-bold text-lg">
                  🇮🇳
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Automated Calendar Reminders</h4>
                  <p className="text-xs text-[#64748B]">Get campaign drafts 7 days before major regional and national festivals.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* SECTION 8: PROVEN IMPACT, BENTO REVIEWS & STATISTICS */}
      <FeedbackBentoSection />

      {/* SECTION 10: FAQ */}
      <section id="faq" className="py-24 relative z-10">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#f8f3ef] border border-[#e4beb7]/50 px-3.5 py-1.5 rounded-full mb-4">
              <HelpCircle className="w-3.5 h-3.5 text-[#b51d0d]" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#b51d0d]">
                Frequently Asked Questions
              </span>
            </div>
            <h2 className="font-headline text-4xl lg:text-5xl font-extrabold text-[#1d1b19] mb-4">
              Everything You <span className="text-[#b51d0d]">Need to Know</span>
            </h2>
            <p className="text-lg text-[#64748B]">
              Clear answers to how PitchPleaseAI powers your marketing pipeline.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6 }}
            className="glass-card-strong rounded-3xl p-6 sm:p-8 border border-white/40 shadow-[0_16px_48px_rgba(0,0,0,0.06)]"
          >
            <Accordion type="single" collapsible className="w-full divide-y divide-slate-200/60">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-base font-bold text-[#0F172A] hover:no-underline hover:text-[#2EC4B6]">
                  Is this just ChatGPT with a UI wrapper?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed text-sm">
                  No. PitchPleaseAI runs an autonomous multi-agent pipeline (Researcher, Creator, and Sentinel). Instead of generating raw unedited text from a single prompt, Sentinel continuously inspects, critiques, and refines every draft against your stored brand guidelines until it clears strict quality standards.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-base font-bold text-[#0F172A] hover:no-underline hover:text-[#2EC4B6]">
                  How does PitchPleaseAI learn my brand tone?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed text-sm">
                  PitchPleaseAI utilizes Retrieval-Augmented Generation (RAG). Your company mission, target audience, preferred tone, and prohibited terms are stored in vector memory and retrieved before every generation pass to ensure 100% brand voice fidelity.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-base font-bold text-[#0F172A] hover:no-underline hover:text-[#2EC4B6]">
                  What platforms can I post to?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed text-sm">
                  PitchPleaseAI generates native, platform-specific content for LinkedIn, Twitter / X, and Instagram, matching formatting rules, hashtag conventions, and character limits for each platform.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-base font-bold text-[#0F172A] hover:no-underline hover:text-[#2EC4B6]">
                  Is my business data private?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed text-sm">
                  Yes. All user data, brand memories, and content drafts are strictly protected via Supabase Row-Level Security (RLS) at the database layer. Your data is never exposed client-side or shared across tenants.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-base font-bold text-[#0F172A] hover:no-underline hover:text-[#2EC4B6]">
                  What does it cost?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed text-sm">
                  You can get started completely free to experience the multi-agent pipeline and generate your first batch of festival and social campaigns. Upgrades are available for higher posting volumes and team collaboration.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>



      {/* Footer */}
      <footer className="glass-card-strong border-t border-white/30 py-16 relative z-10">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Logo size="md" />
              <p className="text-sm text-[#64748B] mt-4 leading-relaxed">
                Bridging businesses with growth through AI-powered marketing agents.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#0F172A] mb-4">Product</h4>
              <ul className="space-y-2.5 text-xs font-medium text-[#64748B]">
                <li><a href="#features" className="hover:text-[#2EC4B6] transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-[#2EC4B6] transition-colors">How It Works</a></li>
                <li><a href="#faq" className="hover:text-[#2EC4B6] transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#0F172A] mb-4">Core Agents</h4>
              <ul className="space-y-2.5 text-xs font-medium text-[#64748B]">
                <li><span className="hover:text-[#2EC4B6]">Researcher Agent</span></li>
                <li><span className="hover:text-[#2EC4B6]">Creator Agent</span></li>
                <li><span className="hover:text-[#2EC4B6]">Sentinel Agent</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#0F172A] mb-4">Security</h4>
              <ul className="space-y-2.5 text-xs font-medium text-[#64748B]">
                <li><span className="hover:text-[#2EC4B6]">Supabase RLS</span></li>
                <li><span className="hover:text-[#2EC4B6]">Serverless Execution</span></li>
                <li><span className="hover:text-[#2EC4B6]">Brand Memory Security</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200/60 pt-8 text-center text-xs text-[#64748B]">
            <p>© 2026 PitchPleaseAI. Made with ❤️ for Bharat's entrepreneurs.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper StepCard component with staggered entrance
function StepCard({ step, title, tagline, description, delay }: { step: string; title: string; tagline: string; description: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -6 }}
      className="glass-card-strong rounded-3xl p-8 border border-white/40 shadow-[0_16px_48px_rgba(0,0,0,0.08)] relative overflow-hidden flex flex-col justify-between"
    >
      <div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2EC4B6] via-[#3DDAD7] to-[#4D9DE0] text-white flex items-center justify-center font-bold text-xl mb-6 shadow-md">
          {step}
        </div>
        <h3 className="text-2xl font-bold text-[#0F172A] mb-1">{title}</h3>
        <div className="text-xs font-semibold text-[#2EC4B6] uppercase tracking-wider mb-4">
          {tagline}
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}