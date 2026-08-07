import { motion } from 'motion/react';
import { Sparkles, Calendar, PartyPopper, Instagram, Linkedin, Twitter, ArrowRight, Loader2, Image as ImageIcon, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { getContentStats, fetchSavedContent, fetchWeeklyPlan } from '@/lib/content';
import type { SavedContent, WeeklyPlanItem } from '@/lib/content';

const PLATFORM_ICON: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getNextFestival(): { name: string; date: string; daysLeft: number } {
  const festivals = [
    { name: 'Holi', month: 2, day: 14 },
    { name: 'Eid al-Fitr', month: 2, day: 30 },
    { name: 'Independence Day', month: 7, day: 15 },
    { name: 'Raksha Bandhan', month: 7, day: 28 },
    { name: 'Diwali', month: 9, day: 20 },
    { name: 'Christmas', month: 11, day: 25 },
    { name: 'New Year', month: 0, day: 1 },
  ];
  const now = new Date();
  let best = festivals[0];
  let bestDiff = Infinity;
  for (const f of festivals) {
    let d = new Date(now.getFullYear(), f.month, f.day);
    if (d.getTime() < now.getTime()) d = new Date(now.getFullYear() + 1, f.month, f.day);
    const diff = d.getTime() - now.getTime();
    if (diff < bestDiff) { bestDiff = diff; best = f; }
  }
  const daysLeft = Math.ceil(bestDiff / (1000 * 60 * 60 * 24));
  const targetDate = new Date(now.getFullYear() + (bestDiff > 365 * 86400000 ? 1 : 0), best.month, best.day);
  const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { name: best.name, date: dateStr, daysLeft };
}

export function Dashboard() {
  const [stats, setStats] = useState({ total: 0, thisWeek: 0 });
  const [recentContent, setRecentContent] = useState<SavedContent[]>([]);
  const [weekPlan, setWeekPlan] = useState<WeeklyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getContentStats(),
      fetchSavedContent(),
      fetchWeeklyPlan(),
    ]).then(([s, content, plan]) => {
      setStats(s);
      setRecentContent(content.slice(0, 4));
      setWeekPlan(plan);
    }).finally(() => setLoading(false));
  }, []);

  const upcomingFestival = getNextFestival();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#b51d0d]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-body">
      {/* Welcome Section */}
      <section>
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#1d1b19] tracking-tight mb-1">
          Dashboard Overview
        </h1>
        <p className="text-[#5b403c] text-base">
          Here's a snapshot of your brand's creative performance & AI pipeline.
        </p>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_8px_24px_rgba(18,17,15,0.08)] hover:shadow-[0_12px_32px_rgba(18,17,15,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-[#ece7e3]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5b403c]">Total Content</span>
            <div className="w-10 h-10 rounded-full bg-[#b51d0d]/10 flex items-center justify-center text-[#b51d0d]">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-headline text-4xl font-bold text-[#1d1b19] block">{stats.total}</span>
            <span className="text-xs font-semibold text-[#136948] bg-[#136948]/10 px-2.5 py-1 rounded-md inline-flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{stats.thisWeek} this week
            </span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_8px_24px_rgba(18,17,15,0.08)] hover:shadow-[0_12px_32px_rgba(18,17,15,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-[#ece7e3]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5b403c]">Planned Posts</span>
            <div className="w-10 h-10 rounded-full bg-[#5647c8]/10 flex items-center justify-center text-[#5647c8]">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-headline text-4xl font-bold text-[#1d1b19] block">{weekPlan.length}</span>
            <span className="text-xs font-medium text-[#5b403c] bg-[#f8f3ef] px-2.5 py-1 rounded-md inline-block mt-2">
              Scheduled this week
            </span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_8px_24px_rgba(18,17,15,0.08)] hover:shadow-[0_12px_32px_rgba(18,17,15,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-[#ece7e3]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5b403c]">Next Festival</span>
            <div className="w-10 h-10 rounded-full bg-[#f2b705]/15 flex items-center justify-center text-[#b58100]">
              <PartyPopper className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-headline text-4xl font-bold text-[#1d1b19] block">{upcomingFestival.daysLeft} days</span>
            <span className="text-xs font-semibold text-[#b51d0d] bg-[#ffdad4] px-2.5 py-1 rounded-md inline-flex items-center gap-1 mt-2">
              {upcomingFestival.name} ({upcomingFestival.date})
            </span>
          </div>
        </div>
      </section>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Content List */}
        <section className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-end mb-1">
            <h2 className="font-headline text-2xl font-bold text-[#1d1b19]">Recent Content</h2>
            <Link to="/app/library" className="text-sm font-semibold text-[#b51d0d] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentContent.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#ece7e3]">
              <p className="text-[#5b403c] text-sm mb-4">No content generated yet. Create your first post!</p>
              <Link to="/app/generate" className="inline-flex items-center gap-2 bg-[#b51d0d] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#d83824] transition-colors">
                <Sparkles className="w-4 h-4" /> Generate Now
              </Link>
            </div>
          ) : (
            recentContent.map((item) => {
              const Icon = PLATFORM_ICON[item.platform?.toLowerCase()] || ImageIcon;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-[0_8px_24px_rgba(18,17,15,0.06)] hover:shadow-[0_12px_32px_rgba(18,17,15,0.1)] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 border border-[#ece7e3]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#f8f3ef] flex items-center justify-center text-[#b51d0d] flex-shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-sm text-[#1d1b19] truncate">{item.title}</h3>
                    <p className="text-xs text-[#5b403c] truncate mt-0.5">{item.topic || item.body?.slice(0, 60)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#136948] bg-[#136948]/10 px-2.5 py-1 rounded-md hidden sm:inline-block">
                      Saved
                    </span>
                    <span className="text-xs text-[#5b403c]">{timeAgo(item.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* This Week's Plan Sidebar */}
        <section>
          <h2 className="font-headline text-2xl font-bold text-[#1d1b19] mb-1">This Week's Plan</h2>
          <p className="text-xs text-[#5b403c] mb-4">Upcoming scheduled marketing activities.</p>

          <div className="bg-white rounded-2xl p-5 shadow-[0_8px_24px_rgba(18,17,15,0.06)] border border-[#ece7e3] flex flex-col gap-3">
            {weekPlan.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-[#5b403c] mb-3">No weekly plan generated yet.</p>
                <Link to="/app/planner" className="text-xs font-semibold text-[#b51d0d] hover:underline">
                  Open Planner →
                </Link>
              </div>
            ) : (
              weekPlan.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f8f3ef] transition-colors">
                  <div className="text-center w-10 flex-shrink-0">
                    <span className="text-[10px] font-bold uppercase text-[#5b403c] block">{item.day?.slice(0, 3)}</span>
                  </div>
                  <div className="w-1 h-8 bg-[#b51d0d] rounded-full" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-[#1d1b19] block truncate">{item.topic}</span>
                    <span className="text-[11px] text-[#5b403c] block">{item.platform} • {item.contentType}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}