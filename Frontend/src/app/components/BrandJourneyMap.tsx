import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Search, Sparkles, ShieldCheck, ArrowRight, MapPin, CheckCircle2, Play, Pause } from 'lucide-react';
import { Link } from 'react-router';

interface JourneyPhase {
  id: number;
  title: string;
  agent: string;
  tagline: string;
  description: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  icon: typeof Search;
  xPct: number; // percentage along map path (0 to 100)
  xPos: number; // SVG X coordinate
  yPos: number; // SVG Y coordinate
  sample: string;
}

export function BrandJourneyMap() {
  const [activePhase, setActivePhase] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const phases: JourneyPhase[] = [
    {
      id: 1,
      title: 'Phase 1: Research & Memory',
      agent: 'Researcher Agent',
      tagline: 'Trend + Brand Context Ingestion',
      description: 'Scans your style guide, past successful posts, and festival calendar to assemble high-impact content themes.',
      badgeColor: 'bg-[#16a34a] text-white',
      borderColor: 'border-[#86efac]',
      bgColor: 'bg-[#e8fbe9]',
      textColor: 'text-[#14532d]',
      icon: Search,
      xPct: 15,
      xPos: 140,
      yPos: 140,
      sample: '🔍 Identified 3 trending Holi campaign angles tailored for retail fashion'
    },
    {
      id: 2,
      title: 'Phase 2: Content Creation',
      agent: 'Creator Agent',
      tagline: 'Multi-Channel Copy & Asset Generation',
      description: 'Drafts platform-native captions, emojis, and hashtags optimized for LinkedIn, Instagram, WhatsApp, and Twitter.',
      badgeColor: 'bg-[#ea580c] text-white',
      borderColor: 'border-[#fdba74]',
      bgColor: 'bg-[#fff0ed]',
      textColor: 'text-[#7c2d12]',
      icon: Sparkles,
      xPct: 50,
      xPos: 500,
      yPos: 100,
      sample: '✨ Created 3 caption variations with localized Hindi & English hooks'
    },
    {
      id: 3,
      title: 'Phase 3: Sentinel & Launch',
      agent: 'Sentinel Agent',
      tagline: 'Brand Guardrail Critique & Auto-Publishing',
      description: 'Inspects every draft against tone rules. Flags generic corporate jargon and refines copy automatically before scheduling.',
      badgeColor: 'bg-[#2563eb] text-white',
      borderColor: 'border-[#93c5fd]',
      bgColor: 'bg-[#ebf5ff]',
      textColor: 'text-[#1e3a8a]',
      icon: ShieldCheck,
      xPct: 85,
      xPos: 860,
      yPos: 140,
      sample: '🛡️ Sentinel Clearance 99.2%: Off-brand phrasing removed. Post Scheduled!'
    }
  ];

  // Auto-drive timer between phases if playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActivePhase((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentPhaseObj = phases.find((p) => p.id === activePhase) || phases[0];

  // Calculate car position based on active phase
  const carTarget = {
    x: currentPhaseObj.xPos - 80, // offset car center
    y: currentPhaseObj.yPos - 55,
  };

  return (
    <section id="how-it-works" className="py-24 relative z-10 bg-white overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-[#f8f3ef] border border-[#e4beb7]/50 px-4 py-1.5 rounded-full mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#b51d0d]">
              Interactive Autonomous Roadmap
            </span>
          </div>
          <h2 className="font-headline text-4xl lg:text-5xl font-extrabold text-[#1d1b19] mb-4 tracking-tight">
            How PitchPleaseAI Works
          </h2>
          <p className="font-body text-base sm:text-lg text-[#5b403c] leading-relaxed">
            Follow our <strong className="text-[#b51d0d]">Red AI Agent Car</strong> as it travels across 3 autonomous destinations to turn raw brand memory into verified social campaigns.
          </p>
        </div>

        {/* ROADMAP SVG MAP CANVAS */}
        <div className="relative w-full bg-[#fcfaf7] border border-[#e6e2de] rounded-3xl p-6 sm:p-10 mb-10 shadow-[0_12px_36px_rgba(18,17,15,0.04)] overflow-hidden">
          
          {/* Controls Bar Top Right */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#e6e2de] shadow-xs text-xs font-semibold text-[#5b403c]">
            <span>Auto Tour</span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 rounded-lg hover:bg-[#f8f3ef] text-[#1d1b19] transition-colors"
              title={isPlaying ? 'Pause Animation' : 'Play Animation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#b51d0d]" /> : <Play className="w-3.5 h-3.5 text-[#136948]" />}
            </button>
          </div>

          {/* SVG Map Container */}
          <div className="relative w-full h-[220px] sm:h-[260px]">
            <svg viewBox="0 0 1000 240" className="w-full h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
              
              {/* Background Grid Pattern Lines */}
              <defs>
                <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e6e2de" strokeWidth="0.8" strokeDasharray="2 2" />
                </pattern>
              </defs>
              <rect width="1000" height="240" fill="url(#mapGrid)" opacity="0.6" />

              {/* Curved Winding Road Line */}
              <path
                d="M 60 140 C 250 140, 350 100, 500 100 C 650 100, 750 140, 940 140"
                stroke="#d1d5db"
                strokeWidth="24"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 60 140 C 250 140, 350 100, 500 100 C 650 100, 750 140, 940 140"
                stroke="#ffffff"
                strokeWidth="4"
                strokeDasharray="12 12"
                strokeLinecap="round"
                fill="none"
              />

              {/* 3 DESTINATION MAP PINS */}
              {phases.map((phase) => {
                const isActive = activePhase === phase.id;
                const Icon = phase.icon;
                return (
                  <g
                    key={phase.id}
                    transform={`translate(${phase.xPos}, ${phase.yPos})`}
                    onClick={() => { setActivePhase(phase.id); setIsPlaying(false); }}
                    className="cursor-pointer group"
                  >
                    {/* Ripple Pulse Rings when Active */}
                    {isActive && (
                      <circle cx="0" cy="0" r="28" fill="#b51d0d" opacity="0.15">
                        <animate attributeName="r" values="24;36;24" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Pin Circle */}
                    <circle
                      cx="0"
                      cy="0"
                      r="18"
                      fill={isActive ? '#b51d0d' : '#ffffff'}
                      stroke={isActive ? '#831005' : '#94a3b8'}
                      strokeWidth="3"
                      className="transition-all duration-300 shadow-md"
                    />

                    {/* Number Badge */}
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fill={isActive ? '#ffffff' : '#1e293b'}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {phase.id}
                    </text>

                    {/* Pin Tooltip Tag Top */}
                    <g transform="translate(0, -32)">
                      <rect
                        x="-60"
                        y="-12"
                        width="120"
                        height="22"
                        rx="11"
                        fill={isActive ? '#1d1b19' : '#ffffff'}
                        stroke={isActive ? '#b51d0d' : '#e2e8f0'}
                        strokeWidth="1.5"
                        className="shadow-sm"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill={isActive ? '#ffffff' : '#475569'}
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {phase.agent.split(' ')[0]} Agent
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* ANIMATED RED CAR ON BICYCLE WHEELS SMOOTHLY MOVING ALONG ROAD */}
              <motion.g
                animate={{ x: carTarget.x, y: carTarget.y }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              >
                <g transform="scale(0.55)">
                  {/* Background Car Shadow */}
                  <ellipse cx="140" cy="115" rx="80" ry="6" fill="#000000" opacity="0.2" />

                  {/* Bicycle Frame Structure Underneath */}
                  <g>
                    <path d="M90 96 L125 96 L145 75 Z" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    <path d="M125 96 L190 96" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M145 75 L190 96" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="145" y1="75" x2="145" y2="68" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
                  </g>

                  {/* Rear Bicycle Wheel (Left) - Continuously Rotating */}
                  <g transform="translate(90, 96)">
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                    >
                      <circle cx="0" cy="0" r="18" stroke="#1E293B" strokeWidth="3" fill="none" />
                      <circle cx="0" cy="0" r="15" stroke="#F97316" strokeWidth="1.5" fill="none" />
                      <circle cx="0" cy="0" r="3" fill="#1E293B" />
                      <line x1="-15" y1="0" x2="15" y2="0" stroke="#94A3B8" strokeWidth="1" />
                      <line x1="0" y1="-15" x2="0" y2="15" stroke="#94A3B8" strokeWidth="1" />
                    </motion.g>
                  </g>

                  {/* Front Bicycle Wheel (Right) - Continuously Rotating */}
                  <g transform="translate(190, 96)">
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                    >
                      <circle cx="0" cy="0" r="18" stroke="#1E293B" strokeWidth="3" fill="none" />
                      <circle cx="0" cy="0" r="15" stroke="#F97316" strokeWidth="1.5" fill="none" />
                      <circle cx="0" cy="0" r="3" fill="#1E293B" />
                      <line x1="-15" y1="0" x2="15" y2="0" stroke="#94A3B8" strokeWidth="1" />
                      <line x1="0" y1="-15" x2="0" y2="15" stroke="#94A3B8" strokeWidth="1" />
                    </motion.g>
                  </g>

                  {/* RED Beetle Car Shell Body */}
                  <g transform="translate(0, 0)">
                    <path
                      d="M50 85 C45 85 40 80 43 72 C48 60 70 40 100 28 C130 15 170 22 200 42 C220 55 228 68 230 78 C233 85 225 85 218 85 C205 85 198 85 195 85 C192 75 185 68 175 68 C165 68 158 75 155 85 C140 85 110 85 105 85 C102 75 95 68 85 68 C75 68 68 75 65 85 Z"
                      fill="#b51d0d"
                      stroke="#831005"
                      strokeWidth="3"
                    />
                    {/* Roof Highlight */}
                    <path d="M85 48 C105 30 155 25 192 48" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    {/* Windows */}
                    <path d="M95 48 C110 36 135 34 138 48 Z" fill="#FEF2F2" stroke="#831005" strokeWidth="1.5" />
                    <path d="M145 48 C148 34 172 36 190 48 Z" fill="#FEF2F2" stroke="#831005" strokeWidth="1.5" />
                    {/* Bumpers */}
                    <rect x="35" y="80" width="12" height="5" rx="2" fill="#CBD5E1" stroke="#831005" strokeWidth="1" />
                    <rect x="225" y="80" width="12" height="5" rx="2" fill="#CBD5E1" stroke="#831005" strokeWidth="1" />
                  </g>
                </g>
              </motion.g>
            </svg>
          </div>
        </div>

        {/* 3 DESTINATION DETAIL CARDS - RECTANGULAR SHARP FORMAT MATCHING USER REFERENCE */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6 max-w-6xl mx-auto">
          
          {/* CARD 1: AGENTS (Light Green - Sharp Rectangular) */}
          <motion.div
            onClick={() => { setActivePhase(1); setIsPlaying(false); }}
            whileHover={{ y: -4 }}
            className={`p-4 sm:p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden bg-[#86efac] text-[#14532d] rounded-none shadow-xs hover:shadow-md ${
              activePhase === 1 ? 'ring-2 ring-[#16a34a]' : 'border border-[#4ade80]'
            }`}
          >
            <div>
              {/* Header Title */}
              <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#14532d] mb-4">
                Agents
              </h3>

              {/* Center SVG Grid Diagram Box - Edge to Edge Square */}
              <div className="relative w-full h-36 sm:h-44 overflow-hidden bg-[#bbf7d0] border-y border-[#4ade80] mb-4 flex items-center justify-center">
                <svg viewBox="0 0 300 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="sharpGreenGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.8" />
                    </pattern>
                  </defs>
                  <rect width="300" height="160" fill="url(#sharpGreenGrid)" />

                  {/* Document Card 1 */}
                  <rect x="70" y="25" width="60" height="70" fill="#ffffff" stroke="#15803d" strokeWidth="2.5" />
                  <line x1="80" y1="40" x2="118" y2="40" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="square" />
                  <line x1="80" y1="52" x2="115" y2="52" stroke="#16a34a" strokeWidth="2" strokeLinecap="square" />
                  <line x1="80" y1="64" x2="120" y2="64" stroke="#16a34a" strokeWidth="2" strokeLinecap="square" />
                  <line x1="80" y1="76" x2="105" y2="76" stroke="#16a34a" strokeWidth="2" strokeLinecap="square" />

                  {/* Document Card 2 with Avatar Box */}
                  <rect x="145" y="32" width="55" height="60" fill="#ffffff" stroke="#15803d" strokeWidth="2.5" />
                  <rect x="153" y="40" width="20" height="20" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" />
                  <circle cx="163" cy="48" r="4" fill="#15803d" />
                  <line x1="153" y1="70" x2="190" y2="70" stroke="#16a34a" strokeWidth="2" strokeLinecap="square" />
                  <line x1="153" y1="80" x2="182" y2="80" stroke="#16a34a" strokeWidth="2" strokeLinecap="square" />

                  {/* Bottom Card */}
                  <rect x="100" y="105" width="70" height="32" fill="#ffffff" stroke="#15803d" strokeWidth="2.5" />
                  <rect x="110" y="113" width="30" height="5" fill="#22c55e" />
                  <line x1="110" y1="125" x2="155" y2="125" stroke="#16a34a" strokeWidth="2" strokeLinecap="square" />

                  {/* Green Highlights & Cursor Arrow */}
                  <rect x="108" y="95" width="24" height="10" fill="#4ade80" opacity="0.8" />
                  <polygon points="50,55 65,47 60,65 55,60" fill="#15803d" />
                  <polygon points="190,135 210,155 185,145" fill="#15803d" />

                  {/* Starbursts */}
                  <path d="M210 75 L213 67 L216 75 L224 78 L216 81 L213 89 L210 81 L202 78 Z" fill="none" stroke="#15803d" strokeWidth="1.5" />
                  <path d="M110 98 L111 93 L113 98 L118 99 L113 101 L111 106 L110 101 L105 99 Z" fill="#15803d" />
                </svg>
              </div>
            </div>

            {/* Bottom Footer Description */}
            <div className="pt-2 flex items-center justify-between">
              <p className="font-body text-xs font-semibold text-[#14532d] leading-snug">
                Purpose-built AI agents that execute real marketing work.
              </p>
              <ArrowRight className="w-4 h-4 text-[#14532d] shrink-0 ml-2" />
            </div>
          </motion.div>


          {/* CARD 2: CONTENT PIPELINES (Light Peach/Rose - Sharp Rectangular) */}
          <motion.div
            onClick={() => { setActivePhase(2); setIsPlaying(false); }}
            whileHover={{ y: -4 }}
            className={`p-4 sm:p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden bg-[#ffedd5] text-[#7c2d12] rounded-none shadow-xs hover:shadow-md ${
              activePhase === 2 ? 'ring-2 ring-[#ea580c]' : 'border border-[#fed7aa]'
            }`}
          >
            <div>
              {/* Header Title */}
              <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#7c2d12] mb-4">
                Content Pipelines
              </h3>

              {/* Center SVG Grid Diagram Box - Edge to Edge Square */}
              <div className="relative w-full h-36 sm:h-44 overflow-hidden bg-[#fed7aa] border-y border-[#fdba74] mb-4 flex items-center justify-center">
                <svg viewBox="0 0 300 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="sharpPeachGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#fdba74" strokeWidth="1" opacity="0.8" />
                    </pattern>
                  </defs>
                  <rect width="300" height="160" fill="url(#sharpPeachGrid)" />

                  {/* Top Left Card Node */}
                  <rect x="60" y="35" width="75" height="42" fill="#ffffff" stroke="#9a3412" strokeWidth="2.5" />
                  <circle cx="74" cy="48" r="3.5" fill="#ea580c" />
                  <line x1="85" y1="48" x2="120" y2="48" stroke="#ea580c" strokeWidth="2" strokeLinecap="square" />
                  <line x1="74" y1="62" x2="112" y2="62" stroke="#ea580c" strokeWidth="2" strokeLinecap="square" />

                  {/* Flow Arrow Connection */}
                  <path d="M135 56 L165 56 C175 56, 185 66, 185 76 L185 88" stroke="#9a3412" strokeWidth="2.5" fill="none" strokeDasharray="3 2" />
                  <circle cx="165" cy="56" r="3.5" fill="#9a3412" />
                  <polygon points="185,91 181,83 189,83" fill="#9a3412" />

                  {/* Bottom Right Card Node */}
                  <rect x="145" y="92" width="75" height="42" fill="#ffffff" stroke="#9a3412" strokeWidth="2.5" />
                  <rect x="155" y="102" width="16" height="4" fill="#ea580c" />
                  <line x1="155" y1="114" x2="205" y2="114" stroke="#ea580c" strokeWidth="2" strokeLinecap="square" />
                  <line x1="155" y1="124" x2="192" y2="124" stroke="#ea580c" strokeWidth="2" strokeLinecap="square" />

                  {/* Solid Orange Triangle Accent */}
                  <polygon points="125,122 148,122 136.5,100" fill="#ea580c" />
                </svg>
              </div>
            </div>

            {/* Bottom Footer Description */}
            <div className="pt-2 flex items-center justify-between">
              <p className="font-body text-xs font-semibold text-[#7c2d12] leading-snug">
                Repeatable workflows that move work from idea to launch.
              </p>
              <ArrowRight className="w-4 h-4 text-[#7c2d12] shrink-0 ml-2" />
            </div>
          </motion.div>


          {/* CARD 3: BRANDSETU IQ (Light Blue - Sharp Rectangular) */}
          <motion.div
            onClick={() => { setActivePhase(3); setIsPlaying(false); }}
            whileHover={{ y: -4 }}
            className={`p-4 sm:p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden bg-[#bae6fd] text-[#1e3a8a] rounded-none shadow-xs hover:shadow-md ${
              activePhase === 3 ? 'ring-2 ring-[#2563eb]' : 'border border-[#7dd3fc]'
            }`}
          >
            <div>
              {/* Header Title */}
              <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1e3a8a] mb-4">
                PitchPleaseAI IQ
              </h3>

              {/* Center SVG Grid Diagram Box - Edge to Edge Square */}
              <div className="relative w-full h-36 sm:h-44 overflow-hidden bg-[#7dd3fc]/50 border-y border-[#38bdf8] mb-4 flex items-center justify-center">
                <svg viewBox="0 0 300 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="sharpBlueGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.8" />
                    </pattern>
                  </defs>
                  <rect width="300" height="160" fill="url(#sharpBlueGrid)" />

                  {/* Elliptical Atomic Orbits */}
                  <g transform="translate(150, 80)">
                    <ellipse cx="0" cy="0" rx="60" ry="26" stroke="#1e3a8a" strokeWidth="2.5" fill="none" transform="rotate(-25)" />
                    <ellipse cx="0" cy="0" rx="60" ry="26" stroke="#1e3a8a" strokeWidth="2.5" fill="none" transform="rotate(35)" />
                    <ellipse cx="0" cy="0" rx="60" ry="26" stroke="#1e3a8a" strokeWidth="2.5" fill="none" transform="rotate(90)" />

                    {/* Central Core Node */}
                    <circle cx="0" cy="0" r="11" fill="#0284c7" stroke="#1e3a8a" strokeWidth="2" />
                    <circle cx="0" cy="0" r="4" fill="#ffffff" />
                  </g>

                  {/* Floating Geometric Elements */}
                  <rect x="195" y="118" width="12" height="12" fill="#1e3a8a" />
                  <polygon points="75,98 88,118 68,118" stroke="#1e3a8a" strokeWidth="2" fill="none" />
                  <polygon points="210,50 222,38 222,58" fill="#0284c7" />

                  {/* Sparkles */}
                  <path d="M90 50 L92 42 L94 50 L102 52 L94 54 L92 62 L90 54 L82 52 Z" fill="#1e3a8a" />
                  <path d="M205 82 L206 77 L208 82 L213 83 L208 84 L206 89 L205 84 L200 83 Z" fill="#1e3a8a" />
                </svg>
              </div>
            </div>

            {/* Bottom Footer Description */}
            <div className="pt-2 flex items-center justify-between">
              <p className="font-body text-xs font-semibold text-[#1e3a8a] leading-snug">
                Maintain quality & authenticity with a rich context hub.
              </p>
              <ArrowRight className="w-4 h-4 text-[#1e3a8a] shrink-0 ml-2" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
