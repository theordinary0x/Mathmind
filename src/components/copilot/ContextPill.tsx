import React from 'react';
import { PropositionNode } from '../../types';
import { SelectionWarningLevel } from '../../types/copilot';
import { AlertTriangle, AlertCircle, CheckCircle2, Globe } from 'lucide-react';

interface ContextPillProps {
  selectedNodes: PropositionNode[];
  isDark: boolean;
}

export const ContextPill: React.FC<ContextPillProps> = ({
  selectedNodes,
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
    <div className="flex items-center px-3 py-1.5 text-[11px] font-sans border-b border-inherit bg-black/5 dark:bg-white/5 transition-colors">
      {count === 0 ? (
        <span
          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border ${
            isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300' : 'bg-stone-200/70 border-stone-300 text-stone-700'
          }`}
        >
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
    </div>
  );
};
