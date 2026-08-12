import { motion } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  Store,
  Sparkles,
  UploadCloud,
  Brain,
  Loader2,
  Check,
  X,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';

export function BusinessSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingImages, setIsDraggingImages] = useState(false);

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(true);
  };
  const handleLogoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
  };
  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleProductDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImages(true);
  };
  const handleProductDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImages(false);
  };
  const handleProductDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImages(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProductImageUpload(e.dataTransfer.files);
    }
  };

  const logoInputRef = useRef<HTMLInputElement>(null);
  const productImagesInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    business_description: '',
    brand_voice: [] as string[],
    brand_values: [] as string[],
    target_audience: '',
    products_services: '',
    logo_url: '',
    brand_images: [] as string[],
    ai_instructions: '',
  });

  const industries = [
    'Retail & E-commerce',
    'Food & Beverage',
    'Fashion & Beauty',
    'Technology & SaaS',
    'Healthcare & Wellness',
    'Education & Coaching',
    'Real Estate',
    'Professional Services',
    'Arts, Crafts & Handmade',
    'Other',
  ];

  const brandVoiceOptions = [
    { label: 'Friendly', desc: 'Warm, welcoming and easygoing' },
    { label: 'Professional', desc: 'Authoritative, polished and clear' },
    { label: 'Playful', desc: 'Fun, witty and humorous' },
    { label: 'Luxury', desc: 'Elegant, refined and exclusive' },
    { label: 'Bold', desc: 'Direct, confident and impactful' },
    { label: 'Educational', desc: 'Informative, guiding and insightful' },
    { label: 'Inspirational', desc: 'Uplifting, motivating and ambitious' },
  ];

  const brandValuesOptions = [
    'Trust',
    'Quality',
    'Innovation',
    'Sustainability',
    'Community',
    'Affordability',
    'Luxury',
    'Authenticity',
  ];

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  // Fetch existing business profile on mount if available
  useEffect(() => {
    const existingId = localStorage.getItem('business_id');
    if (!existingId) return;

    fetch(`${API_BASE}/business/${existingId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setFormData((prev) => ({
          ...prev,
          business_name: data.business_name || data.name || prev.business_name,
          industry: data.industry || prev.industry,
          business_description: data.business_description || prev.business_description,
          brand_voice: Array.isArray(data.brand_voice) ? data.brand_voice : (data.tone ? [data.tone] : prev.brand_voice),
          brand_values: Array.isArray(data.brand_values) ? data.brand_values : prev.brand_values,
          target_audience: data.target_audience || prev.target_audience,
          products_services: data.products_services || prev.products_services,
          logo_url: data.logo_url || prev.logo_url,
          brand_images: Array.isArray(data.brand_images) ? data.brand_images : prev.brand_images,
          ai_instructions: data.ai_instructions || prev.ai_instructions,
        }));
      })
      .catch((err) => console.log('No existing business profile loaded:', err));
  }, []);

  // Toggle multi-select voice
  const toggleVoice = (voice: string) => {
    if (formData.brand_voice.includes(voice)) {
      setFormData({ ...formData, brand_voice: formData.brand_voice.filter((v) => v !== voice) });
    } else {
      setFormData({ ...formData, brand_voice: [...formData.brand_voice, voice] });
    }
  };

  // Toggle multi-select values (max 5)
  const toggleValue = (val: string) => {
    if (formData.brand_values.includes(val)) {
      setFormData({ ...formData, brand_values: formData.brand_values.filter((v) => v !== val) });
    } else {
      if (formData.brand_values.length >= 5) {
        alert('You can select up to 5 brand values.');
        return;
      }
      setFormData({ ...formData, brand_values: [...formData.brand_values, val] });
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPEG, WebP, SVG).');
      return;
    }
    setIsUploadingLogo(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const res = await fetch(`${API_BASE}/business/upload-asset`, {
        method: 'POST',
        body: uploadData,
      });
      if (res.ok) {
        const data = await res.json();
        const fullUrl = data.url.startsWith('http') ? data.url : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:8000'}${data.url}`;
        setFormData((prev) => ({ ...prev, logo_url: fullUrl }));
      } else {
        // Fallback to local data URL preview if backend is unreachable
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData((prev) => ({ ...prev, logo_url: e.target?.result as string }));
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({ ...prev, logo_url: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle Product Images Upload
  const handleProductImageUpload = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setIsUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (const file of validFiles) {
      try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        const res = await fetch(`${API_BASE}/business/upload-asset`, {
          method: 'POST',
          body: uploadData,
        });
        if (res.ok) {
          const data = await res.json();
          const fullUrl = data.url.startsWith('http') ? data.url : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:8000'}${data.url}`;
          uploadedUrls.push(fullUrl);
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setFormData((prev) => ({
                ...prev,
                brand_images: [...prev.brand_images, e.target?.result as string],
              }));
            }
          };
          reader.readAsDataURL(file);
        }
      } catch {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setFormData((prev) => ({
              ...prev,
              brand_images: [...prev.brand_images, e.target?.result as string],
            }));
          }
        };
        reader.readAsDataURL(file);
      }
    }

    if (uploadedUrls.length > 0) {
      setFormData((prev) => ({
        ...prev,
        brand_images: [...prev.brand_images, ...uploadedUrls],
      }));
    }
    setIsUploadingImages(false);
  };

  const removeProductImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      brand_images: prev.brand_images.filter((_, i) => i !== index),
    }));
  };

  // Navigation Logic
  const canContinue = () => {
    if (step === 1) {
      return formData.business_name.trim() !== '' && formData.industry !== '';
    }
    if (step === 2) {
      return formData.brand_voice.length > 0;
    }
    return true;
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    const existingId = localStorage.getItem('business_id') || crypto.randomUUID();
    localStorage.setItem('business_id', existingId);

    try {
      const response = await fetch(`${API_BASE}/business/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY || '',
        },
        body: JSON.stringify({
          business_id: existingId,
          business_name: formData.business_name,
          industry: formData.industry,
          business_description: formData.business_description,
          brand_voice: formData.brand_voice,
          brand_values: formData.brand_values,
          target_audience: formData.target_audience,
          products_services: formData.products_services,
          logo_url: formData.logo_url,
          brand_images: formData.brand_images,
          ai_instructions: formData.ai_instructions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.business_id) {
          localStorage.setItem('business_id', data.business_id);
        }
      }
    } catch (error) {
      console.warn('Business setup server sync note:', error);
    } finally {
      setIsSubmitting(false);
      navigate('/app');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const progressPercent = Math.round((step / 4) * 100);

  return (
    <div className="min-h-screen bg-[#fef8f4] text-[#1d1b19] flex flex-col font-body antialiased relative overflow-hidden">
      {/* Top Thin Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-[#ece7e3] z-50">
        <div
          className="h-full bg-[#b51d0d] transition-all duration-500 ease-in-out rounded-r-full shadow-[0_0_8px_rgba(181,29,13,0.4)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Navigation Header */}
      <header className="w-full max-w-4xl mx-auto px-6 pt-6 flex items-center justify-between z-20">
        {step > 1 ? (
          <button
            onClick={handleBack}
            aria-label="Go back"
            className="p-2.5 rounded-full text-[#5b403c] bg-white border border-[#e4beb7] hover:bg-[#f8f3ef] hover:text-[#1d1b19] transition-all flex items-center gap-2 shadow-sm text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5b403c]">
          <span>Step {step} of 4</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#b51d0d]" />
          <span className="text-[#1d1b19]">
            {step === 1 && 'Business Info'}
            {step === 2 && 'Brand Identity'}
            {step === 3 && 'Brand Assets'}
            {step === 4 && 'AI Instructions'}
          </span>
        </div>

        <button
          onClick={() => navigate('/app')}
          className="text-xs font-medium text-[#8f706a] hover:text-[#b51d0d] transition-colors"
        >
          Skip for now
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto p-6 flex flex-col justify-center my-auto z-10">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="w-full bg-white rounded-[28px] p-6 md:p-10 shadow-[0_12px_32px_rgba(18,17,15,0.08)] border border-[#ece7e3]"
        >
          {/* STEP 1: Business Information */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#fef8f4] rounded-2xl flex items-center justify-center border border-[#e4beb7]/40 text-[#b51d0d]">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#1d1b19]">
                    Step 1 – Business Information
                  </h1>
                  <p className="text-sm text-[#5b403c]">
                    Tell us about your brand so AI can tailor every post to your business.
                  </p>
                </div>
              </div>

              <div className="space-y-5 mt-6">
                <div>
                  <label className="block text-xs font-semibold text-[#1d1b19] mb-1.5 uppercase tracking-wider">
                    Business Name <span className="text-[#b51d0d]">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Royal Bakery or Lumina Skincare"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className="w-full bg-white border border-[#e4beb7] rounded-xl px-4 py-3 text-sm text-[#1d1b19] placeholder:text-[#8f706a]/50 focus:outline-none focus:border-[#b51d0d] focus:ring-1 focus:ring-[#b51d0d] transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1d1b19] mb-1.5 uppercase tracking-wider">
                    Industry / Category <span className="text-[#b51d0d]">*</span>
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-white border border-[#e4beb7] rounded-xl px-4 py-3 text-sm text-[#1d1b19] focus:outline-none focus:border-[#b51d0d] focus:ring-1 focus:ring-[#b51d0d] transition-all shadow-sm"
                  >
                    <option value="">Select an Industry</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1d1b19] mb-1.5 uppercase tracking-wider">
                    Business Description (2–3 lines)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what your business does, your mission, and unique selling points..."
                    value={formData.business_description}
                    onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                    className="w-full bg-white border border-[#e4beb7] rounded-xl px-4 py-3 text-sm text-[#1d1b19] placeholder:text-[#8f706a]/50 focus:outline-none focus:border-[#b51d0d] focus:ring-1 focus:ring-[#b51d0d] transition-all shadow-sm resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Brand Identity */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#fef8f4] rounded-2xl flex items-center justify-center border border-[#e4beb7]/40 text-[#b51d0d]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#1d1b19]">
                    Step 2 – Brand Identity
                  </h1>
                  <p className="text-sm text-[#5b403c]">
                    Define your brand voice, values, target audience, and key offerings.
                  </p>
                </div>
              </div>

              <div className="space-y-6 mt-6">
                {/* Brand Voice Multi-select */}
                <div>
                  <label className="block text-xs font-semibold text-[#1d1b19] mb-2 uppercase tracking-wider">
                    Brand Voice (Multi-select) <span className="text-[#b51d0d]">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {brandVoiceOptions.map((v) => {
                      const isSelected = formData.brand_voice.includes(v.label);
                      return (
                        <button
                          type="button"
                          key={v.label}
                          onClick={() => toggleVoice(v.label)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-[#b51d0d] bg-[#b51d0d] text-white shadow-sm ring-1 ring-[#b51d0d]'
                              : 'border-[#e4beb7] bg-white text-[#1d1b19] hover:bg-[#f8f3ef]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs">{v.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`text-[11px] block mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#5b403c]'}`}>
                            {v.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Brand Values Multi-select (Up to 5) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#1d1b19] uppercase tracking-wider">
                      Brand Values (Select up to 5)
                    </label>
                    <span className="text-xs text-[#8f706a]">
                      {formData.brand_values.length} / 5 selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {brandValuesOptions.map((val) => {
                      const isSelected = formData.brand_values.includes(val);
                      return (
                        <button
                          type="button"
                          key={val}
                          onClick={() => toggleValue(val)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'border-[#b51d0d] bg-[#ffdad4]/40 text-[#b51d0d] font-semibold border-[#b51d0d]'
                              : 'border-[#e4beb7] bg-white text-[#5b403c] hover:bg-[#f8f3ef]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-[#b51d0d]" />}
                          <span>{val}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-semibold text-[#1d1b19] mb-1.5 uppercase tracking-wider">
                    Target Audience
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. College students looking for affordable skincare."
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full bg-white border border-[#e4beb7] rounded-xl px-4 py-3 text-sm text-[#1d1b19] placeholder:text-[#8f706a]/50 focus:outline-none focus:border-[#b51d0d] focus:ring-1 focus:ring-[#b51d0d] transition-all shadow-sm resize-none"
                  />
                </div>

                {/* Products / Services */}
                <div>
                  <label className="block text-xs font-semibold text-[#1d1b19] mb-1.5 uppercase tracking-wider">
                    Products / Services
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. We provide handcrafted scented candles made from soy wax."
                    value={formData.products_services}
                    onChange={(e) => setFormData({ ...formData, products_services: e.target.value })}
                    className="w-full bg-white border border-[#e4beb7] rounded-xl px-4 py-3 text-sm text-[#1d1b19] placeholder:text-[#8f706a]/50 focus:outline-none focus:border-[#b51d0d] focus:ring-1 focus:ring-[#b51d0d] transition-all shadow-sm resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Brand Assets */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#fef8f4] rounded-2xl flex items-center justify-center border border-[#e4beb7]/40 text-[#b51d0d]">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#1d1b19]">
                    Step 3 – Brand Assets
                  </h1>
                  <p className="text-sm text-[#5b403c]">
                    Upload your logo and product imagery for visual AI consistency.
                  </p>
                </div>
              </div>

              <div className="space-y-6 mt-6">
                {/* Brand Logo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-[#1d1b19] mb-2 uppercase tracking-wider">
                    Brand Logo (Single Image)
                  </label>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoUpload(e.target.files[0]);
                      }
                    }}
                  />

                  {formData.logo_url ? (
                    <div className="relative w-32 h-32 rounded-2xl border border-[#e4beb7] overflow-hidden bg-gray-50 flex items-center justify-center p-2 shadow-sm group">
                      <img src={formData.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo_url: '' })}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      onDragOver={handleLogoDragOver}
                      onDragLeave={handleLogoDragLeave}
                      onDrop={handleLogoDrop}
                      className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group ${
                        isDraggingLogo
                          ? 'border-[#b51d0d] bg-[#ffdad4]/40 scale-[1.01]'
                          : 'border-[#e4beb7] hover:border-[#b51d0d] bg-[#fef8f4]/50'
                      }`}
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="w-8 h-8 text-[#b51d0d] animate-spin" />
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 text-[#8f706a] group-hover:text-[#b51d0d] transition-colors mb-2" />
                          <span className="text-xs font-semibold text-[#1d1b19]">
                            {isDraggingLogo ? 'Drop Logo File Here' : 'Click or Drag to Upload Logo'}
                          </span>
                          <span className="text-[11px] text-[#8f706a]">PNG, JPEG, WebP, SVG</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Product / Service Images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#1d1b19] uppercase tracking-wider">
                      Product / Service Images (3–5 recommended)
                    </label>
                    <span className="text-xs text-[#8f706a]">
                      {formData.brand_images.length} uploaded
                    </span>
                  </div>

                  <input
                    ref={productImagesInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleProductImageUpload(e.target.files);
                      }
                    }}
                  />

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                    {formData.brand_images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl border border-[#e4beb7] overflow-hidden bg-gray-50 flex items-center justify-center group shadow-sm"
                      >
                        <img src={imgUrl} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeProductImage(idx)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <div
                      onClick={() => productImagesInputRef.current?.click()}
                      onDragOver={handleProductDragOver}
                      onDragLeave={handleProductDragLeave}
                      onDrop={handleProductDrop}
                      className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group ${
                        isDraggingImages
                          ? 'border-[#b51d0d] bg-[#ffdad4]/40 scale-[1.02]'
                          : 'border-[#e4beb7] hover:border-[#b51d0d] bg-[#fef8f4]/50'
                      }`}
                    >
                      {isUploadingImages ? (
                        <Loader2 className="w-5 h-5 text-[#b51d0d] animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-5 h-5 text-[#8f706a] group-hover:text-[#b51d0d] mb-1" />
                          <span className="text-[10px] font-semibold text-[#1d1b19]">
                            {isDraggingImages ? 'Drop Images' : 'Add Image'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AI Instructions */}
          {step === 4 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#fef8f4] rounded-2xl flex items-center justify-center border border-[#e4beb7]/40 text-[#b51d0d]">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#1d1b19]">
                    Step 4 – Persistent AI Instructions
                  </h1>
                  <p className="text-sm text-[#5b403c]">
                    Set permanent guardrails and preferences for every piece of generated content.
                  </p>
                </div>
              </div>

              <div className="space-y-6 mt-6">
                <div>
                  <label className="block text-xs font-semibold text-[#1d1b19] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Anything the AI should always remember while creating content?</span>
                    <HelpCircle className="w-3.5 h-3.5 text-[#8f706a]" />
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Never sound too salesy. Mention eco-friendly packaging whenever relevant. Keep captions short."
                    value={formData.ai_instructions}
                    onChange={(e) => setFormData({ ...formData, ai_instructions: e.target.value })}
                    className="w-full bg-white border border-[#e4beb7] rounded-xl px-4 py-3 text-sm text-[#1d1b19] placeholder:text-[#8f706a]/50 focus:outline-none focus:border-[#b51d0d] focus:ring-1 focus:ring-[#b51d0d] transition-all shadow-sm resize-none"
                  />
                </div>

                {/* Summary Preview Box */}
                <div className="bg-[#fef8f4] border border-[#e4beb7]/60 rounded-2xl p-4 text-xs space-y-2">
                  <div className="font-semibold text-[#1d1b19] uppercase tracking-wider flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-[#b51d0d]" />
                    <span>Brand Memory Brief Summary</span>
                  </div>
                  <div className="text-[#5b403c] space-y-1">
                    <p>
                      <strong>Business:</strong> {formData.business_name || 'N/A'} ({formData.industry || 'General'})
                    </p>
                    <p>
                      <strong>Voice:</strong> {formData.brand_voice.join(', ') || 'Default'}
                    </p>
                    {formData.brand_values.length > 0 && (
                      <p>
                        <strong>Values:</strong> {formData.brand_values.join(', ')}
                      </p>
                    )}
                    {formData.ai_instructions && (
                      <p>
                        <strong>Custom Rules:</strong> {formData.ai_instructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#ece7e3]">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 rounded-xl font-medium text-xs text-[#5b403c] hover:bg-[#f8f3ef] transition-colors"
              >
                Previous
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || !canContinue()}
              className="bg-[#b51d0d] hover:bg-[#d83824] active:scale-[0.98] text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{step === 4 ? 'Complete & Save Memory' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
