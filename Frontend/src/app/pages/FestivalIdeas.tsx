import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { useMemo } from 'react';
import { FESTIVALS, getDaysUntil, formatFestivalDate } from '@/lib/festivals';

// Rotating black / yellow / white treatment for the festival grid — matches
// the bold system's "no per-item rainbow colors" rule (see Dashboard's
// Quick Actions and the "Meet the Pipeline" agent cards on the landing page).
const THEME_CYCLE = [
  { card: 'bg-[#0A0A0A] text-white', letter: 'text-white/90', badge: 'bg-white/15 text-white' },
  { card: 'bg-[#E4FF3D] text-[#0A0A0A]', letter: 'text-[#0A0A0A]/80', badge: 'bg-[#0A0A0A]/10 text-[#0A0A0A]' },
  { card: 'bg-white text-[#0A0A0A] border border-[#DBDBD8]', letter: 'text-[#0A0A0A]/[0.06]', badge: 'bg-[#F4F4F1] text-[#0A0A0A]' },
];

export function FestivalIdeas() {
  // WHAT: FESTIVALS (src/lib/festivals.ts) stores each festival's raw date
  // and ideas — shared with the Weekly Planner's auto-suggest feature.
  // `daysLeft` and the display date are computed live here (annually
  // recurring, via getDaysUntil/formatFestivalDate) instead of being
  // hardcoded numbers that went stale the moment a day passed. Sorted so
  // the soonest-upcoming festival is always first — that's what the
  // "Featured Festival" card below assumes (`festivals[0]`).
  const festivals = useMemo(
    () =>
      FESTIVALS.map((f) => ({
        ...f,
        daysLeft: getDaysUntil(f.date),
        date: formatFestivalDate(f.date),
      })).sort((a, b) => a.daysLeft - b.daysLeft),
    [],
  );

  const getStatusBadge = (daysLeft: number) => {
    if (daysLeft <= 7) return 'This Week!';
    if (daysLeft <= 30) return 'Coming Soon';
    if (daysLeft <= 60) return 'Plan Ahead';
    return 'Future';
  };

  const featured = festivals[0];

  return (
    <div className="max-w-7xl mx-auto font-body">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-3">
            <span className="text-[#111111]">04 —</span> Festival Ideas
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
            Never miss the <span className="text-[#0A0A0A] bg-[#E4FF3D] px-1">moment.</span>
          </h1>
        </div>

        {/* Featured Festival — black hero card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-10"
        >
          <div className="bg-[#0A0A0A] text-white rounded-md p-8 md:p-12 relative overflow-hidden">
            <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[220px] leading-none opacity-10 select-none">
              {featured.emoji}
            </span>
            <div className="relative z-10">
              <span className="inline-block bg-[#E4FF3D] text-[#0A0A0A] text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full mb-5">
                Next Festival
              </span>
              <h2 className="font-headline text-4xl md:text-5xl font-black mb-3">{featured.name}</h2>
              <div className="text-sm text-white/70 mb-6">
                {featured.date} · {featured.daysLeft} days to go
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {featured.ideas.map((idea) => (
                  <span
                    key={idea}
                    className="text-xs bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5"
                  >
                    {idea}
                  </span>
                ))}
              </div>

              <Link to="/app/generate">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-[#E4FF3D] hover:bg-[#C9E200] text-[#0A0A0A] px-7 py-3.5 rounded-full font-semibold text-sm transition-colors inline-flex items-center gap-2"
                >
                  Generate {featured.name} Content
                  <span>→</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* All Festivals Grid */}
        <div className="mb-10">
          <h2 className="font-headline text-xl font-extrabold text-[#111111] mb-5">All Festivals</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {festivals.map((festival, index) => {
              const theme = THEME_CYCLE[index % THEME_CYCLE.length];
              const status = getStatusBadge(festival.daysLeft);
              return (
                <motion.div
                  key={festival.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  whileHover={{ y: -4 }}
                  className={`rounded-md overflow-hidden relative ${theme.card}`}
                >
                  <div className="p-5 relative min-h-[150px] flex flex-col justify-between">
                    <span
                      className={`absolute -top-3 right-1 font-headline font-black text-[100px] leading-none pointer-events-none ${theme.letter}`}
                    >
                      {festival.name[0]}
                    </span>
                    <div className="relative z-10 flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${theme.badge}`}>
                        {status}
                      </span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="font-headline text-xl font-extrabold mb-1">{festival.name}</h3>
                      <div className="text-xs opacity-70">
                        {festival.date} · {festival.daysLeft} days left
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 border-t border-[#DBDBD8]/60">
                    <ul className="space-y-1.5 mb-4">
                      {festival.ideas.slice(0, 3).map((idea) => (
                        <li key={idea} className="text-xs text-[#4A4A46] flex items-start gap-2">
                          <span className="text-[#0A0A0A] mt-0.5">·</span>
                          <span>{idea}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/app/generate">
                      <button className="w-full bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold py-2.5 rounded-full transition-colors inline-flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Content
                      </button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Marketing Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white border border-[#DBDBD8] rounded-md p-7"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-4">
            <span className="text-[#111111]">TIP —</span> Festival Marketing
          </div>
          <ul className="space-y-2.5">
            {[
              'Start planning your content at least 2 weeks before the festival.',
              'Create a content series leading up to the festival for maximum engagement.',
              'Use local languages and cultural references to connect better with your audience.',
              'Combine festival greetings with special offers for better conversions.',
            ].map((tip) => (
              <li key={tip} className="text-sm text-[#4A4A46] flex items-start gap-2.5">
                <span className="text-[#C9E200] font-bold mt-0.5">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}
