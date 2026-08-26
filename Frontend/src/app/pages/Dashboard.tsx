import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Calendar,
  PartyPopper,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { getContentStats, fetchSavedContent, type SavedContent } from '@/lib/content';
import { fetchScheduledPosts, type ScheduledPost } from '@/lib/scheduling';
import { getFestivalsInRange, getNextOccurrence, FESTIVALS } from '@/lib/festivals';

// Helper for platform icons
const PLATFORM_ICON: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
};

// Compute current week range (Monday to Sunday)
function getCurrentWeekRange(): { start: Date; end: Date; days: Date[] } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  // Monday is 1, Sunday is 0
  const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + distanceToMon);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }

  const sunday = new Date(days[6]);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday, days };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatScheduledTime(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today at ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`;
}

export function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0 });
  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [dismissedReminders, setDismissedReminders] = useState<Record<string, boolean>>({});

  const { start: weekStart, end: weekEnd, days: weekDays } = getCurrentWeekRange();

  useEffect(() => {
    const businessId = localStorage.getItem('business_id') || 'default-business';

    Promise.all([
      getContentStats(businessId),
      fetchSavedContent(businessId),
      fetchScheduledPosts(businessId).catch(() => []),
    ])
      .then(([s, content, scheduled]) => {
        setStats(s);
        setSavedContent(content);
        setScheduledPosts(scheduled);
      })
      .finally(() => setLoading(false));
  }, []);

  // Compute stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const snapshotLabel = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const postsThisMonth = scheduledPosts.filter((p) => {
    const d = new Date(p.scheduled_time);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const publishedLiveCount = scheduledPosts.filter((p) => p.status === 'posted').length;

  const draftsToReview =
    savedContent.length + scheduledPosts.filter((p) => p.status === 'pending').length;

  const festivalsThisWeek = getFestivalsInRange(weekStart, weekEnd);

  // Check if first-time user (0 posts and 0 drafts)
  const isFirstTimeUser = scheduledPosts.length === 0 && savedContent.length === 0;

  // Build actionable Reminders & Deadlines stack (up to 3 cards)
  const reminders = [];

  if (draftsToReview > 0) {
    reminders.push({
      id: 'unreviewed_drafts',
      title: `${draftsToReview} draft${draftsToReview > 1 ? 's' : ''} awaiting review`,
      description: `${draftsToReview} draft${draftsToReview > 1 ? 's have' : ' has'} been waiting over 48 hours — review before Thursday's slot.`,
      actionText: 'Review Drafts',
      actionUrl: '/app/planner',
      icon: Clock,
    });
  }

  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
  const currentWeekScheduled = scheduledPosts.filter((p) => {
    const t = new Date(p.scheduled_time).getTime();
    return t >= weekStart.getTime() && t <= weekEnd.getTime();
  });
  if ((dayOfWeek === 0 || dayOfWeek === 1) && currentWeekScheduled.length === 0) {
    reminders.push({
      id: 'sunday_nudge',
      title: 'Weekly Planning Nudge',
      description: `You haven't planned this week yet — ${festivalsThisWeek.length || 2} festivals fall in the next 7 days.`,
      actionText: 'Plan This Week',
      actionUrl: '/app/planner',
      icon: Calendar,
    });
  }

  const nextFestival = FESTIVALS.find((f) => {
    const nextDate = getNextOccurrence(f.date);
    const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7;
  });
  if (nextFestival) {
    const festivalDateStr = getNextOccurrence(nextFestival.date).toISOString().slice(0, 10);
    const hasPostForFestival = scheduledPosts.some(
      (p) => p.scheduled_time.slice(0, 10) === festivalDateStr
    );
    if (!hasPostForFestival) {
      reminders.push({
        id: 'unplanned_festival',
        title: `Upcoming Festival: ${nextFestival.name}`,
        description: `${nextFestival.name} is in less than 7 days and nothing is scheduled for it yet.`,
        actionText: `Plan ${nextFestival.name} Content`,
        actionUrl: `/app/planner?festival=${encodeURIComponent(nextFestival.name)}`,
        icon: PartyPopper,
      });
    }
  }

  const missingImagePost = scheduledPosts.find(
    (p) => (p.platform?.toLowerCase() === 'instagram') && !p.image_url
  );
  if (missingImagePost) {
    reminders.push({
      id: 'missing_image',
      title: 'Approved Post Missing Image',
      description: '1 Instagram post is approved but missing an image — generate visual before publishing.',
      actionText: 'Add Image',
      actionUrl: '/app/generate',
      icon: AlertTriangle,
    });
  }

  const activeReminders = reminders
    .filter((r) => !dismissedReminders[r.id])
    .slice(0, 3);

  // Recent Activity items (up to 6)
  const combinedActivity = [
    ...scheduledPosts.map((p) => ({
      id: p.id,
      title: p.content.slice(0, 70) + (p.content.length > 70 ? '...' : ''),
      platform: p.platform || 'instagram',
      time: formatScheduledTime(p.scheduled_time),
      status: p.status as 'posted' | 'pending' | 'failed',
      rawDate: p.scheduled_time,
    })),
    ...savedContent.map((c) => ({
      id: c.id,
      title: c.topic || c.content?.slice(0, 70) || 'Untitled Draft',
      platform: c.platform || 'instagram',
      time: timeAgo(c.created_at),
      status: 'pending' as const,
      rawDate: c.created_at,
    })),
  ].sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
   .slice(0, 6);

  // KPI tiles — matches the mockup's flat "big number over label" row.
  const kpis = [
    { value: postsThisMonth, label: 'Posts This Month' },
    { value: publishedLiveCount, label: 'Published Live' },
    { value: draftsToReview, label: 'Drafts To Review' },
    { value: festivalsThisWeek.length, label: 'Festivals This Week' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-body">
      {/* Header */}
      <section className="relative overflow-hidden mb-6">
        <div
          className="absolute top-0 right-0 font-headline font-black text-[#0A0A0A]/5 pointer-events-none select-none hidden md:block"
          style={{ fontSize: 160, lineHeight: 1 }}
        >
          plan
        </div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85]">
              <span className="text-[#111111]">Dashboard —</span> Snapshot: {snapshotLabel}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#DBDBD8] text-xs font-semibold text-[#0A0A0A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C9E200] animate-pulse" />
              <span>Instagram: pending verification</span>
            </div>
          </div>
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-[#111111] tracking-tight">
            Here's what's <span className="text-[#0A0A0A] bg-[#E4FF3D] px-1">moving.</span>
          </h1>
        </div>
      </section>

      {isFirstTimeUser ? (
        <section className="bg-white rounded-md p-10 border border-[#DBDBD8] text-center space-y-6">
          <div className="w-16 h-16 bg-[#0A0A0A]/10 text-[#0A0A0A] rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="font-headline text-3xl font-bold text-[#111111]">
              Welcome to PitchPleaseAI!
            </h2>
            <p className="text-[#4A4A46] text-base leading-relaxed">
              Your multi-agent AI marketing assistant (<strong className="text-[#111111]">Researcher, Creator, and Sentinel</strong>) is ready to generate highly tailored content, schedule weekly campaigns, and celebrate regional festivals.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/app/generate"
              className="bg-[#0A0A0A] hover:bg-[#262626] text-white px-8 py-3 rounded-full font-semibold text-sm transition-all inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" /> Generate your first post →
            </Link>
            <Link
              to="/app/planner"
              className="border border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white px-6 py-3 rounded-full font-semibold text-sm transition-all inline-flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" /> Explore Weekly Scheduler
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* KPI row — each cell carries its own top border, matching the mockup's stat-row */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="border-t-2 border-[#111111] pt-5">
                <span className="font-headline text-4xl md:text-5xl font-black text-[#111111] block">
                  {String(kpi.value).padStart(2, '0')}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#4A4A46] mt-1 inline-block">
                  {kpi.label}
                </span>
              </div>
            ))}
          </section>

          {/* SECTION: Reminders */}
          {activeReminders.length > 0 && (
            <section className="mb-10">
              <div className="text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-1">
                <span className="text-[#111111]">01 —</span> Reminders
              </div>
              <AnimatePresence>
                {activeReminders.map((reminder) => {
                  const Icon = reminder.icon;
                  return (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="flex items-center justify-between gap-4 py-4 border-t border-[#DBDBD8] last:border-b hover:bg-[#F4F4F1]/60 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <Icon className="w-4 h-4 text-[#0A0A0A] flex-shrink-0" />
                        <h3 className="font-headline font-bold text-sm text-[#111111] truncate">
                          {reminder.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-[#4A4A46] hidden sm:inline">{reminder.description}</span>
                        <Link
                          to={reminder.actionUrl}
                          className="text-xs font-semibold text-[#0A0A0A] hover:underline inline-flex items-center gap-1"
                        >
                          {reminder.actionText} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() =>
                            setDismissedReminders((prev) => ({ ...prev, [reminder.id]: true }))
                          }
                          className="p-1 text-[#4A4A46] hover:text-[#111111] rounded transition-colors"
                          title="Dismiss reminder"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </section>
          )}

          {/* SECTION: Quick Actions */}
          <section className="mb-10">
            <div className="text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-3">
              <span className="text-[#111111]">02 —</span> Quick Actions
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Link
                to="/app/generate"
                className="group relative overflow-hidden rounded-md bg-[#0A0A0A] text-white p-7 min-h-[150px] flex flex-col justify-between"
              >
                <span className="absolute -top-6 right-1 font-headline font-black text-white/10 text-[140px] leading-none pointer-events-none select-none">
                  G
                </span>
                <span className="relative z-10 inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/15 w-fit">
                  Single Post
                </span>
                <div className="relative z-10">
                  <h3 className="font-headline text-xl font-extrabold">Generate Content</h3>
                  <p className="text-xs text-white/70 mt-1">Open the multi-agent engine →</p>
                </div>
              </Link>

              <Link
                to="/app/planner"
                className="group relative overflow-hidden rounded-md bg-[#E4FF3D] text-[#0A0A0A] p-7 min-h-[150px] flex flex-col justify-between"
              >
                <span className="absolute -top-6 right-1 font-headline font-black text-[#0A0A0A]/10 text-[140px] leading-none pointer-events-none select-none">
                  W
                </span>
                <span className="relative z-10 inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[#0A0A0A]/10 w-fit">
                  Bulk Planning
                </span>
                <div className="relative z-10">
                  <h3 className="font-headline text-xl font-extrabold">Plan This Week</h3>
                  <p className="text-xs text-[#0A0A0A]/70 mt-1">Populate your 7-day calendar →</p>
                </div>
              </Link>
            </div>
          </section>

          {/* SECTION: This Week */}
          <section className="mb-10">
            <div className="text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-3">
              <span className="text-[#111111]">03 —</span> This Week
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {weekDays.map((dayDate) => {
                const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                const dateNum = dayDate.getDate();
                const dateStr = dayDate.toISOString().slice(0, 10);

                const dayPosts = scheduledPosts.filter(
                  (p) => p.scheduled_time.slice(0, 10) === dateStr
                );
                const hasPosted = dayPosts.some((p) => p.status === 'posted');
                const hasPending = dayPosts.some((p) => p.status === 'pending');
                const hasFailed = dayPosts.some((p) => p.status === 'failed');

                let dotClass = '';
                if (hasPosted) dotClass = 'bg-[#3AA36B]';
                else if (hasFailed) dotClass = 'bg-[#E4573A]';
                else if (hasPending) dotClass = 'bg-[#C9E200]';

                return (
                  <button
                    key={dateStr}
                    onClick={() => navigate(`/app/planner?day=${dayName}`)}
                    className="bg-white border border-[#DBDBD8] rounded-md p-3 min-h-[90px] text-left hover:border-[#111111] transition-colors"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#8A8A85]">
                      {dayName} {dateNum}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      {dotClass && <span className={`w-2 h-2 rounded-full ${dotClass}`} />}
                      <span className="text-[11px] text-[#4A4A46]">
                        {dayPosts.length > 0 ? `${dayPosts.length} post${dayPosts.length > 1 ? 's' : ''}` : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION: Recent Activity */}
          <section>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-bold uppercase tracking-widest text-[#8A8A85]">
                <span className="text-[#111111]">04 —</span> Recent Activity
              </div>
              <Link
                to="/app/scheduled"
                className="text-xs font-semibold text-[#0A0A0A] hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {combinedActivity.length === 0 ? (
              <div className="py-10 text-center border-t border-[#DBDBD8]">
                <p className="text-sm text-[#4A4A46] mb-4">No content activity recorded yet.</p>
                <Link
                  to="/app/generate"
                  className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white px-5 py-2.5 rounded-full font-semibold text-xs hover:bg-[#262626] transition-colors"
                >
                  <Sparkles className="w-4 h-4" /> Generate First Post
                </Link>
              </div>
            ) : (
              <div>
                {combinedActivity.map((item, idx) => {
                  const Icon = PLATFORM_ICON[item.platform?.toLowerCase()] || Instagram;
                  const statusBadge =
                    item.status === 'posted'
                      ? { label: 'Posted', bg: 'bg-[#3AA36B]/10 text-[#3AA36B]' }
                      : item.status === 'failed'
                      ? { label: 'Failed', bg: 'bg-[#FDEAE5] text-[#E4573A]' }
                      : { label: 'Pending / Draft', bg: 'bg-[#C9E200]/20 text-[#111111]' };

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-5 py-4 border-t border-[#DBDBD8] last:border-b hover:bg-[#F4F4F1]/60 transition-colors"
                    >
                      <span className="text-xs text-[#8A8A85] w-6 flex-shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <Icon className="w-4 h-4 text-[#0A0A0A] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-headline font-bold text-sm text-[#111111] truncate">{item.title}</h3>
                        <p className="text-xs text-[#4A4A46] mt-0.5 flex items-center gap-2">
                          <span className="capitalize font-semibold text-[#111111]">{item.platform}</span>
                          <span>•</span>
                          <span>{item.time}</span>
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
