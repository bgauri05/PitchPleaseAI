import React from 'react';
import { Search, Sparkles, ShieldCheck } from 'lucide-react';

interface AgentPipelineBadgeProps {
  activeStep?: 'researcher' | 'creator' | 'sentinel' | 'all';
  compact?: boolean;
}

export function AgentPipelineBadge({ activeStep = 'all', compact = false }: AgentPipelineBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 p-1 bg-[#111111]/5 backdrop-blur-md rounded-full border border-[#111111]/10 text-xs">
      {/* Researcher Tag - Blue */}
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-all ${
          activeStep === 'researcher' || activeStep === 'all'
            ? 'bg-[#3B82F6] text-white shadow-xs'
            : 'bg-transparent text-[#111111]/50'
        }`}
      >
        <Search className="w-3 h-3" />
        {!compact && <span>Researcher</span>}
      </span>

      <span className="text-[#111111]/30 font-bold text-[10px]">→</span>

      {/* Creator Tag - Coral */}
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-all ${
          activeStep === 'creator' || activeStep === 'all'
            ? 'bg-[#0A0A0A] text-white shadow-xs'
            : 'bg-transparent text-[#111111]/50'
        }`}
      >
        <Sparkles className="w-3 h-3" />
        {!compact && <span>Creator</span>}
      </span>

      <span className="text-[#111111]/30 font-bold text-[10px]">→</span>

      {/* Sentinel Tag - Teal */}
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-all ${
          activeStep === 'sentinel' || activeStep === 'all'
            ? 'bg-[#3AA36B] text-white shadow-xs'
            : 'bg-transparent text-[#111111]/50'
        }`}
      >
        <ShieldCheck className="w-3 h-3" />
        {!compact && <span>Sentinel</span>}
      </span>
    </div>
  );
}
