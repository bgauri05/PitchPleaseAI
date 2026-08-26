import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Copy, RotateCw, Save, Instagram, Linkedin,
  MessageSquare, Twitter, Mail, Facebook, Check,
  Loader2, ImageIcon, AlertCircle, Send,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import html2canvas from 'html2canvas-pro';
import { apiClient } from '@/lib/api';
import type { PlatformDraft, BackendPlatform } from '@/lib/api';
import { saveGeneratedContent } from '@/lib/content';
import { createScheduledPost } from '@/lib/scheduling';

const PIPELINE_STEPS = ['RESEARCHER', 'CREATOR', 'SENTINEL'];

export function ContentGenerator() {
  const navigate = useNavigate();
  const posterRef = useRef<HTMLDivElement>(null);

  // ── UI selection state ──────────────────────────────────────────────────
  const [platform, setPlatform] = useState('Instagram');
  const [language, setLanguage] = useState('🇬🇧 English');
  const [goal, setGoal] = useState('');
  const [topic, setTopic] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── API / async state ───────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<Record<string, PlatformDraft> | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState(false);

  // ── Derived helpers ─────────────────────────────────────────────────────
  const PLATFORM_KEY: Record<string, BackendPlatform> = {
    Instagram: 'instagram',
    LinkedIn: 'linkedin',
    WhatsApp: 'whatsapp',
    'Twitter/X': 'twitter',
    Email: 'email',
    Facebook: 'facebook',
  };

  const currentDraft: PlatformDraft | undefined =
    generatedData?.[PLATFORM_KEY[platform]];

  // ── Static option lists ─────────────────────────────────────────────────
  const platforms = [
    { name: 'Instagram', icon: Instagram },
    { name: 'LinkedIn', icon: Linkedin },
    { name: 'WhatsApp', icon: MessageSquare },
    { name: 'Twitter/X', icon: Twitter },
    { name: 'Email', icon: Mail },
    { name: 'Facebook', icon: Facebook },
  ];

  const languages = [
    '🇬🇧 English', '🇮🇳 हिंदी', '🇮🇳 मराठी',
    '🇮🇳 ગુજરાતી', '🇮🇳 தமிழ்', '🇮🇳 తెలుగు',
  ];

  const goals = [
    'Promote a product or service',
    'Engage with audience',
    'Festival greeting',
    'Special offer/promotion',
    'Educational content',
    'Behind the scenes',
    'Customer testimonial',
    'Event announcement',
  ];

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!goal) return;

    const businessId = localStorage.getItem('business_id');
    if (!businessId) {
      alert('Please complete business setup first.');
      navigate('/setup');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedData(null);
    setGeneratedImage(null);

    try {
      const languagePrefix =
        language && !language.includes('English')
          ? `Write this content in ${language.replace(/^\S+\s*/, '').trim()}. `
          : '';

      const response = await apiClient.generateContent({
        business_id: businessId,
        topic: `${languagePrefix}${topic.trim() || goal}`,
        platforms: ['instagram', 'linkedin', 'twitter', 'facebook', 'whatsapp', 'email'],
        tone_override: goal || undefined,
      });
      setGeneratedData(response.final_content);

      const topicText = topic.trim() || goal;
      const itemsToSave = Object.entries(response.final_content).map(
        ([plat, draft]) => ({
          platform: plat,
          content: draft.text,
          image_prompt: draft.image_prompt,
          topic: topicText,
          tone: goal || undefined,
        }),
      );
      saveGeneratedContent(itemsToSave, businessId).catch(() => {/* best-effort */});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    const imagePrompt = currentDraft?.image_prompt;
    if (!imagePrompt) return;

    setIsImageLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await apiClient.generateImage(imagePrompt);
      setGeneratedImage(response.image_base64);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Image generation failed. Please try again.',
      );
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleCopy = () => {
    if (!currentDraft?.text) return;
    navigator.clipboard.writeText(currentDraft.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!currentDraft?.text) return;
    setSaved(true);
    const businessId = localStorage.getItem('business_id');
    await saveGeneratedContent([{
      platform: PLATFORM_KEY[platform] ?? platform.toLowerCase(),
      content: currentDraft.text,
      image_prompt: currentDraft.image_prompt,
      topic: topic.trim() || goal,
      tone: goal || undefined,
    }], businessId).catch(() => {/* best-effort */});
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSchedulePost = async () => {
    if (!currentDraft?.text) return;
    const businessId = localStorage.getItem('business_id') || 'default-business';
    setScheduled(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      await createScheduledPost({
        business_id: businessId,
        content: currentDraft.text,
        image_url: generatedImage ? `data:image/png;base64,${generatedImage}` : null,
        platform: (PLATFORM_KEY[platform] || platform).toLowerCase(),
        scheduled_time: tomorrow.toISOString(),
      });
    } catch (err) {
      console.warn('Schedule error:', err);
    } finally {
      setTimeout(() => setScheduled(false), 2500);
    }
  };

  // ── Text extraction helper for poster headlines ──────────────────────
  const posterLines = (currentDraft?.text ?? '')
    .split(/[.\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const posterHeadline = posterLines[0] ?? '';
  const posterSubheadline = posterLines[1] ?? '';

  return (
    <div className="max-w-7xl mx-auto font-body">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-3">
          <span className="text-[#111111]">02 —</span> Content Engine
        </div>
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-[#111111] tracking-tight">
          Generate <span className="text-[#0A0A0A] bg-[#E4FF3D] px-1">on demand.</span>
        </h1>
      </div>

      {/* Pipeline marquee */}
      <div className="overflow-hidden whitespace-nowrap border-y border-[#DBDBD8] py-3 my-6">
        <motion.div
          className="inline-flex font-headline font-extrabold text-sm tracking-wide"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 1].map((rep) => (
            <span key={rep} className="inline-flex items-center">
              {PIPELINE_STEPS.map((step) => (
                <span key={`${rep}-${step}`} className="inline-flex items-center">
                  <span className="text-[#C9E200] mx-6">{step}</span>
                  <span className="text-[#8A8A85]">→</span>
                </span>
              ))}
            </span>
          ))}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-md border border-[#DBDBD8] p-7">
            <div className="text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-3">Platform</div>
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {platforms.map((p) => {
                const Icon = p.icon;
                const active = platform === p.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => setPlatform(p.name)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-full text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#0A0A0A] text-white'
                        : 'border border-[#DBDBD8] text-[#111111] hover:border-[#0A0A0A]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {p.name}
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-bold uppercase tracking-widest text-[#8A8A85] mb-3">Language</div>
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {languages.map((lang) => {
                const active = language === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`py-2.5 rounded-full text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#E4FF3D] text-[#0A0A0A]'
                        : 'border border-[#DBDBD8] text-[#111111] hover:border-[#0A0A0A]'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#111111] mb-1.5">Content Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-white border border-[#DBDBD8] rounded-xl px-4 py-3 text-sm text-[#111111] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] focus:outline-none transition-colors"
              >
                <option value="">Choose your goal...</option>
                {goals.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                Additional Details <span className="font-normal text-[#4A4A46]">(Optional)</span>
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Add specific details, products, or context…"
                rows={4}
                className="w-full bg-white border border-[#DBDBD8] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder:text-[#4A4A46]/50 focus:border-[#111111] focus:ring-1 focus:ring-[#111111] focus:outline-none transition-colors resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!goal || isLoading}
              className={`w-full py-4 rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                !goal || isLoading
                  ? 'bg-[#DBDBD8] text-[#8A8A85] cursor-not-allowed'
                  : 'bg-[#E4FF3D] hover:bg-[#C9E200] text-[#0A0A0A]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI Agents Working...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Content
                </>
              )}
            </button>
          </div>

          {/* Tips Card */}
          <div className="bg-white rounded-md border border-[#DBDBD8] p-6">
            <h3 className="font-headline font-bold text-[#111111] mb-3 flex items-center gap-2">
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-[#4A4A46]">
              <li className="flex items-start gap-2">
                <span className="text-[#C9E200] font-bold mt-0.5">✓</span>
                <span>Be specific about your product or offer for better results</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C9E200] font-bold mt-0.5">✓</span>
                <span>Content is generated for all platforms at once</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C9E200] font-bold mt-0.5">✓</span>
                <span>Switch platforms in the selector to see each draft</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C9E200] font-bold mt-0.5">✓</span>
                <span>Use "Generate Visual" to create a matching AI image</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Output Panel */}
        <div>
          <div className="bg-[#0A0A0A] text-white rounded-md p-7 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-lg font-bold">Generated Content</h2>
              {currentDraft && !isLoading && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="w-9 h-9 flex items-center justify-center border border-white/25 rounded-full hover:bg-white/10 transition-colors"
                    title="Copy"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#3AA36B]" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-9 h-9 flex items-center justify-center border border-white/25 rounded-full hover:bg-white/10 transition-colors"
                    title="Regenerate"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    className="w-9 h-9 flex items-center justify-center border border-white/25 rounded-full hover:bg-white/10 transition-colors"
                    title="Save to Library"
                  >
                    {saved ? <Check className="w-4 h-4 text-[#3AA36B]" /> : <Save className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleSchedulePost}
                    className="px-4 py-2 bg-[#E4FF3D] hover:bg-[#C9E200] text-[#0A0A0A] text-xs font-bold rounded-full transition-colors flex items-center gap-1.5"
                    title="Schedule to Queue"
                  >
                    {scheduled ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Scheduled!</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Schedule</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 flex items-start gap-3 bg-[#FDEAE5] border border-[#E4573A]/30 rounded-xl p-4"
                >
                  <AlertCircle className="w-5 h-5 text-[#E4573A] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#E4573A] font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* ── Loading State ── */}
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <Loader2 className="w-10 h-10 animate-spin text-[#E4FF3D] mb-5" />
                  <h3 className="font-headline text-lg font-bold mb-2">AI Agents are working...</h3>
                  <p className="text-sm text-white/60 max-w-xs leading-relaxed">
                    Researching, drafting, and quality-checking your content.
                    <br />
                    <span className="text-[#E4FF3D] font-medium">This takes about 15–20 seconds.</span>
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {PIPELINE_STEPS.map((step, i) => (
                      <motion.span
                        key={step}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.3 }}
                        className="px-3 py-1.5 text-xs font-medium bg-white/10 border border-white/15 rounded-full text-white/80"
                      >
                        {step}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Empty State ── */}
              {!isLoading && !generatedData && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <Sparkles className="w-12 h-12 text-white/20 mb-4" />
                  <h3 className="font-headline text-lg font-semibold mb-2">Ready to Create?</h3>
                  <p className="text-white/50 max-w-sm text-sm">
                    Configure your settings and click "Generate Content" to create amazing posts with AI
                  </p>
                </motion.div>
              )}

              {/* ── Generated Content State ── */}
              {!isLoading && generatedData && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {!currentDraft && (
                    <div className="flex items-start gap-3 bg-white/5 border border-white/15 rounded-xl p-4">
                      <AlertCircle className="w-5 h-5 text-[#E4FF3D] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-white/70">
                        No content was generated for <strong className="text-white">{platform}</strong>.
                        Switch to another platform tab to view your generated drafts.
                      </p>
                    </div>
                  )}

                  {currentDraft && (
                    <>
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                        "{currentDraft.text}"
                      </p>

                      <span className="inline-flex items-center gap-1.5 bg-[#E4FF3D] text-[#0A0A0A] text-xs font-bold px-3 py-1.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Approved by Sentinel
                      </span>

                      {/* ── AI Image Generator section ── */}
                      <div className="border-t border-white/15 pt-5">
                        <div className="flex items-center gap-2 mb-3">
                          <ImageIcon className="w-4 h-4 text-[#E4FF3D]" />
                          <h3 className="font-headline font-bold text-sm">AI Image Generator</h3>
                        </div>

                        <div className="mb-4">
                          <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-1.5">
                            Art Director's Visual Prompt
                          </p>
                          <div className="p-3 bg-white/5 border border-white/15 rounded-xl">
                            <p className="text-xs text-white/60 italic leading-relaxed">
                              {currentDraft.image_prompt}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={handleGenerateImage}
                          disabled={isImageLoading}
                          className={`w-full py-3 rounded-full flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
                            isImageLoading
                              ? 'bg-white/10 text-white/40 cursor-not-allowed'
                              : 'border border-white text-white hover:bg-white hover:text-[#0A0A0A]'
                          }`}
                        >
                          {isImageLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating Visual...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Generate Visual
                            </>
                          )}
                        </button>

                        <AnimatePresence>
                          {generatedImage && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                              className="mt-4 space-y-4"
                            >
                              <div ref={posterRef} className="relative aspect-square overflow-hidden rounded-xl">
                                <img
                                  src={`data:image/png;base64,${generatedImage}`}
                                  alt="AI Generated Graphic"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-8">
                                  {posterHeadline && (
                                    <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight">
                                      {posterHeadline}
                                    </h2>
                                  )}
                                  {posterSubheadline && (
                                    <p className="text-sm text-white/70 mt-2 font-medium">
                                      {posterSubheadline}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between mt-6">
                                    <div className="flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-[#E4FF3D]" />
                                      <span className="text-xs font-bold text-white tracking-wide">PitchPleaseAI</span>
                                    </div>
                                    <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white bg-white/20 rounded-full">
                                      Link in Bio
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={async () => {
                                  if (!posterRef.current) return;
                                  const canvas = await html2canvas(posterRef.current, { useCORS: true, scale: 2 });
                                  const link = document.createElement('a');
                                  link.download = 'pitchplease-ai-poster.png';
                                  link.href = canvas.toDataURL('image/png');
                                  link.click();
                                }}
                                className="w-full py-3 rounded-full flex items-center justify-center gap-2 font-semibold text-sm bg-[#E4FF3D] hover:bg-[#C9E200] text-[#0A0A0A] transition-colors"
                              >
                                <Save className="w-4 h-4" />
                                Download Ready-to-Post Graphic
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
