import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  FileCode,
  FileSpreadsheet,
  Presentation
} from 'lucide-react';
import { formatFileSize } from '../../utils/fileHelper';

export interface AttachmentPreviewData {
  name: string;
  size: number;
  mimeType: string;
  previewUrl?: string;
  textContent?: string;
  data?: string;
}

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: AttachmentPreviewData | null;
  isDark: boolean;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  isOpen,
  onClose,
  attachment,
  isDark
}) => {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);

  // 重置缩放状态
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setCopied(false);
    }
  }, [isOpen, attachment]);

  // Esc 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyText = useCallback(() => {
    if (!attachment?.textContent) return;
    navigator.clipboard.writeText(attachment.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [attachment?.textContent]);

  const handleOpenExternal = useCallback(() => {
    if (!attachment) return;
    if (attachment.previewUrl) {
      window.open(attachment.previewUrl, '_blank');
      return;
    }
    if (attachment.data) {
      const mime = attachment.mimeType || 'application/octet-stream';
      const dataUrl = `data:${mime};base64,${attachment.data}`;
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      }
    }
  }, [attachment]);

  const handleDownload = useCallback(() => {
    if (!attachment) return;
    const a = document.createElement('a');
    a.download = attachment.name;
    if (attachment.previewUrl) {
      a.href = attachment.previewUrl;
    } else if (attachment.data) {
      a.href = `data:${attachment.mimeType || 'application/octet-stream'};base64,${attachment.data}`;
    } else if (attachment.textContent) {
      const blob = new Blob([attachment.textContent], { type: 'text/plain;charset=utf-8' });
      a.href = URL.createObjectURL(blob);
    } else {
      return;
    }
    a.click();
  }, [attachment]);

  if (!isOpen || !attachment) return null;

  const lowerName = attachment.name.toLowerCase();
  const isImage = attachment.mimeType.startsWith('image/') || !!attachment.previewUrl;
  const isPdf = attachment.mimeType === 'application/pdf' || lowerName.endsWith('.pdf');
  const isWord = lowerName.endsWith('.docx');
  const isPpt = lowerName.endsWith('.pptx');
  const isSheet = lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv') || lowerName.endsWith('.tsv');
  const hasText = !!attachment.textContent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col border overflow-hidden transition-all ${
          isDark
            ? 'bg-[#1C1C20] border-[#333338] text-zinc-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部工具栏 */}
        <div className="px-5 py-3.5 border-b border-inherit flex items-center justify-between shrink-0 bg-black/5 dark:bg-white/5">
          <div className="flex items-center space-x-3 min-w-0 pr-4">
            <div className="p-2 bg-blue-500/10 text-blue-500 shrink-0">
              {isImage ? (
                <ImageIcon className="w-5 h-5" />
              ) : isWord ? (
                <FileText className="w-5 h-5 text-indigo-500" />
              ) : isPpt ? (
                <Presentation className="w-5 h-5 text-amber-500" />
              ) : isSheet ? (
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              ) : isPdf ? (
                <FileText className="w-5 h-5 text-rose-500" />
              ) : (
                <FileCode className="w-5 h-5 text-purple-500" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-sm truncate max-w-md" title={attachment.name}>
                {attachment.name}
              </h3>
              <div className="flex items-center space-x-2 text-[11px] opacity-60">
                <span>{formatFileSize(attachment.size)}</span>
                <span>•</span>
                <span className="font-mono text-[10px]">{attachment.mimeType || '未知类型'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {/* 图片缩放控制 */}
            {isImage && (
              <div className="flex items-center space-x-1 mr-2 px-2 py-1 bg-black/5 dark:bg-white/5 border border-inherit text-xs">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                  className="p-1 hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors"
                  title="缩小"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] w-12 text-center select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  className="p-1 hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors"
                  title="放大"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="p-1 hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors ml-1"
                  title="重置缩放"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 复制文本 */}
            {hasText && (
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center space-x-1 px-2.5 py-1 border border-inherit text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="复制文档文本"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制' : '复制文本'}</span>
              </button>
            )}

            {/* 新标签页打开 / 下载 */}
            {(attachment.previewUrl || attachment.data) && (
              <button
                type="button"
                onClick={handleOpenExternal}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 transition-colors cursor-pointer"
                title="在新标签页中查看"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 transition-colors cursor-pointer"
              title="下载文件"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors ml-2 cursor-pointer"
              title="关闭 (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 内容展示主体 */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[260px] max-h-[calc(85vh-60px)]">
          {isImage && (attachment.previewUrl || attachment.data) ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
              <img
                src={attachment.previewUrl || `data:${attachment.mimeType};base64,${attachment.data}`}
                alt={attachment.name}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                className="max-w-full max-h-[72vh] object-contain shadow-md transition-transform duration-150 select-none cursor-zoom-in"
                onClick={() => setZoom(z => (z === 1 ? 1.6 : 1))}
              />
            </div>
          ) : hasText ? (
            <div className="w-full h-full flex flex-col">
              <div className="text-[11px] opacity-60 mb-2 font-mono flex items-center justify-between">
                <span>📄 文本/代码内容预览</span>
                <span>{attachment.textContent?.length || 0} 字符</span>
              </div>
              <pre
                className={`flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed border select-text ${
                  isDark
                    ? 'bg-[#141417] border-[#2B2B30] text-zinc-200'
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                {attachment.textContent}
              </pre>
            </div>
          ) : isPdf ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="p-4 bg-rose-500/10 text-rose-500">
                <FileText className="w-12 h-12" />
              </div>
              <div className="font-serif font-semibold text-base">{attachment.name}</div>
              <div className="text-xs opacity-60 max-w-sm">
                PDF 文档已成功解析并附带于会话中。Google Gemini 将原生识别整份 PDF 中的定理与公式。
              </div>
              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>在浏览器预览窗口打开</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 border border-inherit hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载此 PDF</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 opacity-60">
              <FileText className="w-10 h-10" />
              <div className="text-xs">暂无内联预览，请通过右上角下载或外部打开。</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
