import React from 'react';
import { PropositionNode } from '../../types';
import { SelectionWarningLevel } from '../../types/copilot';
import { Sparkles, AlertTriangle, AlertCircle, CheckCircle2, Globe, Paperclip, X } from 'lucide-react';

interface ContextPillProps {
  selectedNodes: PropositionNode[];
  attachmentName?: string;
  onClearAttachment?: () => void;
  isDark: boolean;
}

export const ContextPill: React.FC<ContextPillProps> = ({
  selectedNodes,
  attachmentName,
  onClearAttachment,
  isDark
}) => {
  const count = selectedNodes.length;

  let warningLevel: SelectionWarningLevel = 'empty';
  let warningMessage = '';

  if (count === 0) {
    warningLevel = 'empty';
    warningMessage = '全图顾问模式 (未圈选节点)';
  } else if (count >= 1 && count <= 6) {
    warningLevel = 'normal';
    warningMessage = `已选 ${count} 个命题 (精准聚焦)`;
  } else if (count >= 7 && count <= 12) {
    warningLevel = 'warn';
    warningMessage = `已选 ${count} 个命题 (范围偏大，建议精简)`;
  } else {
    warningLevel = 'danger';
    warningMessage = `已选 ${count} 个命题 (超限警示：推理可能耗时漂移)`;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 text-[11px] font-sans border-b border-inherit bg-black/5 dark:bg-white/5 transition-colors">
      {/* 选区胶囊 */}
      {count === 0 ? (
        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border ${
          isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300' : 'bg-stone-200/70 border-stone-300 text-stone-700'
        }`}>
          <Globe className="w-3 h-3 text-blue-500" />
          <span>{warningMessage}</span>
        </span>
      ) : (
        <span
          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border transition-all ${
            warningLevel === 'normal'
              ? isDark
                ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : warningLevel === 'warn'
              ? isDark
                ? 'bg-amber-950/50 border-amber-600/60 text-amber-300'
                : 'bg-amber-50 border-amber-300 text-amber-800'
              : isDark
              ? 'bg-rose-950/60 border-rose-600/70 text-rose-300 animate-pulse'
              : 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
          }`}
          title={warningMessage}
        >
          {warningLevel === 'normal' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          {warningLevel === 'warn' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
          {warningLevel === 'danger' && <AlertCircle className="w-3 h-3 text-rose-500" />}
          <span className="font-medium">{warningMessage}</span>
        </span>
      )}

      {/* 附件胶囊 */}
      {attachmentName && (
        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border ${
          isDark ? 'bg-blue-950/50 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <Paperclip className="w-2.5 h-2.5" />
          <span className="max-w-[120px] truncate">{attachmentName}</span>
          {onClearAttachment && (
            <button
              onClick={onClearAttachment}
              className="hover:opacity-100 opacity-60 ml-0.5"
              title="移除附件"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </span>
      )}
    </div>
  );
};
