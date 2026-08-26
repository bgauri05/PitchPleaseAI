import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Loader2, X, Sparkles, RotateCw, ImageIcon, CheckCircle2, XCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { apiClient } from '@/lib/api';
import type { BackendPlatform } from '@/lib/api';
import {
  fetchScheduledPosts,
  createScheduledPost,
  saveGeneratedImage,
  type ScheduledPost,
} from '@/lib/scheduling';
import { getFestivalsInRange } from '@/lib/festivals';

// WHAT: Previously this page read/wrote a `weekly_plan` Supabase table that
// nothing else in the app ever consumed — planning a week here never
// actually scheduled anything. This rework makes the calendar read real
// data from `scheduled_posts` (the table the background scheduler
// actually watches — see backend/app/services/scheduler.py) and adds a
// "Plan This Week" bulk-generation flow: pick a count + context, the app
// runs the same AI pipeline Content Generator uses once per post, and
// lays the results on the calendar as *local, unsaved* drafts. Nothing
// ever reaches the real posting queue until the user explicitly approves
// a draft — that's the human checkpoint the design calls for.
//
// `weekly_plan` itself is left alone (unused, not deleted) — see
// src/lib/content.ts.

/** A day's slot the user is still reviewing. Never persisted until approved — losing these on refresh is an accepted tradeoff for v1. */
interface WeekDraft {
  localId: string;
  /** 0=Monday .. 6=Sunday, relative to the week it was created in. */
  day_of_week: number;
  /** Which visible week (see `currentWeek`) this draft belongs to — keeps drafts from "following" the user to a different week. */
  weekOffset: number;
  platform: string;
  content_type: string;
  text: string;
  image_prompt: string;
  image_url: string | null;
  time: string; // e.g. "6:00 PM"
  status: 'generating' | 'ready' | 'error';
  error?: string;
  generatingImage?: boolean;
  approving?: boolean;
  /** The weekly context text this draft was generated from — reused on "Regenerate". */
  context: string;
  /** Whether a matching image should auto-generate right after the caption does. */
  includeImage: boolean;
}

const STATUS_STYLE: Record<ScheduledPost['status'], { label: string; className: string; Icon: typeof Clock }> = {
  pending: { label: 'Pending', className: 'text-[#C9E200] bg-[#C9E200]/15 border-[#C9E200]/40', Icon: Clock },
  posted: { label: 'Posted', className: 'text-[#3AA36B] bg-[#3AA36B]/10 border-[#3AA36B]/30', Icon: CheckCircle2 },
  failed: { label: 'Failed', className: 'text-[#0A0A0A] bg-[#FDEAE5] border-[#0A0A0A]/30', Icon: XCircle },
};

const TIME_OPTIONS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '6:00 PM', '8:00 PM'];
// Subset used to auto-spread bulk-generated drafts — matches the "peak
// engagement hours" already called out in this page's own Tips section.
const PEAK_TIMES = ['9:00 AM', '11:00 AM', '6:00 PM', '8:00 PM'];

const PLAN_PLATFORMS: { label: string; value: BackendPlatform }[] = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Twitter/X', value: 'twitter' },
];

function getWeekStart(weekOffset: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=Sun..6=Sat
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);
  return monday;
}

function getWeekDayDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

function formatWeekRange(days: Date[]): string {
  const start = days[0];
  const end = days[6];
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
}

/** Which day-of-week index (0=Monday..6=Sunday) `date` falls on within the week starting `weekStart`, or null if outside it. */
function dayIndexInWeek(date: Date, weekStart: Date): number | null {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 6 ? diffDays : null;
}

function timeStringToHM(time: string): { hour: number; minute: number } {
  const m = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return { hour: 9, minute: 0 };
  let hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
}

function draftToISO(draft: WeekDraft, weekDayDates: Date[]): string {
  const day = weekDayDates[draft.day_of_week];
  const { hour, minute } = timeStringToHM(draft.time);
  const dt = new Date(day);
  dt.setHours(hour, minute, 0, 0);
  return dt.toISOString();
}

function formatImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }
  return `data:image/png;base64,${url}`;
}

