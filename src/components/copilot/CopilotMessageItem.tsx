import React, { useState } from 'react';
import { CopilotMessage, GraphMutationDiff } from '../../types/copilot';
import { PropositionNode } from '../../types';
import { MarkdownMathRenderer } from '../MarkdownMathRenderer';
import { DiffReviewCard } from './DiffReviewCard';
import { AttachmentPreviewModal, AttachmentPreviewData } from './AttachmentPreviewModal';
import { formatFileSize } from '../../utils/fileHelper';
import { SparkleAiVectorIcon } from '../icons/CustomIcons';
import {
  User,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Square,
  Eye,
  FileText,
  FileCode,
  RotateCcw,
  Edit2,
  FileSpreadsheet,
  Presentation,
  Clock,
  Send,
  Crosshair,
  GitCommit
} from 'lucide-react';

interface CopilotMessageItemProps {
  message: CopilotMessage;
  turnIndex?: number;
  isLast?: boolean;
  onApplyDiff: (messageId: string, selectedActionIds?: Set<string>) => void;
  onUpdateDiff?: (messageId: string, updatedDiff: GraphMutationDiff) => void;
  onRegenerate?: (messageId: string) => void;
  onEditAndResend?: (userMessageId: string, newContent: string) => void;
  allNodes?: PropositionNode[];
  onNavigateToNode?: (nodeId: string) => void;
  onStopGeneration?: () => void;
  isDark: boolean;
}

function formatMessageTime(ts?: number): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  } catch {
    return '';
  }
}

