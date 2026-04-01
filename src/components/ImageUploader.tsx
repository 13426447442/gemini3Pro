import React, { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, ClipboardPaste } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  className?: string;
}

export function ImageUploader({ onImagesSelected, className }: ImageUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onImagesSelected(acceptedFiles);
  }, [onImagesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif']
    }
  } as any);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        onImagesSelected(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onImagesSelected]);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out",
        "flex flex-col items-center justify-center p-12 text-center",
        isDragActive 
          ? "border-blue-500 bg-blue-50/50 scale-[0.99]" 
          : "border-gray-200 hover:border-blue-400 hover:bg-gray-50/50",
        className
      )}
    >
      <input {...getInputProps()} />
      
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500 transition-transform group-hover:scale-110">
        <Upload className="h-10 w-10" />
      </div>

      <h3 className="mb-2 text-xl font-semibold text-gray-900">
        {isDragActive ? "松开以上传图片" : "点击或拖拽图片到这里"}
      </h3>
      
      <p className="mb-8 max-w-xs text-sm text-gray-500">
        支持单张或批量上传，也支持直接粘贴 (Ctrl+V) 图片。
      </p>

      <div className="flex gap-4">
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
          <ImageIcon className="h-3.5 w-3.5" />
          JPG, PNG, WebP
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
          <ClipboardPaste className="h-3.5 w-3.5" />
          支持粘贴
        </div>
      </div>
    </div>
  );
}
