import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { PropositionNode, NODE_TYPES } from '../../types';
import { latexToUnicode, formatSingleLineFormulaTitle } from '../../utils/latexToUnicode';
import { MathRenderer } from '../MathRenderer';

interface PrerequisitePickerProps {
  allNodes: PropositionNode[];
  currentNodeId: string;
  selectedPrereqIds: string[];
  onTogglePrereq: (nodeId: string) => void;
  isDark: boolean;
}

export const PrerequisitePicker: React.FC<PrerequisitePickerProps> = ({
  allNodes,
  currentNodeId,
  selectedPrereqIds,
  onTogglePrereq,
  isDark
}) => {
  const [prereqSearch, setPrereqSearch] = useState('');

  const candidatePrereqs = useMemo(() => {
    const q = prereqSearch.trim().toLowerCase();
    return allNodes
      .filter(n => n.id !== currentNodeId)
      .filter(n => {
        if (!q) return true;
        return n.title.toLowerCase().includes(q) || n.statement.toLowerCase().includes(q);
      });
  }, [allNodes, currentNodeId, prereqSearch]);

  return (
    <div className="border-t border-inherit pt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wider font-semibold opacity-60 font-serif">
          直接依赖前提 (Depends On: {selectedPrereqIds.length})
        </div>
        <span className="text-[10px] opacity-60">方式二：勾选建立关系</span>
      </div>

      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 opacity-50 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={prereqSearch}
          onChange={e => setPrereqSearch(e.target.value)}
          placeholder="搜索前置命题..."
          className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none font-serif transition-colors ${
            isDark
              ? 'bg-[#202024] border-[#3F3F46] text-white focus:border-blue-500'
              : 'bg-white border-[#D4CDC0] text-[#2C2B29] focus:border-blue-600'
          }`}
        />
      </div>

      <div
        className={`max-h-44 overflow-y-auto space-y-1 rounded-xl border p-1.5 ${
          isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-[#F5F2EB] border-[#D4CDC0]'
        }`}
      >
        {candidatePrereqs.map(cand => {
          const isChecked = selectedPrereqIds.includes(cand.id);
          const candType = NODE_TYPES[cand.type] || NODE_TYPES.theorem;

          return (
            <label
              key={cand.id}
              className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg cursor-pointer select-none transition-colors ${
                isChecked
                  ? isDark ? 'bg-[#3B82F6]/20 text-[#60A5FA]' : 'bg-[#EFF6FF] text-[#2563EB]'
                  : isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
              }`}
            >
              <div className="flex items-center space-x-2 truncate pr-2">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onTogglePrereq(cand.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-md uppercase font-mono border shrink-0"
                  style={{
                    backgroundColor: isDark ? candType.darkBgColor : candType.bgColor,
                    color: isDark ? candType.darkColor : candType.color,
                    borderColor: isDark ? candType.darkBorderColor : candType.borderColor
                  }}
                >
                  {candType.label}
                </span>
                <div
                  className="truncate font-serif min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap [&_*]:!inline [&_*]:!whitespace-nowrap [&_*]:!m-0 [&_*]:!p-0 [&_.katex-display]:!inline [&_.katex-display]:!m-0"
                  title={latexToUnicode(cand.title.replace(/[\r\n]+/g, ' · '))}
                >
                  <MathRenderer content={formatSingleLineFormulaTitle(cand.title)} />
                </div>
              </div>
            </label>
          );
        })}
        {candidatePrereqs.length === 0 && (
          <div className="text-center py-4 text-xs opacity-50">未搜索到匹配的命题</div>
        )}
      </div>
    </div>
  );
};