export const CopilotMessageItem: React.FC<CopilotMessageItemProps> = ({
  message,
  turnIndex,
  isLast = false,
  onApplyDiff,
  onUpdateDiff,
  onRegenerate,
  onEditAndResend,
  allNodes,
  onNavigateToNode,
  onStopGeneration,
  isDark
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewData | null>(null);
  const isUser = message.role === 'user';
  const hasDiff = Boolean(message.diffProposal);
  const isApplied = Boolean(message.diffProposal?.applied);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSaveEdit = () => {
    const clean = editText.trim();
    if (clean && onEditAndResend) {
      onEditAndResend(message.id, clean);
      setIsEditing(false);
    }
  };

  return (
    <div
      id={`copilot-msg-${message.id}`}
      className="relative pl-6 pr-5 py-2 group/turn"
    >
      {/* 左侧时间轴纵向轨道线 */}
      {!isLast && (
        <div
          className={`absolute left-[11px] top-6 -bottom-2 w-px ${
            isDark ? 'bg-white/10' : 'bg-black/10'
          }`}
        />
      )}

      {/* 左侧时间轴节点圆环 */}
      <div
        className={`absolute left-1 top-3 w-4 h-4 rounded-full flex items-center justify-center border z-10 transition-transform group-hover/turn:scale-110 ${
          hasDiff
            ? isApplied
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              : 'bg-amber-500/20 border-amber-500 text-amber-400'
            : isUser
            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
            : isDark
            ? 'bg-[#27272A] border-white/20 text-zinc-300'
            : 'bg-stone-200 border-black/20 text-stone-700'
        }`}
      >
        {hasDiff ? (
          <GitCommit className="w-2.5 h-2.5" />
        ) : isUser ? (
          <User className="w-2.5 h-2.5" />
        ) : (
          <SparkleAiVectorIcon size={10} />
        )}
      </div>

      <div className={`flex flex-col space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 角色、序号与时间戳栏 */}
        <div className="flex items-center space-x-2 text-[10px] opacity-60 px-1 font-mono">
          {turnIndex !== undefined && (
            <span className="opacity-60">#{turnIndex + 1}</span>
          )}
          {isUser ? (
            <span className="font-sans font-semibold text-blue-500">我的提问</span>
          ) : (
            <span className="font-sans font-semibold text-amber-500">Math Copilot</span>
          )}
          {message.timestamp && (
            <span>{formatMessageTime(message.timestamp)}</span>
          )}
          {hasDiff && (
            <span
              className={`px-1.5 py-0.2 rounded-md text-[9px] border ${
                isApplied
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
              }`}
            >
              {isApplied ? '图谱已变更' : '图谱提案'}
            </span>
          )}
        </div>

        {/* 消息主体容器 */}
        <div
          className={`max-w-[96%] px-3.5 py-2.5 rounded-2xl text-xs transition-all shadow-xs relative group border ${
            isUser
              ? isDark
                ? 'bg-blue-600/90 border-blue-500 text-white'
                : 'bg-[#2C2B29] border-[#2C2B29] text-[#FAF8F5]'
              : isDark
              ? 'bg-[#222227] border-[#333338] text-zinc-100'
              : 'bg-white border-stone-200 text-stone-800'
          }`}
        >
          {/* 用户附带的选区上下文快照展示 */}
          {isUser && message.contextSnapshot && message.contextSnapshot.nodeIds.length > 0 && (
            <div className="mb-2 pb-1.5 border-b border-white/20 text-[10px] opacity-85 flex items-center space-x-1.5">
              <Crosshair className="w-3 h-3 shrink-0" />
              <span>基于选区:</span>
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
                className="inline-flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] cursor-pointer transition-all max-w-full text-left"
                title="点击查看附件大图/文本内容"
              >
                {(() => {
                  const attName = message.attachment!.name.toLowerCase();
                  if (message.attachment!.previewUrl) {
                    return (
                      <img
                        src={message.attachment!.previewUrl}
                        alt={message.attachment!.name}
                        className="w-7 h-7 rounded-lg object-cover border border-white/30 shrink-0"
                      />
                    );
                  }
                  if (attName.endsWith('.docx')) {
                    return <FileText className="w-4 h-4 text-indigo-300 shrink-0" />;
                  }
                  if (attName.endsWith('.pptx')) {
                    return <Presentation className="w-4 h-4 text-amber-300 shrink-0" />;
                  }
                  if (attName.endsWith('.xlsx') || attName.endsWith('.csv') || attName.endsWith('.tsv')) {
                    return <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />;
                  }
                  if (message.attachment!.mimeType === 'application/pdf' || attName.endsWith('.pdf')) {
                    return <FileText className="w-4 h-4 text-rose-300 shrink-0" />;
                  }
                  if (message.attachment!.textContent) {
                    return <FileCode className="w-4 h-4 text-purple-300 shrink-0" />;
                  }
                  return <FileText className="w-4 h-4 text-blue-300 shrink-0" />;
                })()}
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
            <div className="flex items-start justify-between space-x-1.5 text-rose-400 py-1">
              <div className="flex items-start space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold">请求遇到问题</div>
                  <div className="opacity-90">{message.error}</div>
                </div>
              </div>
              {onRegenerate && (
                <button
                  type="button"
                  onClick={() => onRegenerate(message.id)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] cursor-pointer shrink-0"
                  title="重新尝试"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重试</span>
                </button>
              )}
            </div>
          ) : (
            /* 正文文本渲染 (支持 Markdown 与 LaTeX) */
            <div className="leading-relaxed break-words font-serif">
              {isUser ? (
                isEditing ? (
                  <div className="space-y-2 py-1">
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveEdit();
                        } else if (e.key === 'Escape') {
                          setIsEditing(false);
                          setEditText(message.content);
                        }
                      }}
                      autoFocus
                      rows={Math.min(6, Math.max(2, editText.split('\n').length))}
                      className="w-full rounded-xl bg-black/20 text-inherit border border-white/30 p-2 text-xs font-serif focus:outline-none focus:border-white resize-none"
                    />
                    <div className="flex items-center justify-end space-x-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditText(message.content);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-transparent hover:bg-white/20 opacity-80 hover:opacity-100 transition-colors cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-white/40 bg-white text-blue-900 hover:bg-white/90 font-medium transition-colors cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>保存并重新生成</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )
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
                  className="flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 border border-rose-500/30 transition-colors ml-2 shrink-0 cursor-pointer"
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

          {/* 用户消息悬停工具条 (编辑/复制) */}
          {isUser && !isEditing && (
            <div className="absolute top-1.5 right-1.5 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEditAndResend && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded-md hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="编辑提问并重新发送"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="复制消息内容"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}

          {/* Assistant 回复底部状态与操作栏 (耗时显示、重新生成、复制) */}
          {!isUser && !message.isStreaming && !message.error && (
            <div className="mt-2 pt-1.5 border-t border-inherit/40 flex items-center justify-between text-[10px] opacity-60 font-sans">
              <div className="flex items-center space-x-1 font-mono">
                {message.durationMs !== undefined && (
                  <span
                    className="flex items-center space-x-0.5 opacity-80"
                    title={`AI 推理与生成耗时 ${(message.durationMs / 1000).toFixed(2)} 秒`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    <span>{(message.durationMs / 1000).toFixed(1)}s</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onRegenerate && message.id !== 'msg_welcome' && (
                  <button
                    type="button"
                    onClick={() => onRegenerate(message.id)}
                    className="flex items-center space-x-1 px-1.5 py-0.5 rounded-md border border-transparent hover:border-inherit hover:bg-black/5 dark:hover:bg-white/5 hover:opacity-100 transition-colors cursor-pointer"
                    title="重新生成此回答"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>重新生成</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded-md border border-transparent hover:border-inherit hover:bg-black/5 dark:hover:bg-white/5 hover:opacity-100 transition-colors cursor-pointer"
                  title="复制内容"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}
        </div>
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
