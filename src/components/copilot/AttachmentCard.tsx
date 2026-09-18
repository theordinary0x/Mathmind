import React from 'react';
import { FileText, Image as ImageIcon, FileCode, X } from 'lucide-react';

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
  onRemove: () => void;
  isDark: boolean;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({
  attachment,
  onRemove,
  isDark
}) => {
  const isImage = attachment.mimeType.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf';

  return (
    <div
      className={`mb-2 inline-flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-xs shadow-xs select-none transition-colors ${
        isDark
          ? 'bg-[#25252A] border-[#38383F] text-zinc-200'
          : 'bg-stone-100 border-stone-300 text-stone-800'
      }`}
    >
      {/* 缩略图或类型图标 */}
      {isImage && attachment.previewUrl ? (
        <img
          src={attachment.previewUrl}
          alt={attachment.name}
          className="w-7 h-7 object-cover rounded border border-black/10 dark:border-white/10 shrink-0"
        />
      ) : isPdf ? (
        <FileText className="w-4 h-4 text-rose-500 shrink-0" />
      ) : attachment.textContent ? (
        <FileCode className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : (
        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
      )}

      {/* 文件名与大小 */}
      <div className="flex flex-col min-w-0 pr-1">
        <span className="font-mono text-[11px] truncate max-w-[170px] font-medium">
          {attachment.name}
        </span>
        <span className="text-[9px] opacity-60 font-sans">
          {formatFileSize(attachment.size)}
        </span>
      </div>

      {/* 删除按钮 */}
      <button
        type="button"
        onClick={onRemove}
        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-colors cursor-pointer"
        title="移除文件"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
