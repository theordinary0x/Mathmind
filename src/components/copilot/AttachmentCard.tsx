import React from 'react';
import { FileText, Image as ImageIcon, FileCode, X, Eye, FileSpreadsheet, Presentation } from 'lucide-react';

export interface CopilotAttachment {
  name: string;
  size: number;
  mimeType: string;
  data: string; // base64 if binary
  textContent?: string; // plain text if text/md/tex/json
  previewUrl?: string; // data url if image
}

interface AttachmentCardProps {
  attachment: CopilotAttachment;
  onRemove?: () => void;
  onPreview?: (attachment: CopilotAttachment) => void;
  isDark: boolean;
  compact?: boolean;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({
  attachment,
  onRemove,
  onPreview,
  isDark,
  compact = false
}) => {
  const lowerName = attachment.name.toLowerCase();
  const isImage = attachment.mimeType.startsWith('image/') || !!attachment.previewUrl;
  const isPdf = attachment.mimeType === 'application/pdf' || lowerName.endsWith('.pdf');
  const isWord = lowerName.endsWith('.docx');
  const isPpt = lowerName.endsWith('.pptx');
  const isSheet = lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv') || lowerName.endsWith('.tsv');

  return (
    <div
      className={`group relative mb-2 inline-flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-xs shadow-xs select-none transition-all ${
        isDark
          ? 'bg-[#25252A] border-[#38383F] text-zinc-200 hover:border-blue-500/50'
          : 'bg-stone-100 border-stone-300 text-stone-800 hover:border-blue-500/50'
      } ${onPreview ? 'cursor-pointer' : ''}`}
      onClick={() => onPreview?.(attachment)}
      title={onPreview ? '点击查看附件详细内容' : undefined}
    >
      {/* 缩略图或类型图标 */}
      <div className="relative shrink-0">
        {isImage && attachment.previewUrl ? (
          <img
            src={attachment.previewUrl}
            alt={attachment.name}
            className="w-7 h-7 object-cover rounded border border-black/10 dark:border-white/10 shrink-0"
          />
        ) : isWord ? (
          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
        ) : isPpt ? (
          <Presentation className="w-4 h-4 text-amber-500 shrink-0" />
        ) : isSheet ? (
          <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : isPdf ? (
          <FileText className="w-4 h-4 text-rose-500 shrink-0" />
        ) : attachment.textContent ? (
          <FileCode className="w-4 h-4 text-purple-500 shrink-0" />
        ) : (
          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
        )}

        {/* 悬停放大镜指示 */}
        {onPreview && (
          <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* 文件名与大小 */}
      <div className="flex flex-col min-w-0 pr-1">
        <span className={`font-mono truncate font-medium ${compact ? 'text-[10px] max-w-[140px]' : 'text-[11px] max-w-[180px]'}`}>
          {attachment.name}
        </span>
        <span className="text-[9px] opacity-60 font-sans">
          {formatFileSize(attachment.size)}
        </span>
      </div>

      {/* 删除按钮 */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-colors cursor-pointer"
          title="移除文件"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
