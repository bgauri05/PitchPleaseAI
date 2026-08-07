import { motion } from 'motion/react';
import { Layers, Globe, ShieldCheck, Zap } from 'lucide-react';

export function CapabilityBar() {
  const capabilities = [
    {
      icon: Layers,
      title: 'Multi-Platform',
      description: 'LinkedIn, Twitter/X, Instagram',
    },
    {
      icon: Globe,
      title: 'Multi-Language',
      description: 'English + 9 Indian Languages',
    },
    {
      icon: Zap,
      title: 'Fast Generation',
      description: 'Powered by Groq Llama 3.3',
    },
    {
      icon: ShieldCheck,
      title: 'Brand Guardrails',
      description: 'Strict Quality Sentinel Checks',
    },
  ];

  return (
    <section className="py-8 bg-white border-y border-slate-100 relative z-10">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#b51d0d]/10 flex items-center justify-center text-[#b51d0d] flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1d1b19]">{item.title}</h4>
                  <p className="text-xs text-[#5b403c]">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
