import React, { useState } from 'react';
import { Copy, Check, Trash2, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { ProcessedImage } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface ResultCardProps {
  image: ProcessedImage;
  onRemove: (id: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ image, onRemove }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopy = async () => {
    if (!image.result) return;
    try {
      await navigator.clipboard.writeText(image.result);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('复制失败');
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md"
    >
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
            <img 
              src={image.preview} 
              alt="Preview" 
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{image.file.name}</p>
            <p className="text-xs text-gray-500">{(image.file.size / 1024).toFixed(1)} KB</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {image.status === 'processing' && (
            <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              分析中...
            </div>
          )}
          {image.status === 'completed' && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-600"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? '已复制' : '一键复制 JSON'}
            </button>
          )}
          {image.status === 'error' && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
              <AlertCircle className="h-3 w-3" />
              分析失败
            </div>
          )}
          <button
            onClick={() => onRemove(image.id)}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {image.status === 'processing' ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm">正在深度解析图片信息，请稍候...</p>
                </div>
              ) : image.status === 'completed' ? (
                <div className="relative">
                  <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-gray-900 p-5 font-mono text-[11px] leading-relaxed text-blue-300 scrollbar-thin scrollbar-thumb-gray-700">
                    <code>{image.result}</code>
                  </pre>
                </div>
              ) : image.status === 'error' ? (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                  {image.error || '解析图片时发生未知错误，请重试。'}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <p className="text-sm">等待开始分析...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
