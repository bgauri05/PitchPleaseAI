import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { ShieldCheck, Key, Lock, Database } from 'lucide-react';

export function TrustSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  const securityFeatures = [
    {
      icon: Database,
      title: 'Database-Level Isolation',
      description: 'Row-level security on every record in Supabase — your data is isolated by user at the database layer, not just the app layer.',
      badge: 'Supabase RLS'
    },
    {
      icon: Key,
      title: 'Zero Client API Key Exposure',
      description: 'API keys are never exposed client-side. All sensitive service operations are executed in isolated serverless backend functions.',
      badge: 'Protected'
    },
    {
      icon: Lock,
      title: 'Constant-Time Security Checks',
      description: 'Constant-time authentication checks prevent timing-based side-channel attacks and unauthorized access attempts.',
      badge: 'Encrypted'
    }
  ];

  return (
    <section ref={ref} className="py-24 relative z-10 bg-white">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-4 border border-[#2EC4B6]/30">
            <ShieldCheck className="w-4 h-4 text-[#2EC4B6]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2EC4B6]">
              Enterprise Trust & Security
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#0F172A] mb-4">
            Security Built In, Not Bolted On
          </h2>
          <p className="text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Your brand data, memory, and credentials are protected with database-enforced security policies and server-side execution.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -6 }}
                className="glass-card-strong rounded-3xl p-8 border border-white/40 shadow-[0_16px_48px_rgba(0,0,0,0.08)] relative overflow-hidden flex flex-col justify-between group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#2EC4B6]/5 via-transparent to-[#4D9DE0]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-[#2EC4B6] flex items-center justify-center shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#2EC4B6]/10 text-[#2EC4B6] border border-[#2EC4B6]/20">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#0F172A] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[#64748B] text-sm leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/50 text-xs font-semibold text-[#2EC4B6] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Security Constraint</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
