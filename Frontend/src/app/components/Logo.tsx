import { ArrowUp, Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  /** 'dark' renders white text/strokes for use on black sections (e.g. the
   * footer) — the default black strokes were invisible against bg-[#0A0A0A]. */
  variant?: 'light' | 'dark';
}

export function Logo({ size = 'md', showText = true, variant = 'light' }: LogoProps) {
  const sizes = {
    sm: { container: 'w-8 h-8', text: 'text-lg', subtext: 'text-xs' },
    md: { container: 'w-10 h-10', text: 'text-xl', subtext: 'text-sm' },
    lg: { container: 'w-14 h-14', text: 'text-3xl', subtext: 'text-base' }
  };

  const currentSize = sizes[size];
  const strokeColor = variant === 'dark' ? '#FFFFFF' : '#0A0A0A';
  const textColor = variant === 'dark' ? 'text-white' : 'text-[#111111]';

  return (
    <div className="flex items-center gap-3">
      {/* Logo Icon - Bridge with Growth, Bold Black & Acid Yellow */}
      <div className={`${currentSize.container} relative flex items-center justify-center`}>
        <svg viewBox="0 0 40 40" className="w-full h-full">
          {/* Bridge arcs */}
          <path
            d="M 5 25 Q 12 15, 20 25 Q 28 15, 35 25"
            stroke={strokeColor}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Connection nodes */}
          <circle cx="12" cy="22" r="2.5" fill={strokeColor} />
          <circle cx="20" cy="25" r="2.5" fill="#E4FF3D" />
          <circle cx="28" cy="22" r="2.5" fill={strokeColor} />
          {/* Growth arrow */}
          <path
            d="M 20 25 L 20 12 M 17 15 L 20 12 L 23 15"
            stroke={strokeColor}
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
          <circle cx="22" cy="10" r="1.5" fill="#E4FF3D" className="animate-pulse" />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${currentSize.text} font-headline font-extrabold ${textColor} tracking-tight`}>
            PitchPlease<span className="text-[#0A0A0A] bg-[#E4FF3D] px-1 rounded">AI</span>
          </span>
        </div>
      )}
    </div>
  );
}
