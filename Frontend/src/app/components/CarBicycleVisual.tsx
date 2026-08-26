import { motion } from 'motion/react';
import { ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';
import { Link } from 'react-router';

export function CarBicycleVisual() {
  return (
    <div className="w-full max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fef2f2]/60 to-[#fee2e2]/40 rounded-3xl p-6 sm:p-8 border-2 border-[#fca5a5]/60 shadow-[0_20px_50px_rgba(181,29,13,0.1)] relative overflow-hidden flex flex-col items-center justify-between text-center">
      
      {/* Top Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#facc15]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#0A0A0A]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Caption */}
      <div className="mb-4 relative z-10 w-full">
        <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#0A0A0A] to-[#dc2626] text-white text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest px-3.5 py-1 rounded-full mb-3 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#facc15]" />
          <span>The Marketing Dilemma</span>
        </div>
        
        <h3 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#111111] leading-tight uppercase tracking-tight">
          Brand Without<br />
          <span className="text-[#0A0A0A] font-serif italic text-3xl sm:text-4xl underline decoration-[#facc15] decoration-wavy decoration-2">
            Digital Marketing
          </span><br />
          <span className="bg-[#111111] text-[#facc15] px-3 py-1 rounded-xl text-xl sm:text-2xl mt-1.5 inline-block shadow-md border border-[#38332e]">
            Just Looks Like This
          </span>
        </h3>
      </div>

      {/* Center Canvas with Grid Pattern & Animated Car */}
      <div className="relative w-full h-56 sm:h-64 my-3 flex items-center justify-center bg-[#fef9c3]/40 rounded-2xl border border-[#fef08a] p-3 overflow-hidden shadow-inner">
        
        {/* Colorful Grid Lines Backdrop */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(239,68,68,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(239,68,68,0.2) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <svg
          viewBox="0 0 450 260"
          className="w-full h-full max-w-[400px] relative z-10 drop-shadow-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ground Shadow */}
          <ellipse cx="225" cy="245" rx="170" ry="10" fill="#111111" opacity="0.15" />

          {/* VISIBLE BICYCLE FRAME UNDER THE CAR (Vibrant Orange & Yellow Chassis) */}
          <g>
            {/* Rear Frame Triangle */}
            <path d="M130 205 L180 205 L215 165 Z" fill="none" stroke="#ea580c" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
            
            {/* Bottom Horizontal Bar connecting to front wheel area */}
            <path d="M180 205 L250 205 M250 205 L320 205" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />
            
            {/* Diagonal Fork / Downtube towards Front Wheel */}
            <path d="M215 165 L320 205" stroke="#ea580c" strokeWidth="5" strokeLinecap="round" />
            
            {/* Seat Post and Saddle Stub sticking up */}
            <line x1="215" y1="165" x2="215" y2="150" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="215" cy="148" rx="12" ry="4" fill="#1e293b" />
            
            {/* Pedal Crankset */}
            <circle cx="180" cy="205" r="6" fill="#1e293b" />
            <line x1="180" y1="205" x2="192" y2="217" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <line x1="180" y1="205" x2="168" y2="193" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* Front & Rear Bicycle Wheels with Spin Rotation & Golden Rims */}
          {/* Rear Bicycle Wheel (Left) */}
          <g transform="translate(130, 205)">
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
            >
              <circle cx="0" cy="0" r="35" stroke="#1e293b" strokeWidth="6" fill="none" />
              <circle cx="0" cy="0" r="30" stroke="#facc15" strokeWidth="3.5" fill="none" />
              <circle cx="0" cy="0" r="7" fill="#dc2626" />
              <line x1="-30" y1="0" x2="30" y2="0" stroke="#0284c7" strokeWidth="2" />
              <line x1="0" y1="-30" x2="0" y2="30" stroke="#0284c7" strokeWidth="2" />
              <line x1="-21" y1="-21" x2="21" y2="21" stroke="#0284c7" strokeWidth="2" />
              <line x1="-21" y1="21" x2="21" y2="-21" stroke="#0284c7" strokeWidth="2" />
            </motion.g>
          </g>

          {/* Front Bicycle Wheel (Right) */}
          <g transform="translate(320, 205)">
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
            >
              <circle cx="0" cy="0" r="35" stroke="#1e293b" strokeWidth="6" fill="none" />
              <circle cx="0" cy="0" r="30" stroke="#facc15" strokeWidth="3.5" fill="none" />
              <circle cx="0" cy="0" r="7" fill="#dc2626" />
              <line x1="-30" y1="0" x2="30" y2="0" stroke="#0284c7" strokeWidth="2" />
              <line x1="0" y1="-30" x2="0" y2="30" stroke="#0284c7" strokeWidth="2" />
              <line x1="-21" y1="-21" x2="21" y2="21" stroke="#0284c7" strokeWidth="2" />
              <line x1="-21" y1="21" x2="21" y2="-21" stroke="#0284c7" strokeWidth="2" />
            </motion.g>
          </g>

          {/* Glossy Cherry Red Beetle Car Shell Body */}
          <g transform="translate(0, 10)">
            <path
              d="M70 170 C60 170 50 160 55 145 C65 120 100 80 160 55 C220 30 300 45 360 85 C400 110 415 135 420 155 C425 170 410 170 395 170 C370 170 355 170 350 170 C345 150 330 135 310 135 C290 135 275 150 270 170 C240 170 180 170 170 170 C165 150 150 135 130 135 C110 135 95 150 90 170 Z"
              fill="#dc2626"
              stroke="#991b1b"
              strokeWidth="4.5"
            />

            {/* Roof Gloss Highlight */}
            <path
              d="M135 95 C175 60 270 50 345 95"
              stroke="#f87171"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />

            {/* Tinted Cyan Windows */}
            <path
              d="M150 95 C180 72 230 68 235 95 Z"
              fill="#e0f2fe"
              stroke="#991b1b"
              strokeWidth="3"
            />
            <path
              d="M245 95 C250 68 300 72 335 95 Z"
              fill="#e0f2fe"
              stroke="#991b1b"
              strokeWidth="3"
            />

            {/* Chrome Details */}
            <rect x="230" y="125" width="24" height="5" rx="2" fill="#facc15" stroke="#991b1b" strokeWidth="1" />
            <path d="M50 155 C50 155 70 145 90 155" stroke="#facc15" strokeWidth="3.5" fill="none" />
            <path d="M370 155 C370 155 390 145 410 155" stroke="#facc15" strokeWidth="3.5" fill="none" />

            {/* Bumpers */}
            <rect x="38" y="160" width="28" height="12" rx="4" fill="#f1f5f9" stroke="#991b1b" strokeWidth="2.5" />
            <rect x="402" y="160" width="28" height="12" rx="4" fill="#f1f5f9" stroke="#991b1b" strokeWidth="2.5" />
          </g>
        </svg>
      </div>

      {/* Bottom Solution Box & CTA */}
      <div className="mt-2 pt-4 border-t border-[#fca5a5]/50 relative z-10 w-full text-center bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-white/60 shadow-xs">
        <p className="font-body text-xs sm:text-sm font-semibold text-[#111111] leading-relaxed mb-3">
          Our <span className="text-[#0A0A0A] font-bold">AI marketing agents</span> actually know your brand voice & festival calendar to put your growth in full gear.
        </p>

        <Link
          to="/setup"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#0A0A0A] to-[#dc2626] hover:from-[#262626] hover:to-[#ef4444] text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 group"
        >
          <span>Get AI Agents Now</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

    </div>
  );
}
