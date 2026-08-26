import { motion } from 'motion/react';
import { Heart, MessageCircle, TrendingUp, Send } from 'lucide-react';

export function FloatingPreviewCards() {
  return (
    <div className="relative w-full h-[600px]">
      {/* Instagram Post Preview */}
      <motion.div
        className="absolute top-0 right-0 w-80 glass-card-strong rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/40"
        initial={{ opacity: 0, y: 50, rotateY: -15 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          rotateY: 0,
        }}
        transition={{ 
          duration: 1.2, 
          delay: 0.3,
          type: "spring",
          stiffness: 100 
        }}
        style={{ 
          transformStyle: 'preserve-3d',
          transformOrigin: 'center',
        }}
      >
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotateZ: [0, 1, 0, -1, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Instagram Header */}
          <div className="p-4 flex items-center gap-3 bg-white/60 backdrop-blur-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B9D] to-[#C9E200] rounded-full" />
            <div>
              <div className="font-semibold text-sm text-[#111111]">your_business</div>
              <div className="text-xs text-[#4A4A46]">Sponsored</div>
            </div>
          </div>
          
          {/* Post Image */}
          <div className="relative h-80 bg-gradient-to-br from-[#E4FF3D] via-[#C9E200] to-[#0A0A0A] flex items-center justify-center overflow-hidden">
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                ]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="text-white text-center z-10 p-6">
              <div className="text-5xl mb-4">🎉</div>
              <div className="font-bold text-2xl mb-2">Special Offer!</div>
              <div className="text-lg opacity-90">20% OFF This Weekend</div>
            </div>
          </div>
          
          {/* Post Actions */}
          <div className="p-4 bg-white/60 backdrop-blur-sm">
            <div className="flex gap-4 mb-3">
              <Heart className="w-6 h-6 text-[#E4573A]" fill="#E4573A" />
              <MessageCircle className="w-6 h-6 text-[#111111]" />
              <Send className="w-6 h-6 text-[#111111]" />
            </div>
            <div className="text-sm font-semibold text-[#111111] mb-1">1,234 likes</div>
            <div className="text-sm text-[#111111]">
              <span className="font-semibold">your_business</span>{' '}
              <span className="text-[#4A4A46]">Don't miss out! Use code SAVE20 🛍️✨</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* WhatsApp Message Bubble */}
      <motion.div
        className="absolute top-20 left-0 max-w-xs"
        initial={{ opacity: 0, x: -50, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          x: 0, 
          scale: 1,
        }}
        transition={{ 
          duration: 1, 
          delay: 0.6,
          type: "spring" 
        }}
      >
        <motion.div
          animate={{ 
            y: [0, -8, 0],
            rotateZ: [0, -2, 0]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="glass-card-strong rounded-3xl rounded-tl-md p-5 shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-white/40 bg-gradient-to-br from-white/80 to-[#D9FDD3]/30"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full" />
            <span className="text-xs font-semibold text-[#4A4A46]">WhatsApp Business</span>
          </div>
          <div className="text-[#111111] mb-2">
            ✨ <span className="font-semibold">Good morning!</span>
          </div>
          <div className="text-sm text-[#111111] leading-relaxed">
            We have something special for you today! 🎁
            <br /><br />
            Use code: <span className="font-bold bg-gradient-to-r from-[#C9E200] to-[#FF6B9D] bg-clip-text text-transparent">SPECIAL20</span> for 20% OFF
          </div>
          <div className="text-xs text-[#4A4A46] mt-3 text-right">9:45 AM ✓✓</div>
        </motion.div>
      </motion.div>

      {/* AI Typing Bubble */}
      <motion.div
        className="absolute top-96 left-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
      >
        <motion.div
          animate={{ 
            y: [0, 5, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="glass-card-strong rounded-3xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.1)] border border-white/40 max-w-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <motion.div 
              className="w-8 h-8 bg-gradient-to-br from-[#E4FF3D] to-[#C9E200] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(228,255,61,0.4)]"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-white text-xs">✨</span>
            </motion.div>
            <span className="text-xs font-semibold bg-gradient-to-r from-[#E4FF3D] to-[#C9E200] bg-clip-text text-transparent">
              AI is typing...
            </span>
          </div>
          <div className="text-sm text-[#111111] font-mono">
            "Exciting news! Our new collection..."
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-0.5 h-4 bg-[#E4FF3D] ml-1"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Engagement Metric Bubble */}
      <motion.div
        className="absolute bottom-20 right-32"
        initial={{ opacity: 0, scale: 0, rotateZ: -20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          rotateZ: 0 
        }}
        transition={{ 
          duration: 0.8, 
          delay: 1.2,
          type: "spring",
          stiffness: 200
        }}
      >
        <motion.div
          animate={{ 
            y: [0, -12, 0],
            rotateZ: [0, 3, 0, -3, 0]
          }}
          transition={{ 
            duration: 7, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="glass-card-strong rounded-3xl p-6 shadow-[0_16px_48px_rgba(0,0,0,0.15)] border-2 border-white/50 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-[#3AA36B]/10 to-transparent"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-[#3AA36B]" />
              <span className="text-xs font-semibold text-[#4A4A46]">Engagement</span>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-[#3AA36B] to-[#3AA36B] bg-clip-text text-transparent">
              +156%
            </div>
            <div className="text-xs text-[#4A4A46] mt-1">vs last month</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Festival Banner Preview */}
      <motion.div
        className="absolute bottom-0 left-32"
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1 
        }}
        transition={{ 
          duration: 1, 
          delay: 1.5,
          type: "spring"
        }}
      >
        <motion.div
          animate={{ 
            y: [0, -6, 0],
            rotateZ: [0, -1, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-72 glass-card-strong rounded-2xl p-5 shadow-[0_16px_48px_rgba(255,159,28,0.25)] border-2 border-white/40 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-[#C9E200] via-[#FF6B9D] to-[#FFB088] opacity-10"
            animate={{
              background: [
                'radial-gradient(circle at 0% 0%, rgba(255, 159, 28, 0.15) 0%, transparent 70%)',
                'radial-gradient(circle at 100% 100%, rgba(255, 107, 157, 0.15) 0%, transparent 70%)',
                'radial-gradient(circle at 0% 0%, rgba(255, 159, 28, 0.15) 0%, transparent 70%)',
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <div className="relative z-10">
            <div className="text-4xl mb-2">🎆</div>
            <div className="font-bold text-lg text-[#111111] mb-1">Diwali Special Campaign</div>
            <div className="text-sm text-[#4A4A46]">Ready to publish in 3 languages</div>
            <div className="mt-3 flex gap-2">
              <div className="px-3 py-1 bg-gradient-to-r from-[#C9E200]/20 to-[#FF6B9D]/20 rounded-full text-xs font-medium text-[#111111] border border-[#C9E200]/30">
                🇮🇳 हिंदी
              </div>
              <div className="px-3 py-1 bg-gradient-to-r from-[#C9E200]/20 to-[#FF6B9D]/20 rounded-full text-xs font-medium text-[#111111] border border-[#C9E200]/30">
                🇬🇧 English
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-[#E4FF3D] to-[#C9E200] opacity-40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}
