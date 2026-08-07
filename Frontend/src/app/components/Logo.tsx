import { ArrowUp, Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { container: 'w-8 h-8', text: 'text-lg', subtext: 'text-xs' },
    md: { container: 'w-10 h-10', text: 'text-xl', subtext: 'text-sm' },
    lg: { container: 'w-14 h-14', text: 'text-3xl', subtext: 'text-base' }
  };

  const currentSize = sizes[size];

  return (
    <div className="flex items-center gap-3">
      {/* Logo Icon - Bridge with Growth in Warm Premium Coral & Violet */}
      <div className={`${currentSize.container} relative flex items-center justify-center`}>
        <svg viewBox="0 0 40 40" className="w-full h-full">
          {/* Bridge arcs */}
          <path
            d="M 5 25 Q 12 15, 20 25 Q 28 15, 35 25"
            stroke="#e8432e"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Connection nodes */}
          <circle cx="12" cy="22" r="2.5" fill="#5647c8" />
          <circle cx="20" cy="25" r="2.5" fill="#e8432e" />
          <circle cx="28" cy="22" r="2.5" fill="#5647c8" />
          {/* Growth arrow */}
          <path
            d="M 20 25 L 20 12 M 17 15 L 20 12 L 23 15"
            stroke="#e8432e"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="translate"
              values="0,0; 0,-2; 0,0"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>
          {/* AI Spark */}
          <circle cx="22" cy="10" r="1.5" fill="#7c6ff0" className="animate-pulse" />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${currentSize.text} font-headline font-bold text-[#1d1b19] tracking-tight`}>
            PitchPlease<span className="text-[#e8432e]">AI</span>
          </span>
        </div>
      )}
    </div>
  );
}