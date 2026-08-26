import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router';

export function DemoBannerSection() {
  return (
    <section className="py-20 bg-white relative z-10 overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="bg-[#faf9f6] border border-[#e6e2de] rounded-3xl overflow-hidden shadow-[0_16px_48px_rgba(18,17,15,0.06)] grid lg:grid-cols-12 items-center relative min-h-[460px]">
          
          {/* Left Column: Headline Content (7 Cols) */}
          <div className="lg:col-span-7 p-8 sm:p-12 md:p-16 flex relative z-10 flex-col justify-center">
            {/* Green Circles Grid Motif Background */}
            <div className="absolute top-0 left-0 bottom-0 w-32 sm:w-44 pointer-events-none opacity-90 overflow-hidden hidden sm:block">
              <div className="grid grid-cols-3 gap-3 p-4">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-[#15803d]"
                  />
                ))}
              </div>
            </div>

            <div className="sm:pl-36 relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-[#F4F4F1] border border-[#DBDBD8]/50 px-3.5 py-1.5 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#0A0A0A]">
                  Autonomous Agent Workflow
                </span>
              </div>

              {/* Headline */}
              <h2 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111111] tracking-tight leading-[1.1] mb-6">
                Put AI agents to work, <span className="text-[#0A0A0A]">on your terms</span>
              </h2>

              {/* Subhead */}
              <p className="font-body text-base sm:text-lg text-[#4A4A46] mb-8 leading-relaxed">
                Explore how BrandSetu agents help teams turn strategy into execution across every channel, market, and audience.
              </p>

              {/* CTA Button */}
              <div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <Link
                    to="/setup"
                    className="bg-[#0A0A0A] hover:bg-[#262626] text-white px-8 py-4 rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-3"
                  >
                    <span>Start Free Today</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right Column: High Quality Professional Team Collaboration Image (5 Cols) */}
          <div className="lg:col-span-5 h-full min-h-[360px] lg:min-h-[460px] relative overflow-hidden bg-slate-100 flex items-center justify-center">
            {/* Edge Overlay effect */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#faf9f6] z-10 hidden lg:block opacity-90" 
                 style={{ clipPath: 'polygon(0 0, 100% 0, 50% 10%, 100% 20%, 30% 30%, 100% 40%, 40% 50%, 100% 60%, 20% 70%, 100% 80%, 40% 90%, 100% 100%, 0 100%)' }} />
            
            <img
              src="/team_collaboration.png"
              alt="BrandSetu Autonomous Team"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