export function WeeklyPlanner() {
  const navigate = useNavigate();
  const businessId = localStorage.getItem('business_id') || '';

  const [currentWeek, setCurrentWeek] = useState(0);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [drafts, setDrafts] = useState<WeekDraft[]>([]);
  const [loading, setLoading] = useState(true);

  // Pop-Out Detail Preview Modal state
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const activeDraft = useMemo(() => drafts.find((d) => d.localId === selectedDraftId) || null, [drafts, selectedDraftId]);
  const activePost = useMemo(() => posts.find((p) => p.id === selectedPostId) || null, [posts, selectedPostId]);

  // Single-day "Add Post" modal — collects what to generate (not a typed
  // caption; generation always runs, same pipeline as "Plan This Week").
  const [showAddModal, setShowAddModal] = useState<number | null>(null);
  const [newContext, setNewContext] = useState('');
  const [newType, setNewType] = useState('Educational');
  const [newTime, setNewTime] = useState('9:00 AM');
  const [newPlatform, setNewPlatform] = useState('Instagram');
  const [newIncludeImage, setNewIncludeImage] = useState(true);

  // "Plan This Week" bulk-generation modal.
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planCount, setPlanCount] = useState(3);
  const [planContext, setPlanContext] = useState('');
  const [planPlatform, setPlanPlatform] = useState<BackendPlatform>('instagram');
  const [planIncludeImage, setPlanIncludeImage] = useState(true);
  const [planning, setPlanning] = useState(false);

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Rotating black / yellow / white treatment — matches the bold system's
  // "no per-item rainbow colors" rule (see Dashboard's Quick Actions and
  // Festival Ideas' THEME_CYCLE).
  const contentTypes = [
    { type: 'Educational', color: 'bg-[#0A0A0A] text-white border-[#0A0A0A]', emoji: '📚' },
    { type: 'Engagement', color: 'bg-[#E4FF3D] text-[#0A0A0A] border-[#E4FF3D]', emoji: '💬' },
    { type: 'Promotion', color: 'bg-white text-[#0A0A0A] border-[#DBDBD8]', emoji: '🎯' },
    { type: 'Story', color: 'bg-[#0A0A0A] text-white border-[#0A0A0A]', emoji: '✨' },
    { type: 'Behind the Scenes', color: 'bg-[#E4FF3D] text-[#0A0A0A] border-[#E4FF3D]', emoji: '🎬' },
    { type: 'Testimonial', color: 'bg-white text-[#0A0A0A] border-[#DBDBD8]', emoji: '⭐' },
  ];

  const getTypeColor = (type: string) => contentTypes.find((ct) => ct.type === type) || contentTypes[0];

  const weekStart = useMemo(() => getWeekStart(currentWeek), [currentWeek]);
  const weekDayDates = useMemo(() => getWeekDayDates(weekStart), [weekStart]);
  const weekRangeLabel = useMemo(() => formatWeekRange(weekDayDates), [weekDayDates]);

  const suggestedFestivals = useMemo(
    () => getFestivalsInRange(weekDayDates[0], weekDayDates[6]),
    [weekDayDates],
  );

  const loadPosts = async () => {
    if (!businessId) return;
    const data = await fetchScheduledPosts(businessId);
    setPosts(data);
  };

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    loadPosts().finally(() => setLoading(false));
    // Fetch once — scheduled posts for the whole business, filtered client-side per visible week below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const postsThisWeek = useMemo(
    () => posts.filter((p) => dayIndexInWeek(new Date(p.scheduled_time), weekStart) !== null),
    [posts, weekStart],
  );
  const postsByDay = (day: number) =>
    postsThisWeek.filter((p) => dayIndexInWeek(new Date(p.scheduled_time), weekStart) === day);

  const draftsByDay = (day: number) =>
    drafts.filter((d) => d.day_of_week === day && d.weekOffset === currentWeek);

  // ── Bulk "Plan This Week" ────────────────────────────────────────────────

  const openPlanModal = () => {
    if (!planContext.trim() && suggestedFestivals.length > 0) {
      const f = suggestedFestivals[0];
      setPlanContext(`${f.name} is this week — ${f.ideas[0]}`);
    }
    setShowPlanModal(true);
  };

  /**
   * Generates and saves the image for a draft, given its image prompt
   * directly (rather than reading it back off `drafts` state, which may
   * not have re-rendered yet if this is chained right after text
   * generation resolves in the same tick).
   */
  const generateImageForDraft = async (localId: string, imagePrompt: string) => {
    if (!imagePrompt) return;
    updateDraft(localId, { generatingImage: true, error: undefined });
    try {
      const { image_base64 } = await apiClient.generateImage(imagePrompt);
      const url = await saveGeneratedImage(image_base64);
      updateDraft(localId, { image_url: url, generatingImage: false });
    } catch (err) {
      updateDraft(localId, {
        generatingImage: false,
        error: err instanceof Error ? err.message : 'Image generation failed.',
      });
    }
  };

  const generateForDraft = async (
    localId: string,
    contentType: string,
    platform: string,
    context: string,
    includeImage: boolean,
  ) => {
    if (!businessId) return;
    try {
      const topic = `${contentType} post${context.trim() ? `: ${context.trim()}` : ''}`.slice(0, 480);
      const response = await apiClient.generateContent({
        business_id: businessId,
        topic,
        platforms: [platform as BackendPlatform],
        tone_override: contentType,
      });
      const generated = response.final_content[platform];
      setDrafts((prev) =>
        prev.map((d) =>
          d.localId === localId
            ? { ...d, status: 'ready', text: generated?.text ?? '', image_prompt: generated?.image_prompt ?? '' }
            : d,
        ),
      );
      // WHAT: previously "Generate Visual" was a separate manual step the
      // user had to remember to click. Chaining it here means a post with
      // includeImage=true comes back with both caption and image ready
      // (or clearly erroring) by the time the user looks at it — no extra
      // click needed. The button in the draft card still works too, for
      // regenerating just the image or for drafts created without one.
      if (includeImage && generated?.image_prompt) {
        generateImageForDraft(localId, generated.image_prompt);
      }
    } catch (err) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.localId === localId
            ? { ...d, status: 'error', error: err instanceof Error ? err.message : 'Generation failed.' }
            : d,
        ),
      );
    }
  };

  const handlePlanWeek = async () => {
    if (!businessId) {
      alert('Please complete business setup first.');
      navigate('/setup');
      return;
    }
    setPlanning(true);
    setShowPlanModal(false);

    const occupiedDays = new Set(postsThisWeek.map((p) => dayIndexInWeek(new Date(p.scheduled_time), weekStart)));
    const availableDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !occupiedDays.has(d));
    const dayPool = availableDays.length > 0 ? availableDays : [0, 1, 2, 3, 4, 5, 6];

    const slots = Array.from({ length: planCount }, (_, i) => ({
      localId: crypto.randomUUID(),
      day: dayPool[i % dayPool.length],
      time: PEAK_TIMES[i % PEAK_TIMES.length],
      contentType: contentTypes[i % contentTypes.length].type,
    }));

    setDrafts((prev) => [
      ...prev,
      ...slots.map((s) => ({
        localId: s.localId,
        day_of_week: s.day,
        weekOffset: currentWeek,
        platform: planPlatform,
        content_type: s.contentType,
        text: '',
        image_prompt: '',
        image_url: null,
        time: s.time,
        status: 'generating' as const,
        context: planContext,
        includeImage: planIncludeImage,
      })),
    ]);

    await Promise.all(
      slots.map((s) => generateForDraft(s.localId, s.contentType, planPlatform, planContext, planIncludeImage)),
    );

    setPlanning(false);
  };

  const regenerateDraft = (localId: string) => {
    const draft = drafts.find((d) => d.localId === localId);
    if (!draft) return;
    setDrafts((prev) => prev.map((d) => (d.localId === localId ? { ...d, status: 'generating' } : d)));
    generateForDraft(localId, draft.content_type, draft.platform, draft.context, draft.includeImage);
  };

  const discardDraft = (localId: string) => {
    setDrafts((prev) => prev.filter((d) => d.localId !== localId));
  };

  const updateDraft = (localId: string, patch: Partial<WeekDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.localId === localId ? { ...d, ...patch } : d)));
  };

  const generateVisual = (localId: string) => {
    const draft = drafts.find((d) => d.localId === localId);
    if (!draft || !draft.image_prompt) return;
    generateImageForDraft(localId, draft.image_prompt);
  };

  const approveDraft = async (localId: string) => {
    const draft = drafts.find((d) => d.localId === localId);
    if (!draft || !businessId || !draft.text.trim()) return;
    updateDraft(localId, { approving: true, error: undefined });
    try {
      const iso = draftToISO(draft, weekDayDates);
      await createScheduledPost({
        business_id: businessId,
        content: draft.text,
        image_url: draft.image_url,
        platform: draft.platform,
        scheduled_time: iso,
      });
      setDrafts((prev) => prev.filter((d) => d.localId !== localId));
      await loadPosts();
    } catch (err) {
      updateDraft(localId, {
        approving: false,
        error: err instanceof Error ? err.message : 'Could not schedule this post.',
      });
    }
  };

  // ── Single-day "Add Post" — generates, doesn't ask for typed text ───────

  const handleGenerateForDay = () => {
    if (showAddModal === null) return;
    if (!businessId) {
      alert('Please complete business setup first.');
      navigate('/setup');
      return;
    }
    const day = showAddModal;
    const localId = crypto.randomUUID();
    setDrafts((prev) => [
      ...prev,
      {
        localId,
        day_of_week: day,
        weekOffset: currentWeek,
        platform: newPlatform.toLowerCase(),
        content_type: newType,
        text: '',
        image_prompt: '',
        image_url: null,
        time: newTime,
        status: 'generating',
        context: newContext,
        includeImage: newIncludeImage,
      },
    ]);
    setShowAddModal(null);
    setNewContext('');
    generateForDraft(localId, newType, newPlatform.toLowerCase(), newContext, newIncludeImage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#E4FF3D]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-body">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-3">
              <span className="text-[#111111]">03 —</span> Planning
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-[#111111] tracking-tight">
              This week, <span className="text-[#0A0A0A] bg-[#E4FF3D] px-1">planned.</span>
            </h1>
          </div>
          <button
            onClick={openPlanModal}
            disabled={planning}
            className="bg-[#0A0A0A] hover:bg-[#262626] text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {planning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Plan This Week
          </button>
        </div>

        {!businessId && (
          <div className="mb-6 flex items-start gap-3 bg-[#FDEAE5] border border-[#E4573A]/30 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-[#E4573A] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#E4573A]">
              Complete business setup before planning content — <button onClick={() => navigate('/setup')} className="underline font-medium">go to setup</button>.
            </p>
          </div>
        )}

        {/* Week Navigation */}
        <div className="bg-white rounded-md border border-[#DBDBD8] p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentWeek(currentWeek - 1)}
              className="p-2 text-[#4A4A46] hover:text-[#0A0A0A] hover:bg-[#F4F4F1] rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="text-center">
              <h2 className="font-headline text-xl font-bold text-[#111111] mb-1">
                {currentWeek === 0 ? 'This Week' : currentWeek === 1 ? 'Next Week' : currentWeek === -1 ? 'Last Week' : `Week of ${weekDayDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </h2>
              <p className="text-sm text-[#4A4A46]">{weekRangeLabel}</p>
            </div>

            <button
              onClick={() => setCurrentWeek(currentWeek + 1)}
              className="p-2 text-[#4A4A46] hover:text-[#0A0A0A] hover:bg-[#F4F4F1] rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {suggestedFestivals.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#DBDBD8] flex items-center gap-2 text-sm text-[#4A4A46]">
              <span>{suggestedFestivals[0].emoji}</span>
              <span>
                <strong className="text-[#111111]">{suggestedFestivals[0].name}</strong> falls in this week — worth planning around it.
              </span>
            </div>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="grid md:grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const dayPosts = postsByDay(index);
            const dayDrafts = draftsByDay(index);
            const hasContent = dayPosts.length > 0 || dayDrafts.length > 0;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-white rounded-md border border-[#DBDBD8] overflow-hidden"
              >
                {/* Day Header */}
                <div className={`p-4 ${hasContent ? 'bg-[#0A0A0A]' : 'bg-[#F4F4F1]'} border-b border-[#DBDBD8]`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wide ${hasContent ? 'text-white/60' : 'text-[#8A8A85]'}`}>{day}</div>
                  <div className={`font-headline text-xl font-extrabold ${hasContent ? 'text-white' : 'text-[#111111]'}`}>
                    {weekDayDates[index].getDate()}
                  </div>
                </div>

                {/* Day Content */}
                <div className="p-3 min-h-[300px] space-y-3">
                  {/* Real scheduled posts */}
                  {dayPosts.map((post) => {
                    const status = STATUS_STYLE[post.status];
                    const StatusIcon = status.Icon;
                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPostId(post.id)}
                        className={`${status.className} border rounded-md p-3 cursor-pointer transition-all`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold inline-flex items-center gap-1">
                            <StatusIcon className="w-3.5 h-3.5" /> {status.label}
                          </span>
                          <Eye className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                        </div>
                        <div className="text-sm font-medium mb-2 line-clamp-3">{post.content}</div>
                        {post.image_url && (
                          <img
                            src={formatImageUrl(post.image_url)}
                            alt="Scheduled visual"
                            className="w-full rounded-lg mb-2 aspect-square object-cover"
                          />
                        )}
                        <div className="flex items-center justify-between text-xs opacity-75">
                          <span>{new Date(post.scheduled_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                          <span>{post.platform}</span>
                        </div>
                        {post.status === 'failed' && post.error_message && (
                          <p className="text-xs mt-2">{post.error_message}</p>
                        )}
                      </div>
                    );
                  })}

                  {/* Local drafts — needs review before anything is real */}
                  {dayDrafts.map((draft) => {
                    const typeColor = getTypeColor(draft.content_type);
                    const formattedImgUrl = formatImageUrl(draft.image_url);
                    return (
                      <div key={draft.localId} className={`${typeColor.color} border border-dashed rounded-md p-3`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                            <span>{typeColor.emoji}</span> Draft — needs review
                          </span>
                          <button onClick={() => discardDraft(draft.localId)} className="p-1 hover:bg-white/20 rounded" title="Discard">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Prominent Pop-Out Preview & Edit Button */}
                        <button
                          onClick={() => setSelectedDraftId(draft.localId)}
                          className="w-full py-1.5 px-2 mb-2 rounded-full bg-white/90 hover:bg-white text-xs font-bold text-[#111111] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Full Preview & Edit
                        </button>

                        {draft.status === 'generating' ? (
                          <div className="flex items-center gap-2 text-sm py-3 justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                          </div>
                        ) : (
                          <>
                            <textarea
                              value={draft.text}
                              onChange={(e) => updateDraft(draft.localId, { text: e.target.value })}
                              rows={3}
                              className="w-full bg-white/70 border border-white/60 rounded-lg px-2 py-1.5 text-xs text-[#111111] resize-none focus:outline-none focus:border-[#E4FF3D] mb-2"
                            />
                            {draft.error && (
                              <p className="text-xs text-red-600 mb-2">{draft.error}</p>
                            )}
                            {draft.generatingImage ? (
                              <div className="w-full aspect-square bg-white/50 rounded-lg mb-2 flex items-center justify-center text-xs text-[#E4FF3D] gap-1">
                                <Loader2 className="w-4 h-4 animate-spin" /> Visual...
                              </div>
                            ) : formattedImgUrl ? (
                              <img
                                src={formattedImgUrl}
                                alt="Generated visual"
                                onClick={() => setSelectedDraftId(draft.localId)}
                                className="w-full rounded-lg mb-2 aspect-square object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              />
                            ) : null}
                            <div className="flex items-center gap-2 mb-2">
                              <select
                                value={draft.time}
                                onChange={(e) => updateDraft(draft.localId, { time: e.target.value })}
                                className="flex-1 bg-white/70 border border-white/60 rounded-lg px-2 py-1 text-xs"
                              >
                                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <span className="text-xs opacity-75">{draft.platform}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                              <button
                                onClick={() => regenerateDraft(draft.localId)}
                                className="text-xs px-2 py-1.5 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center gap-1"
                              >
                                <RotateCw className="w-3 h-3" /> Regenerate
                              </button>
                              <button
                                onClick={() => generateVisual(draft.localId)}
                                disabled={draft.generatingImage || !draft.image_prompt}
                                className="text-xs px-2 py-1.5 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                {draft.generatingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                                Visual
                              </button>
                            </div>
                            <button
                              onClick={() => approveDraft(draft.localId)}
                              disabled={draft.approving || !draft.text.trim()}
                              className="w-full text-xs px-2 py-2 rounded-full bg-[#E4FF3D] text-[#0A0A0A] hover:bg-[#C9E200] flex items-center justify-center gap-1 disabled:opacity-50 font-semibold"
                            >
                              {draft.approving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Approve & Schedule
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {!hasContent && (
                    <button
                      onClick={() => setShowAddModal(index)}
                      className="w-full h-32 border border-dashed border-[#DBDBD8] rounded-md flex flex-col items-center justify-center text-[#8A8A85] hover:border-[#0A0A0A] hover:text-[#0A0A0A] hover:bg-[#F4F4F1] transition-all group"
                    >
                      <Plus className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold">Add Post</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Plan This Week Modal */}
        <AnimatePresence>
          {showPlanModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowPlanModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-md p-8 w-full max-w-md border border-[#DBDBD8]"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[#111111] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#E4FF3D]" /> Plan This Week
                  </h3>
                  <button onClick={() => setShowPlanModal(false)} className="p-2 hover:bg-[#F4F4F1] rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1">How many posts?</label>
                    <select
                      value={planCount}
                      onChange={(e) => setPlanCount(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-[#DBDBD8] rounded-xl focus:border-[#E4FF3D] focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n} post{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1">Platform</label>
                    <select
                      value={planPlatform}
                      onChange={(e) => setPlanPlatform(e.target.value as BackendPlatform)}
                      className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-[#DBDBD8] rounded-xl focus:border-[#E4FF3D] focus:outline-none"
                    >
                      {PLAN_PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1">
                      Anything special this week? <span className="text-[#4A4A46] font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={planContext}
                      onChange={(e) => setPlanContext(e.target.value)}
                      placeholder="A festival, sale, or launch..."
                      rows={3}
                      maxLength={400}
                      className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-[#DBDBD8] rounded-xl focus:border-[#E4FF3D] focus:outline-none resize-none"
                    />
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planIncludeImage}
                      onChange={(e) => setPlanIncludeImage(e.target.checked)}
                      className="w-4 h-4 accent-[#E4FF3D]"
                    />
                    <span className="text-sm text-[#111111]">Also generate a matching image for each post</span>
                  </label>
                  <p className="text-xs text-[#4A4A46]">
                    This generates drafts only — nothing is scheduled until you review and approve each one.
                  </p>
                  <button
                    onClick={handlePlanWeek}
                    className="w-full bg-[#E4FF3D] hover:bg-[#C9E200] text-[#0A0A0A] py-3 rounded-full transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <Sparkles className="w-5 h-5" /> Generate Week's Posts
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual Add Post Modal */}
        <AnimatePresence>
          {showAddModal !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-md p-8 w-full max-w-md border border-[#DBDBD8]"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[#111111]">Generate for {weekDays[showAddModal]}</h3>
                  <button onClick={() => setShowAddModal(null)} className="p-2 hover:bg-[#F4F4F1] rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1">Platform</label>
                      <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-[#DBDBD8] rounded-xl focus:border-[#E4FF3D] focus:outline-none">
                        {['Instagram', 'LinkedIn', 'Twitter', 'WhatsApp'].map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1">Type of Post</label>
                      <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-[#DBDBD8] rounded-xl focus:border-[#E4FF3D] focus:outline-none">
                        {contentTypes.map((ct) => <option key={ct.type} value={ct.type}>{ct.emoji} {ct.type}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1">
                      Requirements <span className="text-[#4A4A46] font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={newContext}
                      onChange={(e) => setNewContext(e.target.value)}
                      rows={3}
                      placeholder="Any specific details, products, or context for this post..."
                      className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-[#DBDBD8] rounded-xl focus:border-[#E4FF3D] focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1">Time</label>
                    <select value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full px-4 py-3 bg-[#F4F4F1] border-2 border-[#DBDBD8] rounded-xl focus:border-[#E4FF3D] focus:outline-none">
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIncludeImage}
                      onChange={(e) => setNewIncludeImage(e.target.checked)}
                      className="w-4 h-4 accent-[#E4FF3D]"
                    />
                    <span className="text-sm text-[#111111]">
                      Also generate a matching image {newPlatform === 'Instagram' && <span className="text-[#4A4A46]">(Instagram needs one to actually publish)</span>}
                    </span>
                  </label>
                  <p className="text-xs text-[#4A4A46]">
                    AI drafts this post from the above — you'll still review and approve it before anything is scheduled.
                  </p>
                  <button onClick={handleGenerateForDay} className="w-full bg-[#E4FF3D] hover:bg-[#C9E200] text-[#0A0A0A] py-3 rounded-full transition-colors flex items-center justify-center gap-2 font-semibold">
                    <Sparkles className="w-5 h-5" /> Generate
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Draft Detail & Review Pop-Out Modal */}
        <AnimatePresence>
          {activeDraft && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6"
              onClick={() => setSelectedDraftId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-md w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-[#DBDBD8]"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-[#DBDBD8] flex items-center justify-between bg-[#F4F4F1]">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeColor(activeDraft.content_type).emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-[#111111]">
                          {weekDays[activeDraft.day_of_week]}'s Post Preview
                        </h3>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#E4FF3D]/15 text-[#E4FF3D] border border-[#E4FF3D]/30 uppercase tracking-wide">
                          Draft — Needs Review
                        </span>
                      </div>
                      <p className="text-xs text-[#4A4A46] mt-0.5 capitalize">
                        {activeDraft.platform} • {activeDraft.content_type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDraftId(null)}
                    className="p-2.5 hover:bg-[#F4F4F1] rounded-full text-[#4A4A46] hover:text-[#111111] transition-colors border border-[#DBDBD8]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Visual Preview */}
                  <div className="flex flex-col gap-3">
                    <label className="block text-sm font-bold text-[#111111]">Visual Post Asset</label>
                    <div className="relative aspect-square w-full rounded-md bg-[#F4F4F1] border border-dashed border-[#DBDBD8] overflow-hidden flex flex-col items-center justify-center group">
                      {activeDraft.generatingImage ? (
                        <div className="flex flex-col items-center gap-2 text-sm text-[#E4FF3D] p-4 text-center">
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <span className="font-semibold">Generating AI Visual...</span>
                          <span className="text-xs text-[#4A4A46]">Crafting high-quality visual for your post</span>
                        </div>
                      ) : activeDraft.image_url ? (
                        <img
                          src={formatImageUrl(activeDraft.image_url)}
                          alt="Post Visual"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 p-6 text-center">
                          <div className="w-14 h-14 rounded-full bg-[#F4F4F1] flex items-center justify-center text-[#0A0A0A]">
                            <ImageIcon className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#111111]">No Image Generated Yet</p>
                            <p className="text-xs text-[#4A4A46] mt-1">Generate a matching image to preview how it looks on {activeDraft.platform}.</p>
                          </div>
                          <button
                            onClick={() => generateVisual(activeDraft.localId)}
                            disabled={!activeDraft.image_prompt}
                            className="bg-[#E4FF3D] text-[#0A0A0A] text-xs px-4 py-2 rounded-full font-semibold hover:bg-[#C9E200] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Sparkles className="w-4 h-4" /> Generate Image Now
                          </button>
                        </div>
                      )}
                    </div>

                    {activeDraft.image_prompt && (
                      <div className="bg-[#F4F4F1] rounded-md p-3.5 border border-[#DBDBD8]">
                        <span className="text-xs font-semibold text-[#4A4A46] block mb-1">AI Image Prompt:</span>
                        <p className="text-xs text-[#111111] italic line-clamp-3">"{activeDraft.image_prompt}"</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Text & Details */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-bold text-[#111111]">Generated Caption & Text</label>
                        <span className="text-xs text-[#4A4A46]">
                          {activeDraft.text.length} characters
                        </span>
                      </div>
                      <textarea
                        value={activeDraft.text}
                        onChange={(e) => updateDraft(activeDraft.localId, { text: e.target.value })}
                        rows={8}
                        placeholder="Post caption text..."
                        className="w-full bg-[#F4F4F1] border border-[#DBDBD8] rounded-md p-4 text-sm text-[#111111] resize-none focus:outline-none focus:border-[#111111] leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#111111] mb-1">Scheduled Time</label>
                        <select
                          value={activeDraft.time}
                          onChange={(e) => updateDraft(activeDraft.localId, { time: e.target.value })}
                          className="w-full bg-[#F4F4F1] border border-[#DBDBD8] rounded-xl px-3 py-2 text-xs font-medium focus:border-[#E4FF3D] focus:outline-none"
                        >
                          {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#111111] mb-1">Target Platform</label>
                        <div className="bg-[#F4F4F1] border border-[#DBDBD8] rounded-xl px-3 py-2 text-xs font-medium capitalize text-[#111111]">
                          {activeDraft.platform}
                        </div>
                      </div>
                    </div>

                    {activeDraft.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{activeDraft.error}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-[#DBDBD8] bg-[#F4F4F1] flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      discardDraft(activeDraft.localId);
                      setSelectedDraftId(null);
                    }}
                    className="text-xs px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Discard Draft
                  </button>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => regenerateDraft(activeDraft.localId)}
                      className="text-xs px-4 py-2.5 rounded-xl bg-white border border-[#DBDBD8] text-[#111111] hover:bg-[#DBDBD8] font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <RotateCw className="w-4 h-4 text-[#E4FF3D]" /> Regenerate Text
                    </button>
                    <button
                      onClick={() => generateVisual(activeDraft.localId)}
                      disabled={activeDraft.generatingImage || !activeDraft.image_prompt}
                      className="text-xs px-4 py-2.5 rounded-xl bg-white border border-[#DBDBD8] text-[#111111] hover:bg-[#DBDBD8] font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {activeDraft.generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 text-[#C9E200]" />}
                      {activeDraft.image_url ? 'Regenerate Image' : 'Generate Image'}
                    </button>
                    <button
                      onClick={async () => {
                        await approveDraft(activeDraft.localId);
                        setSelectedDraftId(null);
                      }}
                      disabled={activeDraft.approving || !activeDraft.text.trim()}
                      className="text-xs px-6 py-2.5 rounded-full bg-[#E4FF3D] hover:bg-[#C9E200] text-[#0A0A0A] font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {activeDraft.approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve & Schedule
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scheduled Post Detail Pop-Out Modal */}
        <AnimatePresence>
          {activePost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6"
              onClick={() => setSelectedPostId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-md w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-[#DBDBD8]"
              >
                <div className="p-6 border-b border-[#DBDBD8] flex items-center justify-between bg-[#F4F4F1]">
                  <div>
                    <h3 className="text-xl font-bold text-[#111111]">Scheduled Post Details</h3>
                    <p className="text-xs text-[#4A4A46] capitalize mt-0.5">
                      {activePost.platform} • Scheduled for {new Date(activePost.scheduled_time).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPostId(null)}
                    className="p-2.5 hover:bg-[#F4F4F1] rounded-full text-[#4A4A46] hover:text-[#111111] transition-colors border border-[#DBDBD8]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activePost.image_url ? (
                    <div className="aspect-square w-full rounded-md overflow-hidden bg-[#F4F4F1] border border-[#DBDBD8]">
                      <img src={formatImageUrl(activePost.image_url)} alt="Post visual" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square w-full rounded-md bg-[#F4F4F1] border border-[#DBDBD8] flex items-center justify-center text-[#4A4A46] text-xs">
                      No image attached
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <div>
                      <span className="text-xs font-semibold text-[#4A4A46] block mb-1">Post Caption:</span>
                      <div className="bg-[#F4F4F1] rounded-md p-4 text-sm text-[#111111] whitespace-pre-wrap border border-[#DBDBD8]">
                        {activePost.content}
                      </div>
                    </div>
                    {activePost.error_message && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                        <strong>Error:</strong> {activePost.error_message}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Type Legend */}
        <div className="mt-10">
          <div className="text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-4">
            <span className="text-[#111111]">Content Types</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {contentTypes.map((type, index) => (
              <div key={index} className={`${type.color} border rounded-md p-3 text-center`}>
                <div className="text-2xl mb-1">{type.emoji}</div>
                <div className="text-xs font-medium">{type.type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-white rounded-md p-7 border border-[#DBDBD8]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-4">
            <span className="text-[#111111]">TIP —</span> Planning
          </div>
          <ul className="space-y-2.5">
            {[
              'Aim for 3-5 posts per week for consistent engagement',
              'Mix different content types to keep your audience interested',
              'Schedule posts during peak engagement hours (9-11 AM, 6-8 PM)',
              'Plan promotional content around weekends for better reach',
            ].map((tip) => (
              <li key={tip} className="text-sm text-[#4A4A46] flex items-start gap-2.5">
                <span className="text-[#C9E200] font-bold mt-0.5">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
