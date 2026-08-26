import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Instagram, Loader2, Link2, CheckCircle2, XCircle, Clock, Send } from 'lucide-react';
import {
  getInstagramConnectUrl,
  createScheduledPost,
  fetchScheduledPosts,
  type ScheduledPost,
} from '@/lib/scheduling';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const STATUS_STYLE: Record<ScheduledPost['status'], { label: string; className: string; Icon: typeof Clock }> = {
  pending: { label: 'Pending', className: 'text-[#C9E200] bg-[#C9E200]/15', Icon: Clock },
  posted: { label: 'Posted', className: 'text-[#3AA36B] bg-[#3AA36B]/10', Icon: CheckCircle2 },
  failed: { label: 'Failed', className: 'text-[#0A0A0A] bg-[#FDEAE5]', Icon: XCircle },
};

export function ScheduledPosts() {
  const businessId = localStorage.getItem('business_id') || '';
  const [connected, setConnected] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    Promise.all([
      fetch(`${API_URL}/business/${businessId}`).then((r) => (r.ok ? r.json() : null)),
      fetchScheduledPosts(businessId),
    ])
      .then(([business, scheduled]) => {
        setConnected(Boolean(business?.instagram_connected));
        setPosts(scheduled);
      })
      .finally(() => setLoading(false));
  }, [businessId]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!content.trim()) return setFormError('Write the post caption first.');
    if (!scheduledTime) return setFormError('Pick a date and time.');

    const iso = new Date(scheduledTime).toISOString();

    setSubmitting(true);
    try {
      await createScheduledPost({
        business_id: businessId,
        content,
        image_url: imageUrl || null,
        platform: 'instagram',
        scheduled_time: iso,
      });
      setContent('');
      setImageUrl('');
      setScheduledTime('');
      await loadPosts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not schedule the post.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-body">
      <section>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-3">
          <span className="text-[#111111]">06 —</span> Queue
        </div>
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-[#111111] tracking-tight mb-1">
          Set it. It <span className="text-[#0A0A0A] bg-[#E4FF3D] px-1">publishes.</span>
        </h1>
        <p className="text-[#4A4A46] text-base mt-2">
          Connect Instagram, then queue posts for the background scheduler to publish automatically.
        </p>
      </section>

      {/* Connection status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-md p-6 shadow-[0_8px_24px_rgba(18,17,15,0.08)] border border-[#DBDBD8] flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#0A0A0A]/10 flex items-center justify-center text-[#0A0A0A] flex-shrink-0">
            <Instagram className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-headline text-lg font-bold text-[#111111]">Instagram</h2>
            <p className="text-sm text-[#4A4A46]">
              {connected
                ? 'Connected — the scheduler can publish to this account.'
                : 'Not connected yet. Posts will sit as "pending" until this is linked.'}
            </p>
          </div>
        </div>
        {connected ? (
          <span className="text-xs font-semibold text-[#3AA36B] bg-[#3AA36B]/10 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> Connected
          </span>
        ) : (
          <button
            onClick={() => {
              let targetId = businessId;
              if (!targetId) {
                targetId = crypto.randomUUID();
                localStorage.setItem('business_id', targetId);
              }
              window.location.href = getInstagramConnectUrl(targetId);
            }}
            className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white px-5 py-2.5 rounded-full font-medium text-sm hover:bg-[#262626] transition-colors flex-shrink-0 cursor-pointer"
          >
            <Link2 className="w-4 h-4" /> Connect Instagram
          </button>
        )}
      </motion.div>

      {/* Schedule a post */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-md p-6 shadow-[0_8px_24px_rgba(18,17,15,0.08)] border border-[#DBDBD8]"
      >
        <h2 className="font-headline text-lg font-bold text-[#111111] mb-4">Schedule a new post</h2>
        <form onSubmit={handleSchedule} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#111111]">Caption</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Write the post caption…"
              className="w-full bg-white border border-[#DBDBD8] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder:text-[#4A4A46]/50 focus:border-[#111111] focus:ring-1 focus:ring-[#111111] focus:outline-none transition-colors resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#111111]">
              Image URL <span className="font-normal text-[#4A4A46]">(must be public — a generated/uploaded image link, not a local file)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full bg-white border border-[#DBDBD8] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder:text-[#4A4A46]/50 focus:border-[#111111] focus:ring-1 focus:ring-[#111111] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#111111]">Publish at</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full bg-white border border-[#DBDBD8] rounded-xl px-4 py-3 text-sm text-[#111111] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] focus:outline-none transition-colors"
            />
          </div>

          {formError && (
            <div className="p-3 bg-[#FDEAE5] border border-[#E4573A]/30 rounded-xl text-[#E4573A] text-sm">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="self-start inline-flex items-center gap-2 bg-[#0A0A0A] hover:bg-[#262626] text-white font-medium text-sm px-5 py-3 rounded-full transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Schedule Post</span>
          </button>
        </form>
      </motion.div>

      {/* Queue */}
      <section>
        <h2 className="font-headline text-xl font-extrabold text-[#111111] mb-2">Queue</h2>
        {posts.length === 0 ? (
          <div className="bg-white rounded-md p-8 text-center border border-[#DBDBD8]">
            <p className="text-[#4A4A46] text-sm">No posts scheduled yet.</p>
          </div>
        ) : (
          <div>
            {posts.map((post, idx) => {
              const status = STATUS_STYLE[post.status];
              return (
                <div
                  key={post.id}
                  className="flex items-center gap-6 py-5 border-t border-[#DBDBD8] last:border-b hover:bg-[#F4F4F1]/60 transition-colors"
                >
                  <span className="text-xs text-[#8A8A85] w-6 flex-shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-grow min-w-0">
                    <p className="font-headline font-bold text-[#111111] truncate">{post.content}</p>
                    {post.status === 'failed' && post.error_message && (
                      <p className="text-xs text-[#0A0A0A] mt-1">{post.error_message}</p>
                    )}
                  </div>
                  <span className="text-xs text-[#8A8A85] flex-shrink-0 hidden sm:block">
                    {new Date(post.scheduled_time).toLocaleString()} · {post.platform}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${status.className}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
