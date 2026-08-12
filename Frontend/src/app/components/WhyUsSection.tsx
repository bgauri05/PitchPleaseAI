import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router';

export function WhyUsSection() {
  return (
    <section id="why-us" className="py-20 lg:py-24 bg-white relative z-10 overflow-hidden border-y border-[#e6e2de]">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-[#f8f3ef] border border-[#e4beb7]/50 px-4 py-1.5 rounded-full mb-4"
          >
            <Sparkles className="w-4 h-4 text-[#b51d0d]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#b51d0d]">
              Why BrandSetu?
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1d1b19] tracking-tight leading-tight mb-4"
          >
            Build your startup.{' '}
            <span className="text-[#b51d0d]">
              Let AI handle marketing.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-body text-base sm:text-lg text-[#5b403c] leading-relaxed"
          >
            Because burning precious runway before finding product-market fit makes no sense. BrandSetu gives you an autonomous 3-agent marketing team at a fraction of the cost.
          </motion.p>
        </div>

        {/* Grid: Meme Image on Left + Clean BrandSetu Core Strengths on Right */}
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Meme Image Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative"
          >
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#e6e2de] shadow-[0_16px_40px_rgba(18,17,15,0.06)] relative overflow-hidden group">
              {/* Highlight Tag */}
              <div className="absolute top-6 left-6 z-10 bg-[#facc15] text-[#1d1b19] font-mono text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md shadow-xs">
                Founder Dilemma #1
              </div>

              {/* Poster Image */}
              <div className="rounded-2xl overflow-hidden bg-[#faf8f5] flex items-center justify-center pt-8">
                <img
                  src="/why_us_startup_meme.jpg"
                  alt="Itna paisa marketing pe udaayega toh startup banayega kab re baba?"
                  className="w-full h-auto object-contain max-h-[480px] rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
                />
              </div>

              <div className="mt-4 text-center">
                <p className="font-headline text-xs sm:text-sm font-semibold text-[#5b403c] italic">
                  "Stop blowing your runway on bloated agency retainers."
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Clean BrandSetu Strengths */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-4"
          >
            <div className="bg-white border border-[#e6e2de] rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(18,17,15,0.04)] space-y-6">
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#fee2e2] text-[#b51d0d] flex items-center justify-center font-bold text-lg shrink-0">
                  💰
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-[#1d1b19]">Save Your Startup Runway</h3>
                  <p className="text-xs sm:text-sm text-[#5b403c] mt-1 leading-relaxed">
                    Keep 100% of your funds focused on product development, engineering, and customer support instead of burning cash early on.
                  </p>
                </div>
              </div>

              <div className="border-t border-[#e6e2de] pt-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center font-bold text-lg shrink-0">
                  🤖
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-[#1d1b19]">3 Autonomous AI Agents Working 24/7</h3>
                  <p className="text-xs sm:text-sm text-[#5b403c] mt-1 leading-relaxed">
                    Researcher, Creator, and Sentinel agents continuously analyze trends, write multi-channel posts, and audit every draft in your brand voice.
                  </p>
                </div>
              </div>

              <div className="border-t border-[#e6e2de] pt-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold text-lg shrink-0">
                  🪔
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-[#1d1b19]">Festivals & Multi-Language Support Included</h3>
                  <p className="text-xs sm:text-sm text-[#5b403c] mt-1 leading-relaxed">
                    Pre-loaded with Indian festival calendars and bilingual English & Hindi campaign copy tailored for LinkedIn, Twitter, and Instagram.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e6e2de]">
                <Link
                  to="/setup"
                  className="bg-[#b51d0d] hover:bg-[#d83824] text-white px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-3"
                >
                  <span>Start Free — Build Your Product Not Bills</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
