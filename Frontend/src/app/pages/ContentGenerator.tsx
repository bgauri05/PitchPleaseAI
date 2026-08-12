import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Copy, RotateCw, Save, Instagram, Linkedin,
  MessageSquare, Twitter, Mail, Facebook, Check,
  Loader2, ImageIcon, AlertCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import html2canvas from 'html2canvas-pro';
import { apiClient } from '@/lib/api';
import type { PlatformDraft, BackendPlatform } from '@/lib/api';
import { saveGeneratedContent } from '@/lib/content';

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

  // ── Derived helpers ─────────────────────────────────────────────────────
  /**
   * Maps UI platform labels → backend lowercase keys.
   * WhatsApp / Email / Facebook are not supported by the pipeline;
   * lookups for those will return undefined, showing the warning banner.
   */
  const PLATFORM_KEY: Record<string, BackendPlatform> = {
    Instagram: 'instagram',
    LinkedIn: 'linkedin',
    'Twitter/X': 'twitter',
  };

  /** Draft for the currently selected platform (undefined if not generated). */
  const currentDraft: PlatformDraft | undefined =
    generatedData?.[PLATFORM_KEY[platform]];

  // ── Static option lists ─────────────────────────────────────────────────
  const platforms = [
    { name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-500', textColor: 'text-pink-500' },
    { name: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-400', textColor: 'text-blue-600' },
    { name: 'WhatsApp', icon: MessageSquare, color: 'from-green-500 to-emerald-400', textColor: 'text-green-500' },
    { name: 'Twitter/X', icon: Twitter, color: 'from-sky-500 to-blue-400', textColor: 'text-sky-500' },
    { name: 'Email', icon: Mail, color: 'from-purple-500 to-pink-400', textColor: 'text-purple-500' },
    { name: 'Facebook', icon: Facebook, color: 'from-blue-500 to-indigo-500', textColor: 'text-blue-500' },
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
      // Prepend the chosen language so the LLM writes in that language.
      // English is the default — no prefix needed.
      const languagePrefix =
        language && !language.includes('English')
          ? `Write this content in ${language.replace(/^\S+\s*/, '').trim()}. `
          : '';

      const response = await apiClient.generateContent({
        business_id: businessId,
        // Use the detailed description as the topic; fall back to the goal.
        // Backend key names must be lowercase literals (schema is strict).
        topic: `${languagePrefix}${topic.trim() || goal}`,
        platforms: ['linkedin', 'twitter', 'instagram'],
        tone_override: goal || undefined,
      });
      setGeneratedData(response.final_content);

      // Persist every platform draft to Supabase
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
      saveGeneratedContent(itemsToSave).catch(() => {/* best-effort */});
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
    await saveGeneratedContent([{
      platform: PLATFORM_KEY[platform] ?? platform.toLowerCase(),
      content: currentDraft.text,
      image_prompt: currentDraft.image_prompt,
      topic: topic.trim() || goal,
      tone: goal || undefined,
    }]).catch(() => {/* best-effort */});
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Text extraction helper for poster headlines ──────────────────────
  const posterLines = (currentDraft?.text ?? '')
    .split(/[.\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const posterHeadline = posterLines[0] ?? '';
  const posterSubheadline = posterLines[1] ?? '';

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2EC4B6] via-[#4D9DE0] to-[#818CF8] bg-clip-text text-transparent mb-2">
            Generate Content
          </h1>
          <p className="text-[#64748B]">Create engaging, multilingual content powered by AI ✨</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            <motion.div
              className="glass-card-strong rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.1)] p-8 border border-white/40"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-[#0F172A] mb-6">Configure Your Content</h2>

              {/* Platform Selection */}
              <div className="mb-6">
                <label className="block text-[#0F172A] mb-3 font-medium">Select Platform</label>
                <div className="grid grid-cols-3 gap-3">
                  {platforms.map((p) => {
                    const Icon = p.icon;
                    return (
                      <motion.button
                        key={p.name}
                        onClick={() => setPlatform(p.name)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${platform === p.name
                          ? 'border-transparent'
                          : 'border-white/40 glass-card hover:border-[#2EC4B6]/40'
                          }`}
                      >
                        {platform === p.name && (
                          <motion.div
                            layoutId="platformBg"
                            className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-10`}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        {platform === p.name && (
                          <div className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-20`} />
                        )}
                        <Icon className={`w-8 h-8 mx-auto mb-2 ${p.textColor} relative z-10`} />
                        <div className="text-xs text-[#0F172A] text-center font-medium relative z-10">{p.name}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection */}
              <div className="mb-6">
                <label className="block text-[#0F172A] mb-3 font-medium">Select Language</label>
                <div className="grid grid-cols-3 gap-3">
                  {languages.map((lang) => (
                    <motion.button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-xl border-2 transition-all text-sm font-medium relative ${language === lang
                        ? 'border-transparent bg-gradient-to-r from-[#2EC4B6] to-[#4D9DE0] text-white shadow-[0_8px_24px_rgba(46,196,182,0.3)]'
                        : 'border-white/40 glass-card text-[#64748B] hover:border-[#2EC4B6]/40'
                        }`}
                    >
                      {lang}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Content Goal */}
              <div className="mb-6">
                <label className="block text-[#0F172A] mb-3 font-medium">Content Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-4 py-3 glass-card border-2 border-white/40 rounded-xl focus:border-[#2EC4B6] focus:outline-none transition-all text-[#0F172A] font-medium"
                >
                  <option value="">Choose your goal...</option>
                  {goals.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Additional Details / Topic */}
              <div className="mb-6">
                <label className="block text-[#0F172A] mb-3 font-medium">
                  Additional Details <span className="text-[#94A3B8] font-normal">(Optional)</span>
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Add any specific details, products, or context to customise your content..."
                  rows={4}
                  className="w-full px-4 py-3 glass-card border-2 border-white/40 rounded-xl focus:border-[#2EC4B6] focus:outline-none transition-all resize-none text-[#0F172A]"
                />
              </div>

              {/* Generate Button */}
              <motion.button
                onClick={handleGenerate}
                disabled={!goal || isLoading}
                whileHover={goal && !isLoading ? { scale: 1.02, y: -2 } : {}}
                whileTap={goal && !isLoading ? { scale: 0.98 } : {}}
                className={`w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${!goal || isLoading
                  ? 'bg-[#E5E7EB] text-[#94A3B8] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#2EC4B6] via-[#4D9DE0] to-[#818CF8] text-white shadow-[0_8px_32px_rgba(46,196,182,0.4)] hover:shadow-[0_16px_48px_rgba(46,196,182,0.5)]'
                  }`}
              >
                {goal && !isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#818CF8] via-[#4D9DE0] to-[#2EC4B6]"
                    initial={{ x: '100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                )}
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-medium">AI Agents Working...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 relative z-10" />
                    <span className="relative z-10 font-medium">Generate Content</span>
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* Tips Card */}
            <motion.div
              className="glass-card rounded-3xl p-6 border-2 border-white/40 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4 }}
            >
              <h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li className="flex items-start gap-2">
                  <span className="text-[#2EC4B6] mt-1">•</span>
                  <span>Be specific about your product or offer for better results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4D9DE0] mt-1">•</span>
                  <span>Content is generated for LinkedIn, Twitter/X &amp; Instagram</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF9F1C] mt-1">•</span>
                  <span>Switch platforms in the selector to see each draft</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#22C55E] mt-1">•</span>
                  <span>Use "Generate Visual" to create a matching AI image</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* ── Output Panel ─────────────────────────────────────────────── */}
          <div>
            <motion.div
              className="glass-card-strong rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.1)] p-8 sticky top-6 border border-white/40"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#0F172A]">Generated Content</h2>
                {currentDraft && !isLoading && (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCopy}
                      className="p-2.5 text-[#64748B] hover:text-[#2EC4B6] glass-card border border-white/30 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(46,196,182,0.3)]"
                      title="Copy"
                    >
                      {copied ? <Check className="w-5 h-5 text-[#22C55E]" /> : <Copy className="w-5 h-5" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="p-2.5 text-[#64748B] hover:text-[#FF9F1C] glass-card border border-white/30 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(255,159,28,0.3)]"
                      title="Regenerate"
                    >
                      <RotateCw className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSave}
                      className="p-2.5 text-[#64748B] hover:text-[#22C55E] glass-card border border-white/30 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                      title="Save"
                    >
                      {saved ? <Check className="w-5 h-5 text-[#22C55E]" /> : <Save className="w-5 h-5" />}
                    </motion.button>
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
                    className="mb-5 flex items-start gap-3 bg-red-50 border-2 border-red-200 rounded-2xl p-4"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
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
                    <div className="relative mb-6">
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-[#2EC4B6]/30"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2EC4B6] to-[#4D9DE0] flex items-center justify-center shadow-[0_8px_32px_rgba(46,196,182,0.4)]">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                      AI Agents are working...
                    </h3>
                    <p className="text-sm text-[#64748B] max-w-xs leading-relaxed">
                      Researching, drafting, and quality-checking your content.
                      <br />
                      <span className="text-[#2EC4B6] font-medium">This takes about 15–20 seconds.</span>
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                      {['🔍 Researcher', '✍️ Creator', '🛡️ Sentinel'].map((step, i) => (
                        <motion.span
                          key={step}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.3 }}
                          className="px-3 py-1.5 text-xs font-medium bg-white/60 border border-white/40 rounded-full text-[#64748B]"
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
                    <motion.div
                      className="w-24 h-24 glass-card rounded-full flex items-center justify-center mb-4 border border-white/30"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-12 h-12 text-[#CBD5E1]" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Ready to Create?</h3>
                    <p className="text-[#64748B] max-w-sm text-sm">
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
                    {/* Platform not generated warning */}
                    {!currentDraft && (
                      <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700">
                          No content was generated for <strong>{platform}</strong>.
                          Switch to <strong>LinkedIn</strong>, <strong>Twitter/X</strong>, or <strong>Instagram</strong> to view your drafts.
                        </p>
                      </div>
                    )}

                    {currentDraft && (
                      <>
                        {/* Copy text box */}
                        <div className="p-5 glass-card rounded-2xl border border-white/30 min-h-[160px]">
                          <p className="whitespace-pre-wrap text-[#0F172A] leading-relaxed text-sm">
                            {currentDraft.text}
                          </p>
                        </div>

                        {/* Success pill */}
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-4 glass-card border-2 border-[#22C55E]/30 rounded-2xl"
                        >
                          <div className="w-7 h-7 bg-gradient-to-br from-[#22C55E] to-[#16A34A] rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(34,197,94,0.4)]">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm text-[#0F172A] font-medium">
                            Content approved by Sentinel ✨
                          </p>
                        </motion.div>

                        {/* ── AI Image Generator section ── */}
                        <div className="border-t border-white/30 pt-5">
                          <div className="flex items-center gap-2 mb-3">
                            <ImageIcon className="w-5 h-5 text-[#4D9DE0]" />
                            <h3 className="font-bold text-[#0F172A]">AI Image Generator</h3>
                          </div>

                          {/* Image prompt display */}
                          <div className="mb-4">
                            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-1.5">
                              Art Director's Visual Prompt
                            </p>
                            <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                              <p className="text-xs text-[#64748B] italic leading-relaxed">
                                {currentDraft.image_prompt}
                              </p>
                            </div>
                          </div>

                          {/* Generate Visual button */}
                          <motion.button
                            onClick={handleGenerateImage}
                            disabled={isImageLoading}
                            whileHover={!isImageLoading ? { scale: 1.02, y: -1 } : {}}
                            whileTap={!isImageLoading ? { scale: 0.98 } : {}}
                            className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-medium transition-all ${isImageLoading
                              ? 'bg-[#E5E7EB] text-[#94A3B8] cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#4D9DE0] to-[#818CF8] text-white shadow-[0_8px_24px_rgba(77,157,224,0.35)] hover:shadow-[0_12px_32px_rgba(77,157,224,0.5)]'
                              }`}
                          >
                            {isImageLoading ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating Visual...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5" />
                                Generate Visual
                              </>
                            )}
                          </motion.button>

                          {/* Composite Poster */}
                          <AnimatePresence>
                            {generatedImage && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                                className="mt-4 space-y-4"
                              >
                                {/* Poster frame */}
                                <div ref={posterRef} className="relative aspect-square overflow-hidden rounded-2xl">
                                  {/* Background image */}
                                  <img
                                    src={`data:image/png;base64,${generatedImage}`}
                                    alt="AI Generated Graphic"
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />

                                  {/* Dark gradient overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/95 via-[#0F172A]/50 to-transparent" />

                                  {/* Text block */}
                                  <div className="absolute bottom-0 left-0 right-0 p-8">
                                    {posterHeadline && (
                                      <h2 className="text-3xl font-extrabold text-white uppercase tracking-tight">
                                        {posterHeadline}
                                      </h2>
                                    )}
                                    {posterSubheadline && (
                                      <p className="text-sm text-gray-200 mt-2 font-medium">
                                        {posterSubheadline}
                                      </p>
                                    )}

                                    {/* Footer row */}
                                    <div className="flex items-center justify-between mt-6">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-[#2EC4B6]" />
                                        <span className="text-xs font-bold text-white tracking-wide">PitchPleaseAI</span>
                                      </div>
                                      <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white bg-white/20 backdrop-blur-sm rounded-full">
                                        Link in Bio
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Download button */}
                                <motion.button
                                  whileHover={{ scale: 1.02, y: -1 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={async () => {
                                    if (!posterRef.current) return;
                                    const canvas = await html2canvas(posterRef.current, { useCORS: true, scale: 2 });
                                    const link = document.createElement('a');
                                    link.download = 'pitchplease-ai-poster.png';
                                    link.href = canvas.toDataURL('image/png');
                                    link.click();
                                  }}
                                  className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-medium bg-gradient-to-r from-[#2EC4B6] to-[#4D9DE0] text-white shadow-[0_8px_24px_rgba(46,196,182,0.35)] hover:shadow-[0_12px_32px_rgba(46,196,182,0.5)] transition-all"
                                >
                                  <Save className="w-5 h-5" />
                                  Download Ready-to-Post Graphic
                                </motion.button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
