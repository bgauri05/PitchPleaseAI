import { motion } from 'motion/react';
import { ArrowRight, Star, Quote } from 'lucide-react';

export function FeedbackBentoSection() {
  return (
    <section id="feedbacks" className="py-24 bg-[#faf9f5] relative z-10 overflow-hidden border-t border-[#e6e2de]">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-[#f8f3ef] border border-[#e4beb7]/50 px-4 py-1.5 rounded-full mb-4"
          >
            <Star className="w-4 h-4 text-[#b51d0d] fill-[#b51d0d]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#b51d0d]">
              Proven Impact & Reviews
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1d1b19] tracking-tight leading-tight mb-4"
          >
            Trusted by founders & marketing leads across Bharat
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-body text-base sm:text-lg text-[#5b403c] leading-relaxed"
          >
            Real results, massive time savings, and authentic brand voice fidelity at scale.
          </motion.p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* ROW 1: Tile 1 - Light Green Stat Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#dcfce7] rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[220px] shadow-xs hover:shadow-md transition-all"
          >
            <div>
              <div className="font-headline text-4xl sm:text-5xl font-bold text-[#166534] tracking-tight mb-2">
                10,000+
              </div>
              <p className="font-body text-sm font-semibold text-[#15803d]">
                hours saved annually
              </p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[#bbf7d0]/60">
              <span className="font-headline font-bold text-xs uppercase tracking-wider text-[#166534]">
                CUSHMAN & WAKEFIELD
              </span>
              <ArrowRight className="w-4 h-4 text-[#166534]" />
            </div>
          </motion.div>

          {/* ROW 1: Tile 2 - Light Blue Headline Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-[#e0f2fe] rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[220px] shadow-xs hover:shadow-md transition-all"
          >
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-normal text-[#0369a1] tracking-tight mb-2">
                Compliant,
              </div>
              <p className="font-body text-xs sm:text-sm text-[#0284c7] font-medium leading-relaxed">
                high-quality, and localized marketing content at scale
              </p>
            </div>

            <div className="pt-6 border-t border-[#bae6fd]/60">
              <span className="font-headline font-black text-xl text-[#0369a1] tracking-tight">
                Opella.
              </span>
            </div>
          </motion.div>

          {/* ROW 1: Tile 3 - Double Column Review Card (Peter So) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-[#e6e2de] shadow-xs hover:shadow-md transition-all grid sm:grid-cols-12 gap-6 items-center min-h-[220px]"
          >
            {/* Image with overlay badge */}
            <div className="sm:col-span-5 relative rounded-2xl overflow-hidden aspect-4/3 sm:aspect-square bg-slate-100">
              <img
                src="/headshot_vp_innovation.png"
                alt="Peter So"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 text-white p-2 rounded-xl backdrop-blur-xs">
                <div className="font-bold text-xs">Peter So</div>
                <div className="text-[10px] text-slate-300">VP of Digital Innovation</div>
              </div>
            </div>

            {/* Quote content */}
            <div className="sm:col-span-7 flex flex-col justify-between h-full py-1">
              <p className="font-body text-xs sm:text-sm text-[#1d1b19] font-medium leading-relaxed italic mb-4">
                "Thrilled to have PitchPleaseAI as our agentic partner. It’s not just about efficiency gains, it’s about augmenting human creativity, scaling expertise, and unlocking new ways to engage customers."
              </p>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <span className="font-headline font-black text-sm tracking-wider text-slate-800">PGIM</span>
              </div>
            </div>
          </motion.div>


          {/* ROW 2: Tile 4 - Double Column Review Card (Elaina Shekhter) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-[#e6e2de] shadow-xs hover:shadow-md transition-all grid sm:grid-cols-12 gap-6 items-center min-h-[220px]"
          >
            {/* Image with overlay badge */}
            <div className="sm:col-span-5 relative rounded-2xl overflow-hidden aspect-4/3 sm:aspect-square bg-slate-100">
              <img
                src="/headshot_cmo.png"
                alt="Elaina Shekhter"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 text-white p-2 rounded-xl backdrop-blur-xs">
                <div className="font-bold text-xs">Elaina Shekhter</div>
                <div className="text-[10px] text-slate-300">Chief Marketing & Strategy Officer</div>
              </div>
            </div>

            {/* Quote content */}
            <div className="sm:col-span-7 flex flex-col justify-between h-full py-1">
              <p className="font-body text-xs sm:text-sm text-[#1d1b19] font-medium leading-relaxed italic mb-4">
                "Our marketing teams have cracked the code of using PitchPleaseAI as an agentic partner in our day-to-day lives, transforming how we work, collaborate, and evolve as an organization."
              </p>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <span className="font-mono font-bold text-sm text-slate-800">&lt;epam&gt;</span>
              </div>
            </div>
          </motion.div>

          {/* ROW 2: Tile 5 - Light Pink Stat Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="bg-[#fce7f3] rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[220px] shadow-xs hover:shadow-md transition-all"
          >
            <div>
              <div className="font-serif text-4xl sm:text-5xl font-normal text-[#9d174d] tracking-tight mb-2">
                60%
              </div>
              <p className="font-body text-xs sm:text-sm font-semibold text-[#be185d] leading-relaxed">
                of festival & social campaigns now automated with PitchPleaseAI
              </p>
            </div>

            <div className="pt-6 border-t border-[#fbcfe8]/60">
              <span className="font-headline font-bold text-xs uppercase tracking-widest text-[#9d174d]">
                ANTHROPOLOGIE
              </span>
            </div>
          </motion.div>

          {/* ROW 2: Tile 6 - Light Yellow Stat Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="bg-[#fef9c3] rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[220px] shadow-xs hover:shadow-md transition-all"
          >
            <div>
              <div className="font-serif text-4xl sm:text-5xl font-normal text-[#854d0e] tracking-tight mb-2">
                7,500
              </div>
              <p className="font-body text-xs sm:text-sm font-semibold text-[#a16207] leading-relaxed">
                product descriptions and social posts written by PitchPleaseAI in 24 hours
              </p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[#fef08a]/60">
              <span className="font-headline font-extrabold text-sm tracking-wider text-[#854d0e] uppercase">
                adidas
              </span>
              <ArrowRight className="w-4 h-4 text-[#854d0e]" />
            </div>
          </motion.div>


          {/* ROW 3: Tile 7 - Light Blue 3x Stat Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="bg-[#e0f2fe] rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[200px] shadow-xs hover:shadow-md transition-all"
          >
            <div>
              <div className="font-serif text-4xl sm:text-5xl font-normal text-[#0369a1] tracking-tight mb-2">
                3x
              </div>
              <p className="font-body text-xs sm:text-sm font-semibold text-[#0284c7]">
                content production
              </p>
            </div>
          </motion.div>

          {/* ROW 3: Tile 8 - Light Green Time-to-Market Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="bg-[#dcfce7] rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[200px] shadow-xs hover:shadow-md transition-all"
          >
            <div>
              <div className="font-serif text-2xl sm:text-3xl font-normal text-[#166534] tracking-tight mb-2">
                Time-to-market
              </div>
              <p className="font-body text-xs sm:text-sm font-semibold text-[#15803d]">
                Faster end-to-end campaigns
              </p>
            </div>
          </motion.div>

          {/* ROW 3: Tile 9 - Double Column Review Card (Bryan Olshock) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-[#e6e2de] shadow-xs hover:shadow-md transition-all grid sm:grid-cols-12 gap-6 items-center min-h-[200px]"
          >
            {/* Image with overlay badge */}
            <div className="sm:col-span-5 relative rounded-2xl overflow-hidden aspect-4/3 sm:aspect-square bg-slate-100">
              <img
                src="/headshot_growth_lead.png"
                alt="Bryan Olshock"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 text-white p-2 rounded-xl backdrop-blur-xs">
                <div className="font-bold text-xs">Bryan Olshock</div>
                <div className="text-[10px] text-slate-300">Growth Marketing Lead</div>
              </div>
            </div>

            {/* Quote content */}
            <div className="sm:col-span-7 flex flex-col justify-between h-full py-1">
              <p className="font-body text-[#1d1b19] font-medium italic leading-relaxed text-sm sm:text-base mb-6">
                "PitchPleaseAI has the potential to fundamentally transform the way marketing teams operate by boosting efficiency, accelerating execution, and delivering high-quality campaigns faster."
              </p>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <span className="font-headline font-bold text-xs tracking-widest text-slate-800 uppercase">ULTA BEAUTY</span>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
