import { motion } from 'motion/react';
import { Search, Copy, Trash2, Instagram, Linkedin, Twitter, Filter, Loader2, Sparkles, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchSavedContent, deleteContent, getContentStats } from '@/lib/content';
import type { SavedContent } from '@/lib/content';

const ICON_MAP: Record<string, typeof Instagram> = {
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
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function ContentLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [allContent, setAllContent] = useState<SavedContent[]>([]);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    const businessId = localStorage.getItem('business_id') || '';
    Promise.all([fetchSavedContent(businessId), getContentStats(businessId)])
      .then(([content, s]) => { setAllContent(content); setStats(s); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const platforms = [
    { name: 'All', icon: Filter },
    { name: 'instagram', icon: Instagram, label: 'Instagram' },
    { name: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
    { name: 'twitter', icon: Twitter, label: 'Twitter' },
  ];

  const uniquePlatforms = new Set(allContent.map((c) => c.platform));

  const filteredContent = allContent.filter((item) => {
    const matchesSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.topic ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === 'All' || item.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
  };

  const handleDelete = async (id: string) => {
    const businessId = localStorage.getItem('business_id') || '';
    await deleteContent(id, businessId);
    setAllContent((prev) => prev.filter((c) => c.id !== id));
    setStats((s) => ({ ...s, total: s.total - 1 }));
  };

  const statCells = [
    { n: stats.total, l: 'Total Content' },
    { n: stats.thisWeek, l: 'This Week' },
    { n: uniquePlatforms.size, l: 'Platforms Used' },
  ];

  return (
    <div className="max-w-7xl mx-auto font-body">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-3">
          <span className="text-[#111111]">05 —</span> Library
        </div>
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-[#111111] tracking-tight">
          Everything you've <span className="text-[#0A0A0A] bg-[#E4FF3D] px-1">made.</span>
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 my-8">
        {statCells.map((c) => (
          <div key={c.l} className="border-t-2 border-[#111111] pt-5">
            <span className="font-headline text-4xl md:text-5xl font-black text-[#111111] block">
              {String(c.n).padStart(2, '0')}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#4A4A46] mt-1 inline-block">
              {c.l}
            </span>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-md border border-[#DBDBD8] p-3 mb-8 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A85] w-4 h-4" />
          <input
            type="text"
            placeholder="Search content, tags, or keywords…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-transparent text-sm text-[#111111] placeholder:text-[#8A8A85] focus:outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {platforms.map((p) => {
            const active = filterPlatform === p.name;
            return (
              <button
                key={p.name}
                onClick={() => setFilterPlatform(p.name)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#0A0A0A] text-white'
                    : 'border border-[#DBDBD8] text-[#111111] hover:border-[#0A0A0A]'
                }`}
              >
                {'label' in p ? p.label : p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]" />
        </div>
      ) : filteredContent.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContent.map((item, index) => {
            const Icon = ICON_MAP[item.platform] ?? Sparkles;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className="bg-white rounded-md border border-[#DBDBD8] p-5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85]">
                  <span className="flex items-center gap-1.5 capitalize text-[#111111]">
                    <Icon className="w-3.5 h-3.5" /> {item.platform}
                  </span>
                  <span>{timeAgo(item.created_at)}</span>
                </div>
                {item.topic && (
                  <span className="inline-block w-fit px-2.5 py-1 bg-[#F4F4F1] text-[#111111] text-[11px] rounded-full mb-3">
                    {item.topic}
                  </span>
                )}
                <p className="text-[#4A4A46] text-[13px] line-clamp-4 mb-4 whitespace-pre-wrap flex-1">
                  {item.content}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(item.id, item.content)}
                    className="flex-1 border border-[#DBDBD8] text-[#111111] py-2.5 rounded-full hover:border-[#0A0A0A] transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    {copiedId === item.id ? <Check className="w-4 h-4 text-[#3AA36B]" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 border border-[#DBDBD8] text-[#E4573A] rounded-full hover:bg-[#FDEAE5] hover:border-[#E4573A]/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-md border border-[#DBDBD8] p-12 text-center">
          <Search className="w-10 h-10 text-[#DBDBD8] mx-auto mb-4" />
          <h3 className="font-headline text-xl font-bold text-[#111111] mb-2">No Content Found</h3>
          <p className="text-[#4A4A46] text-sm">
            Try adjusting your search or filters to find what you're looking for
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 bg-white border border-[#DBDBD8] rounded-md p-7">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-4">
          <span className="text-[#111111]">TIP —</span> Organization
        </div>
        <ul className="space-y-2.5">
          {[
            'Use tags to categorize your content for easy retrieval',
            'Regularly review and update your saved content',
            'Archive old or outdated content to keep your library clean',
            'Reuse successful content with minor modifications for different platforms',
          ].map((tip) => (
            <li key={tip} className="text-sm text-[#4A4A46] flex items-start gap-2.5">
              <span className="text-[#C9E200] font-bold mt-0.5">✓</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
