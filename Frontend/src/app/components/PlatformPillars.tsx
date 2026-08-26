import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { Database, Brain, Rocket } from 'lucide-react';

export function PlatformPillars() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  const pillars = [
    {
      icon: Database,
      title: 'Context Ingestion',
      description: 'Feed the agent your style guides, past successful posts, and product wikis. It learns the nuances of your identity instantly.',
      badgeColor: 'bg-[#5647c8]/10 text-[#5647c8]',
    },
    {
      icon: Brain,
      title: 'Brand Voice Engine',
      description: 'Our proprietary model filters out generic AI speak, ensuring every drafted word aligns perfectly with your established tone.',
      badgeColor: 'bg-[#3AA36B]/10 text-[#3AA36B]',
    },
    {
      icon: Rocket,
      title: 'Omnichannel Export',
      description: 'Generate tailored assets for Instagram, LinkedIn, and email sequences simultaneously from a single central brief.',
      badgeColor: 'bg-[#C9E200]/15 text-[#9c7600]',
    },
  ];

  return (
    <section ref={ref} id="features" className="py-20 relative z-10 bg-white">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] mb-4">
            The Intelligent Bridge
          </h2>
          <p className="font-body text-base sm:text-lg text-[#4A4A46] max-w-2xl mx-auto leading-relaxed">
            Three pillars designed to transform your raw knowledge into impactful creative at scale.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-8 shadow-[0_8px_24px_rgba(18,17,15,0.08)] hover:shadow-[0_12px_32px_rgba(18,17,15,0.12)] transition-all duration-300 border border-[#DBDBD8] flex flex-col gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pillar.badgeColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-headline text-2xl font-bold text-[#111111]">
                  {pillar.title}
                </h3>
                <p className="font-body text-[#4A4A46] text-sm leading-relaxed flex-grow">
                  {pillar.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
