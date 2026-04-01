import React, { useState, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { ImageUploader } from './components/ImageUploader';
import { ResultCard } from './components/ResultCard';
import { ProcessedImage, AnalysisOptions, ImageTypeHint } from './types';
import { analyzeImage } from './services/geminiService';
import { Sparkles, Settings2, Languages, Target, Trash2, Play, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [options, setOptions] = useState<AnalysisOptions>({
    typeHint: '自动识别',
    focus: '',
    language: '中文'
  });
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const handleImagesSelected = useCallback((files: File[]) => {
    const newImages: ProcessedImage[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      status: 'idle'
    }));
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // Clean up object URLs
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  }, []);

  const handleClearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const processImage = async (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image || image.status === 'processing') return;

    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, status: 'processing', error: undefined } : img
    ));

    try {
      const result = await analyzeImage(image.file, options);
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'completed', result } : img
      ));
    } catch (error: any) {
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'error', error: error.message || '分析失败' } : img
      ));
      toast.error(`分析失败: ${image.file.name}`);
    }
  };

  const handleProcessAll = async () => {
    const idleImages = images.filter(img => img.status === 'idle' || img.status === 'error');
    if (idleImages.length === 0) return;

    setIsProcessingAll(true);
    // Process in parallel with a limit or just sequential for better UX
    for (const img of idleImages) {
      await processImage(img.id);
    }
    setIsProcessingAll(false);
    toast.success('所有图片分析完成');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900 selection:bg-blue-100 selection:text-blue-700">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">VisionPrompt Pro</h1>
              <p className="text-xs font-medium text-gray-500">极高细节密度图片反推</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href="https://ai.google.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden text-xs font-medium text-gray-400 hover:text-gray-600 sm:block"
            >
              Powered by Gemini 3.1 Pro
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Left Column: Upload & Results */}
          <div className="min-w-0 space-y-8">
            <section>
              <ImageUploader onImagesSelected={handleImagesSelected} />
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  任务列表
                  {images.length > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-200 px-1.5 text-[10px] font-bold text-gray-600">
                      {images.length}
                    </span>
                  )}
                </h2>
                
                {images.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearAll}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      清空列表
                    </button>
                    <button
                      onClick={handleProcessAll}
                      disabled={isProcessingAll || images.every(img => img.status === 'completed')}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isProcessingAll ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      开始全部分析
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {images.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center"
                    >
                      <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-400">
                        <Target className="h-8 w-8" />
                      </div>
                      <p className="text-sm text-gray-500">暂无任务，请先上传图片</p>
                    </motion.div>
                  ) : (
                    images.map(image => (
                      <ResultCard 
                        key={image.id} 
                        image={image} 
                        onRemove={handleRemoveImage} 
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>

          {/* Right Column: Settings */}
          <aside className="space-y-6">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <div className="mb-6 flex items-center gap-2 text-sm font-bold">
                  <Settings2 className="h-4 w-4 text-blue-500" />
                  分析配置
                </div>

                <div className="space-y-6">
                  {/* Type Hint */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">图片类型提示</label>
                    <select
                      value={options.typeHint}
                      onChange={(e) => setOptions(prev => ({ ...prev, typeHint: e.target.value as ImageTypeHint }))}
                      className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm font-medium ring-1 ring-gray-200 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {['自动识别', '人物肖像', '产品广告', '风景照片', '插画艺术', '海报设计', '截图界面'].map(hint => (
                        <option key={hint} value={hint}>{hint}</option>
                      ))}
                    </select>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <Languages className="h-3 w-3" />
                      输出语言
                    </label>
                    <div className="flex gap-2">
                      {(['中文', '英文'] as const).map(lang => (
                        <button
                          key={lang}
                          onClick={() => setOptions(prev => ({ ...prev, language: lang }))}
                          className={cn(
                            "flex-1 rounded-xl py-2 text-xs font-bold transition-all",
                            options.language === lang 
                              ? "bg-blue-600 text-white shadow-sm" 
                              : "bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100"
                          )}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Focus */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <Target className="h-3 w-3" />
                      提取重点
                    </label>
                    <textarea
                      value={options.focus}
                      onChange={(e) => setOptions(prev => ({ ...prev, focus: e.target.value }))}
                      placeholder="例如：人物特征、色彩风格..."
                      className="h-24 w-full resize-none rounded-xl bg-gray-50 px-3 py-2.5 text-sm font-medium ring-1 ring-gray-200 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-blue-50 p-6 ring-1 ring-blue-100">
                <h4 className="mb-2 text-xs font-bold text-blue-700 uppercase tracking-wider">使用提示</h4>
                <ul className="space-y-2 text-xs leading-relaxed text-blue-600/80">
                  <li>• 批量上传可同时处理多张图片</li>
                  <li>• 粘贴功能支持从网页或剪贴板直接获取</li>
                  <li>• 细节密度极高，生成的 JSON 适合作为 AI 绘画提示词参考</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
