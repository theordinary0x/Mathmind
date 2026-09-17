import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { PropositionNode, NODE_TYPES } from '../../types';

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
        <Search className="w-3 h-3 opacity-50 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={prereqSearch}
          onChange={e => setPrereqSearch(e.target.value)}
          placeholder="搜索前置命题..."
          className={`w-full pl-7 pr-3 py-1 text-xs border focus:outline-none font-serif ${
            isDark
              ? 'bg-[#27272A] border-[#3F3F46] text-white'
              : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
          }`}
        />
      </div>

      <div
        className={`max-h-40 overflow-y-auto space-y-1 border p-1.5 ${
          isDark ? 'bg-[#222226] border-[#2E2E33]' : 'bg-[#FAF8F5] border-[#D4CDC0]'
        }`}
      >
        {candidatePrereqs.map(cand => {
          const isChecked = selectedPrereqIds.includes(cand.id);
          const candType = NODE_TYPES[cand.type] || NODE_TYPES.theorem;

          return (
            <label
              key={cand.id}
              className={`flex items-center justify-between px-2 py-1.5 text-xs cursor-pointer select-none transition-colors ${
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
                  className="text-[9px] px-1 py-0.2 uppercase font-mono border"
                  style={{
                    backgroundColor: isDark ? candType.darkBgColor : candType.bgColor,
                    color: isDark ? candType.darkColor : candType.color,
                    borderColor: isDark ? candType.darkBorderColor : candType.borderColor
                  }}
                >
                  {candType.label}
                </span>
                <span className="truncate font-serif">{cand.title}</span>
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
