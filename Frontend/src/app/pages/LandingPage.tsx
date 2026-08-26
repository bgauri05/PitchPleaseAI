import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Logo } from '../components/Logo';

const PLATFORM_TICKER: { name: string; hot?: boolean }[] = [
  { name: 'INSTAGRAM' },
  { name: 'LINKEDIN' },
  { name: 'WHATSAPP', hot: true },
  { name: 'TWITTER / X' },
  { name: 'EMAIL' },
  { name: 'FACEBOOK', hot: true },
];

export function LandingPage() {
  const navigate = useNavigate();

  // The three-agent pipeline, shown in the "Meet the Pipeline" section below
  const agents = [
    {
      letter: 'R',
      tag: 'Agent 01',
      title: 'Researcher',
      desc: 'Scans trends, competitors, and upcoming festivals in your industry to find what\'s actually worth posting about this week.',
      theme: 'bg-[#0A0A0A] text-white',
      letterColor: 'text-white/90',
    },
    {
      letter: 'C',
      tag: 'Agent 02',
      title: 'Creator',
      desc: 'Drafts captions, hooks, and visuals in your brand voice — Friendly, Bold, Luxury, Educational, whatever you picked at setup.',
      theme: 'bg-[#E4FF3D] text-[#0A0A0A]',
      letterColor: 'text-[#0A0A0A]/80',
    },
    {
      letter: 'S',
      tag: 'Agent 03',
      title: 'Sentinel',
      desc: 'Reviews every draft against your brand guardrails before it\'s ever allowed to reach your queue.',
      theme: 'bg-white text-[#0A0A0A] border border-[#DBDBD8]',
      letterColor: 'text-[#0A0A0A]/[0.06]',
    },
  ];

  // The step-by-step flow, shown in "How It Works"
  const howItWorks = [
    { idx: '01', title: 'Tell us who you are', desc: 'Ten-minute setup: brand voice, values, audience, and products.' },
    { idx: '02', title: 'Generate or plan a week', desc: 'Ask for one post, or let agents fill your whole 7-day calendar.' },
    { idx: '03', title: 'Sentinel reviews, you approve', desc: 'Every draft is pre-screened — you get final say before it\'s scheduled.' },
    { idx: '04', title: 'Auto-publish, 24/7', desc: 'Approved posts go out on schedule across Instagram, LinkedIn, WhatsApp, and more.' },
  ];

  // Testimonials dataset preserved
  const testimonials = [
    {
      name: 'Priya Sharma',
      business: 'Boutique Owner, Mumbai',
      avatar: 'PS',
      text: 'PitchPleaseAI transformed how I market my boutique. Festival posts that used to take hours now take minutes!',
    },
    {
      name: 'Rajesh Kumar',
      business: 'Tech Startup, Bangalore',
      avatar: 'RK',
      text: 'Finally, marketing content in both English and Hindi. Perfect for reaching all my customers across India.',
    },
    {
      name: 'Meera Patel',
      business: 'Cafe Owner, Delhi',
      avatar: 'MP',
      text: 'The AI understands my brand voice perfectly. It\'s like having a dedicated marketing team in my pocket!',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#111111] font-body relative overflow-x-hidden antialiased">
      {/* Sticky Navigation */}
      <motion.header
        className="sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-[#DBDBD8]"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between max-w-6xl">
          <Logo size="md" />

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#555]">
            <a href="#top" className="bg-white px-4 py-2 rounded-full border border-[#DBDBD8] hover:border-[#111111] transition-colors">Product</a>
            <a href="#pipeline" className="hover:text-[#0A0A0A] transition-colors">Pipeline</a>
            <a href="#contact" className="hover:text-[#0A0A0A] transition-colors">Pricing</a>
            <Link to="/auth?mode=login" className="hover:text-[#0A0A0A] transition-colors">Sign In</Link>
          </div>

          <Link
            to="/auth?mode=signup"
            className="px-5 py-2.5 rounded-full bg-[#0A0A0A] hover:bg-[#262626] text-white text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            Start Free <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </motion.header>

      {/* SECTION 1: HERO */}
      <section id="top" className="relative overflow-hidden pt-16 md:pt-20">
        <div
          className="absolute font-headline font-black text-[#0A0A0A]/5 pointer-events-none select-none hidden md:block"
          style={{ fontSize: 260, lineHeight: 1, top: 100, left: -20 }}
        >
          pitch
        </div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-4">
              Put AI Agents To Work
            </div>

            <h1 className="font-headline text-5xl sm:text-6xl lg:text-[76px] font-black leading-[0.98] tracking-tight mb-5">
              AI marketing<br />
              agents that{' '}
              <span className="text-[#C9E200]">
                actually<br />know your brand
              </span>
            </h1>

            <p className="text-base text-[#4A4A46] leading-relaxed max-w-lg mt-5">
              Researcher, Creator, and Sentinel agents draft, refine, and approve social content in your brand voice — powered by a persistent Business Memory Module.
            </p>

            <div className="mt-8 flex max-w-[520px] border-2 border-[#111111] rounded-full overflow-hidden">
              <input
                type="text"
                placeholder="Enter your business name…"
                id="hero-brand-input"
                className="flex-1 min-w-0 px-5 py-4 text-sm text-[#111111] placeholder:text-[#4A4A46]/60 focus:outline-none bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('hero-brand-input') as HTMLInputElement;
                  const val = input?.value?.trim() || '';
                  navigate(
                    val
                      ? `/auth?mode=signup&brand_name=${encodeURIComponent(val)}`
                      : '/auth?mode=signup'
                  );
                }}
                className="px-6 bg-[#E4FF3D] hover:bg-[#C9E200] text-[#0A0A0A] font-semibold text-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                Build Brand Memory
              </button>
            </div>
          </motion.div>

          {/* Platform ticker */}
          <div className="overflow-hidden whitespace-nowrap border-y border-[#DBDBD8] py-3 mt-14">
            <motion.div
              className="inline-flex font-headline font-extrabold text-sm tracking-wide"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              {[0, 1].map((rep) => (
                <span key={rep} className="inline-flex items-center">
                  {PLATFORM_TICKER.map((p) => (
                    <span key={`${rep}-${p.name}`} className="inline-flex items-center">
                      <span className={`mx-6 ${p.hot ? 'text-[#C9E200]' : 'text-[#8A8A85]'}`}>{p.name}</span>
                      <span className="text-[#DBDBD8]">—</span>
                    </span>
                  ))}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10">
            {[
              { n: '6', l: 'Platforms', d: 'supported at launch' },
              { n: '6', l: 'Languages', d: 'including regional Indian' },
              { n: '3', l: 'AI Agents', d: 'researcher, creator, sentinel' },
              { n: '24/7', l: 'Auto-publish', d: 'background scheduler' },
            ].map((s) => (
              <div key={s.l} className="border-t-2 border-[#111111] pt-5">
                <span className="font-headline text-4xl md:text-5xl font-black text-[#111111] block">{s.n}</span>
                <span className="text-xs font-semibold text-[#111111] mt-1 block">{s.l}</span>
                <span className="text-[11px] text-[#8A8A85] mt-1 block">{s.d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: MEET THE PIPELINE (3 agent cards) */}
      <section id="pipeline" className="py-20 md:py-24 relative z-10 bg-white border-t border-[#DBDBD8]">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mb-10 max-w-2xl"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-4">
              <span className="text-[#111111]">02 —</span> Meet The Pipeline
            </div>
            <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-[#111111] mb-4 tracking-tight">
              Three agents. One brand voice.
            </h2>
            <p className="text-base text-[#4A4A46] leading-relaxed">
              Every post moves through the same three-stage pipeline before it ever reaches your queue — nothing goes live on autopilot without a check.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4">
            {agents.map((agent, idx) => (
              <motion.div
                key={agent.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -6 }}
                className={`relative overflow-hidden rounded-md p-7 min-h-[260px] flex flex-col justify-end ${agent.theme}`}
              >
                <span
                  className={`absolute -top-6 right-1 font-headline font-black text-[160px] leading-none ${agent.letterColor}`}
                >
                  {agent.letter}
                </span>
                <div className="relative z-10 text-[10.5px] font-bold uppercase tracking-widest opacity-60 mb-3">
                  {agent.tag}
                </div>
                <h3 className="relative z-10 font-headline font-extrabold text-2xl mb-2">{agent.title}</h3>
                <p className="relative z-10 text-sm leading-relaxed max-w-[230px]">{agent.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS (numbered flow) */}
      <section id="how-it-works" className="py-20 md:py-24 relative z-10 bg-white border-t border-[#DBDBD8]">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-4">
              <span className="text-[#111111]">03 —</span> How It Works
            </div>
            <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
              From idea to published, in one flow.
            </h2>
          </motion.div>

          <div>
            {howItWorks.map((s, idx) => (
              <motion.div
                key={s.idx}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="flex items-center gap-6 py-5 border-t border-[#DBDBD8] last:border-b hover:bg-[#F4F4F1]/60 transition-colors"
              >
                <div className="text-xs text-[#8A8A85] w-6 flex-shrink-0">{s.idx}</div>
                <div className="font-headline font-extrabold text-lg sm:text-xl text-[#111111] flex-1">{s.title}</div>
                <div className="text-xs sm:text-sm text-[#4A4A46] max-w-xs text-right hidden sm:block">{s.desc}</div>
                <ArrowRight className="w-4 h-4 text-[#8A8A85] flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: TESTIMONIALS */}
      <section className="py-20 md:py-24 relative z-10 bg-white border-t border-[#DBDBD8]">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mb-10 max-w-2xl"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-4">
              <span className="text-[#111111]">04 —</span> Loved By Brands
            </div>
            <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
              Don't take our word for it.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -3 }}
                className="bg-white border border-[#DBDBD8] rounded-md p-6 shadow-sm hover:shadow-[0_14px_30px_rgba(10,10,10,0.08)] transition-shadow"
              >
                <div className="text-[#C9E200] text-sm tracking-widest mb-4">★★★★★</div>
                <p className="text-sm text-[#333] leading-relaxed mb-6 min-h-[96px]">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-headline font-extrabold text-sm text-[#111111]">{t.name}</div>
                    <div className="text-xs text-[#8A8A85]">{t.business}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact + Footer — dark full-bleed, matching the bold system */}
      <section id="contact" className="relative z-10 bg-[#0A0A0A] text-white overflow-hidden">
        <div
          className="absolute font-headline font-black text-white/5 pointer-events-none select-none hidden md:block"
          style={{ fontSize: 220, lineHeight: 1, bottom: -40, right: -10 }}
        >
          talk
        </div>
        <div className="container mx-auto px-6 max-w-7xl py-20 md:py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 mb-4">
              <span className="text-white">05 —</span> Get In Touch
            </div>
            <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
              Let's build your <span className="text-[#E4FF3D]">brand memory.</span>
            </h2>
            <p className="text-base text-white/65 leading-relaxed mb-8">
              Questions, demos, partnership ideas — the team reads everything that comes through. Or just start free and see the pipeline for yourself.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate('/auth?mode=signup');
              }}
              className="flex flex-col sm:flex-row gap-0 max-w-lg border-2 border-white rounded-2xl overflow-hidden"
            >
              <input
                type="email"
                placeholder="you@business.com"
                className="flex-1 bg-transparent px-5 py-4 text-sm text-white placeholder:text-white/45 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-4 bg-[#E4FF3D] hover:bg-[#C9E200] text-[#0A0A0A] font-semibold text-sm transition-colors whitespace-nowrap"
              >
                Get In Touch
              </button>
            </form>
          </motion.div>

          <div className="border-t border-white/15 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="md" variant="dark" />
            <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-xs font-semibold text-white/60">
              <a href="#top" className="hover:text-white transition-colors">Product</a>
              <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
              <a href="#contact" className="hover:text-white transition-colors">Pricing</a>
              <Link to="/auth?mode=login" className="hover:text-white transition-colors">Sign In</Link>
              <span>Privacy</span>
              <span>Terms</span>
            </div>
            <div className="flex items-center gap-5 text-xs font-semibold text-white/60">
              <span>Instagram</span>
              <span>LinkedIn</span>
              <span>X</span>
            </div>
          </div>
          <p className="text-xs text-white/35 mt-8">
            © 2026 PitchPleaseAI. Made with ❤️ for Bharat's entrepreneurs.
          </p>
        </div>
      </section>
    </div>
  );
}