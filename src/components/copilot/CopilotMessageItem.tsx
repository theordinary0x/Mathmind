import React, { useState } from 'react';
import { CopilotMessage, GraphMutationDiff } from '../../types/copilot';
import { PropositionNode } from '../../types';
import { MarkdownMathRenderer } from '../MarkdownMathRenderer';
import { DiffReviewCard } from './DiffReviewCard';
import { AttachmentPreviewModal, AttachmentPreviewData } from './AttachmentPreviewModal';
import { formatFileSize } from '../../utils/fileHelper';
import { Sparkles, User, Copy, Check, AlertCircle, Loader2, Square, Eye, FileText, FileCode } from 'lucide-react';

interface CopilotMessageItemProps {
  message: CopilotMessage;
  onApplyDiff: (messageId: string, selectedActionIds?: Set<string>) => void;
  onUpdateDiff?: (messageId: string, updatedDiff: GraphMutationDiff) => void;
  allNodes?: PropositionNode[];
  onNavigateToNode?: (nodeId: string) => void;
  onStopGeneration?: () => void;
  isDark: boolean;
}

export const CopilotMessageItem: React.FC<CopilotMessageItemProps> = ({
  message,
  onApplyDiff,
  onUpdateDiff,
  allNodes,
  onNavigateToNode,
  onStopGeneration,
  isDark
}) => {
  const [copied, setCopied] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewData | null>(null);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`flex flex-col space-y-1.5 my-3 ${isUser ? 'items-end' : 'items-start'}`}>
      {/* 角色与时间栏 */}
      <div className="flex items-center space-x-1.5 text-[10px] opacity-50 px-1">
        {isUser ? (
          <>
            <span>我</span>
            <User className="w-3 h-3" />
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Math Copilot</span>
          </>
        )}
      </div>

      {/* 消息主体容器 */}
      <div
        className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-xs transition-all shadow-xs relative group ${
          isUser
            ? isDark
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-[#2C2B29] text-[#FAF8F5] rounded-tr-none'
            : isDark
            ? 'bg-[#232328] border border-[#333338] text-zinc-100 rounded-tl-none'
            : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none'
        }`}
      >
        {/* 用户附带的选区上下文快照展示 */}
        {isUser && message.contextSnapshot && message.contextSnapshot.nodeIds.length > 0 && (
          <div className="mb-2 pb-1.5 border-b border-white/20 text-[10px] opacity-80 flex items-center space-x-1">
            <span>📍 基于选区:</span>
            <span className="font-serif truncate max-w-[200px]">
              {message.contextSnapshot.nodeTitles.slice(0, 3).join(', ')}
              {message.contextSnapshot.nodeTitles.length > 3 ? ' 等' : ''}
            </span>
          </div>
        )}

        {/* 用户附带的文件展示 (点击可放大全屏预览) */}
        {isUser && message.attachment && (
          <div className="mb-2 pb-1.5 border-b border-white/20">
            <button
              type="button"
              onClick={() => setPreviewAttachment(message.attachment!)}
              className="inline-flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] cursor-pointer transition-all max-w-full text-left"
              title="点击查看附件大图/文本内容"
            >
              {message.attachment.previewUrl ? (
                <img
                  src={message.attachment.previewUrl}
                  alt={message.attachment.name}
                  className="w-7 h-7 object-cover rounded border border-white/30 shrink-0"
                />
              ) : message.attachment.mimeType === 'application/pdf' || message.attachment.name.toLowerCase().endsWith('.pdf') ? (
                <FileText className="w-4 h-4 text-rose-300 shrink-0" />
              ) : message.attachment.textContent ? (
                <FileCode className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-blue-300 shrink-0" />
              )}
              <div className="flex flex-col min-w-0 pr-1">
                <span className="font-mono truncate max-w-[170px] font-medium leading-tight">
                  {message.attachment.name}
                </span>
                <span className="text-[9px] opacity-70">
                  {formatFileSize(message.attachment.size)} • 点击查看
                </span>
              </div>
              <Eye className="w-3 h-3 opacity-70 hover:opacity-100 shrink-0 ml-1" />
            </button>
          </div>
        )}

        {/* 错误提示 */}
        {message.error ? (
          <div className="flex items-start space-x-1.5 text-rose-400 py-1">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">请求遇到问题</div>
              <div className="opacity-90">{message.error}</div>
            </div>
          </div>
        ) : (
          /* 正文文本渲染 (支持 Markdown 与 LaTeX) */
          <div className="leading-relaxed break-words font-serif">
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <MarkdownMathRenderer content={message.content} isDark={isDark} />
            )}
          </div>
        )}

        {/* 流式生成中动画与取消按钮 */}
        {message.isStreaming && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-inherit text-blue-400">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px] animate-pulse">正在严密推导数学逻辑并生成图谱方案...</span>
            </div>
            {onStopGeneration && (
              <button
                type="button"
                onClick={onStopGeneration}
                className="flex items-center space-x-1 px-2 py-0.5 text-[10px] rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 border border-rose-500/30 transition-colors ml-2 shrink-0 cursor-pointer"
                title="立即中止本次生成 (Esc)"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>停止</span>
              </button>
            )}
          </div>
        )}

        {/* 附带的图变更审查卡片 */}
        {message.diffProposal && (
          <DiffReviewCard
            proposal={message.diffProposal}
            onApply={(selectedIds) => onApplyDiff(message.id, selectedIds)}
            onNavigateToNode={onNavigateToNode}
            onUpdateDiff={(updatedDiff) => onUpdateDiff?.(message.id, updatedDiff)}
            allNodes={allNodes}
            isDark={isDark}
          />
        )}

        {/* 复制按钮浮层 */}
        {!message.isStreaming && !message.error && (
          <button
            onClick={handleCopy}
            className={`absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity ${
              isUser ? 'text-white' : isDark ? 'text-zinc-400' : 'text-stone-500'
            }`}
            title="复制消息内容"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* 附件查看大弹窗 */}
      <AttachmentPreviewModal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment}
        isDark={isDark}
      />
    </div>
  );
};
