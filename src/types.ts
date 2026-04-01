export interface ProcessedImage {
  id: string;
  file: File;
  preview: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
}

export type ImageTypeHint = '人物肖像' | '产品广告' | '风景照片' | '插画艺术' | '海报设计' | '截图界面' | '自动识别';

export interface AnalysisOptions {
  typeHint: ImageTypeHint;
  focus: string;
  language: '中文' | '英文';
}
