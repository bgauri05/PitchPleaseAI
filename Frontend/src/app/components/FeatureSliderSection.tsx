import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function FeatureSliderSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      gridColor: 'bg-[#16a34a]', // Vibrant green grid theme matching screenshot 2
      gridPatternColor: 'rgba(255,255,255,0.22)',
      titleBadge: 'Create 6,000 hyper-personalized emails & posts within minutes',
      statValue: '11x',
      statLabel: 'CLICK-THROUGH RATE',
      statBg: 'bg-[#1d4ed8] text-white',
      personImg: '/slide_person_2.png',
      accentColor: '#ec4899',
    },
    {
      id: 2,
      gridColor: 'bg-[#0284c7]', // Blue grid theme
      gridPatternColor: 'rgba(255,255,255,0.22)',
      titleBadge: 'Optimize 2,000 web pages & social campaigns for search, instantly',
      statValue: '+67%',
      statLabel: 'ORGANIC TRAFFIC',
      statBg: 'bg-[#22c55e] text-[#052e16]',
      personImg: '/slide_person_1.png',
      accentColor: '#facc15',
    },
    {
      id: 3,
      gridColor: 'bg-[#9333ea]', // Purple grid theme
      gridPatternColor: 'rgba(255,255,255,0.22)',
      titleBadge: 'Auto-pilot festival marketing & regional Hindi campaigns in seconds',
      statValue: '99.2%',
      statLabel: 'BRAND VOICE FIDELITY',
      statBg: 'bg-[#f59e0b] text-[#451a03]',
      personImg: '/slide_person_3.png',
      accentColor: '#06b6d4',
    },
  ];

  // Auto-play interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide] || slides[0];

  return (
    <section className="w-full bg-white pb-12 pt-4 relative z-10 overflow-hidden">
      {/* Full Width Sliding Carousel Banner */}
      <div className="w-full relative overflow-hidden min-h-[440px] sm:min-h-[520px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="w-full h-full min-h-[440px] sm:min-h-[520px] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden"
          >
            
            {/* Full Width Background Grid Pattern */}
            <div 
              className={`absolute inset-0 ${slide.gridColor} opacity-95 transition-colors duration-500`}
              style={{
                backgroundImage: `linear-gradient(to right, ${slide.gridPatternColor} 1px, transparent 1px), linear-gradient(to bottom, ${slide.gridPatternColor} 1px, transparent 1px)`,
                backgroundSize: '36px 36px',
              }}
            />

            {/* Green Circles Vertical Motif (Left Side) */}
            <div className="absolute left-10 bottom-0 hidden lg:flex flex-col gap-3 z-10 pointer-events-none opacity-85">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-12 h-12 rounded-full bg-[#15803d]" />
              ))}
            </div>

            {/* Pink / Yellow Diagonal Stripes Motif (Right Side) */}
            <div 
              className="absolute right-16 top-10 w-44 h-44 pointer-events-none hidden lg:block opacity-80"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, ${slide.accentColor}, ${slide.accentColor} 12px, transparent 12px, transparent 24px)`
              }}
            />

            {/* Slide Inner Contents Stack (Max 5xl centered across full-width) */}
            <div className="relative z-20 w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12 px-4 sm:px-12">
              
              {/* Floating Badge 1 (Left White Card) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-100 max-w-xs sm:max-w-sm flex items-start gap-3 relative z-30"
              >
                <div className="w-7 h-7 rounded-full bg-[#b51d0d] text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-xs">
                  j
                </div>
                <p className="font-serif text-base sm:text-lg font-medium text-slate-900 leading-snug">
                  {slide.titleBadge}
                </p>
              </motion.div>

              {/* Center Cutout Person Image */}
              <div className="relative w-52 h-52 sm:w-72 sm:h-72 md:w-80 md:h-80 shrink-0 flex items-end justify-center">
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  src={slide.personImg}
                  alt="BrandSetu User"
                  className="w-full h-full object-cover object-top filter drop-shadow-2xl"
                />
              </div>

              {/* Floating Stat Badge 2 (Right Solid Card) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`${slide.statBg} rounded-2xl p-5 sm:p-6 shadow-2xl border border-white/20 max-w-xs shrink-0 relative z-30 min-w-[170px] text-center md:text-left`}
              >
                <div className="text-[11px] uppercase tracking-widest font-bold opacity-90 mb-1">
                  {slide.statLabel}
                </div>
                <div className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
                  {slide.statValue}
                </div>
              </motion.div>

            </div>

          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={handlePrev}
          aria-label="Previous Slide"
          className="absolute left-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-xl flex items-center justify-center transition-all hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next Slide"
          className="absolute right-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-xl flex items-center justify-center transition-all hover:scale-110"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Indicators / Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                currentSlide === idx ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>

      </div>

    </section>
  );
}
