import { motion } from 'motion/react';
import { ArrowRight, MessageSquare, Heart, Share2, Bookmark, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router';

export function SolutionsSection() {
  return (
    <section className="py-20 relative z-10 bg-white overflow-hidden border-t border-slate-100">
      <div className="container mx-auto px-6 max-w-5xl">
        
        {/* Main Red Meme Poster Container (Exact match to reference image with Red Background) */}
        <div 
          className="relative w-full max-w-2xl mx-auto bg-[#0A0A0A] rounded-[2.5rem] p-6 sm:p-12 shadow-[0_24px_64px_rgba(181,29,13,0.25)] overflow-hidden text-center flex flex-col items-center justify-between min-h-[640px] border border-[#262626]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px'
          }}
        >
          
          {/* TOP RIGHT FLOATING SOCIAL ACTION PILLS */}
          <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-3">
            {/* Comment & Like Row */}
            <div className="flex items-center gap-2">
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-[10px] font-bold text-[#111111]">
                <MessageSquare className="w-3.5 h-3.5 fill-[#111111]" />
                <span>Comment</span>
              </div>
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-[10px] font-bold text-[#111111]">
                <Heart className="w-3.5 h-3.5 fill-[#111111]" />
                <span>Like</span>
              </div>
              {/* Creator Avatar Badge */}
              <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
                  alt="Creator Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Share Pill */}
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-[10px] font-bold text-[#111111]">
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </div>

            {/* Save Pill */}
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-[10px] font-bold text-[#111111]">
              <Bookmark className="w-3.5 h-3.5 fill-[#111111]" />
              <span>Save</span>
            </div>
          </div>

          {/* TOP HEADLINE TYPOGRAPHY FROM REFERENCE MEME */}
          <div className="relative z-10 w-full pt-4 mb-4 text-center">
            {/* Line 1: Marketing Nahi To... */}
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="bg-white text-[#111111] font-serif italic text-2xl sm:text-3xl font-extrabold px-4 py-0.5 rounded-md shadow-sm">
                Marketing
              </span>
              <span className="text-white font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                Nahi To...
              </span>
            </div>

            {/* Line 2: Business Ka Kya */}
            <h2 className="font-serif text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-none my-2 drop-shadow-sm">
              Business Ka Kya
            </h2>

            {/* Line 3: Future Hai Re Baba */}
            <div className="inline-block mt-1">
              <span className="bg-white text-[#1e3a8a] font-serif italic text-2xl sm:text-3xl font-extrabold px-6 py-1 rounded-md shadow-sm">
                Future Hai Re Baba
              </span>
            </div>
          </div>

          {/* CENTER BABURAO CHARACTER CUTOUT WITH BRIGHT YELLOW CONTOUR OUTLINE */}
          <div className="relative w-full max-w-md my-2 flex items-center justify-center">
            
            {/* White Curved Arrow pointing to Baburao */}
            <svg className="absolute top-0 right-8 sm:right-16 w-24 h-24 pointer-events-none z-20" viewBox="0 0 100 100" fill="none">
              <path d="M 80 10 Q 70 80 20 60" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 15 50 L 20 60 L 30 58" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            </svg>

            {/* Baburao Photo Container */}
            <div className="relative z-10 w-72 sm:w-88 h-72 sm:h-88 flex items-center justify-center">
              {/* Bright Yellow Outline Stroke Silhouette behind image */}
              <div 
                className="absolute inset-0 w-full h-full bg-[#facc15] transform scale-105 rounded-3xl"
                style={{
                  clipPath: 'ellipse(49% 49% at 50% 50%)'
                }} 
              />
              <img
                src="/babu_bhaiya.png"
                alt="Baburao Hera Pheri Meme"
                className="relative z-10 w-full h-full object-cover rounded-3xl filter grayscale contrast-125 drop-shadow-2xl"
              />
            </div>
          </div>

          {/* BOTTOM CONTACT / BRANDSETU AI PILL BAR */}
          <div className="relative z-10 w-full mt-4">
            <div className="bg-white rounded-full py-3 px-6 shadow-lg inline-flex flex-wrap items-center justify-center gap-4 sm:gap-8 border border-white/40 max-w-full">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#111111]">
                <div className="w-6 h-6 rounded-full bg-[#22c55e] text-white flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 fill-white" />
                </div>
                <span>+91 98765 43210</span>
              </div>

              <div className="w-px h-4 bg-slate-200 hidden sm:block" />

              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#111111]">
                <div className="w-6 h-6 rounded-full bg-[#22c55e] text-white flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 fill-white" />
                </div>
                <span>support@pitchpleaseai.com</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
