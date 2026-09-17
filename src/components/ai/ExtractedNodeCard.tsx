import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Link, ArrowRight } from 'lucide-react';
import { PropositionNode, NODE_TYPES } from '../../types';
import { ExtractedProposition, IngestionBuildMode } from '../../types/ai';
import { MathRenderer } from '../MathRenderer';

interface ExtractedNodeCardProps {
  item: ExtractedProposition;
  isSelected: boolean;
  onToggleSelect: (tempId: string) => void;
  buildMode: IngestionBuildMode;
  onOpenSingle: (item: ExtractedProposition) => void;
  existingNodeMap: Map<string, PropositionNode>;
  allExtractedNodes: ExtractedProposition[];
  isDark: boolean;
}

export const ExtractedNodeCard: React.FC<ExtractedNodeCardProps> = ({
  item,
  isSelected,
  onToggleSelect,
  buildMode,
  onOpenSingle,
  existingNodeMap,
  allExtractedNodes,
  isDark
}) => {
  const [isProofExpanded, setIsProofExpanded] = useState<boolean>(false);
  const typeMeta = NODE_TYPES[item.type] || { label: item.type, color: 'bg-zinc-500' };

  return (
    <div
      className={`p-3.5 rounded-xl border text-xs transition-all ${
        isSelected
          ? isDark
            ? 'bg-blue-950/20 border-blue-500/50 shadow-sm'
            : 'bg-blue-50/60 border-blue-400/80 shadow-xs'
          : isDark
            ? 'bg-white/5 border-white/10 opacity-85 hover:opacity-100'
            : 'bg-white border-black/10 opacity-85 hover:opacity-100 shadow-xs'
      }`}
    >
      {/* Header: Select Checkbox, Type Badge, Title, and Action */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start space-x-2.5 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.tempId)}
            className="w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0 mt-0.5"
          />
          <span className={`px-2 py-0.5 rounded text-[10px] text-white font-medium shrink-0 ${typeMeta.color}`}>
            {typeMeta.label}
          </span>
          <h4 className="font-serif font-bold text-sm leading-snug break-words min-w-0 flex-1">
            {item.title}
          </h4>
        </div>

        {buildMode === 'single' && (
          <button
            type="button"
            onClick={() => onOpenSingle(item)}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium shrink-0 shadow-xs transition-colors"
          >
            精修编辑 &rarr;
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="mt-2.5 pl-6.5 space-y-2.5">
        {/* Section 1: 命题陈述 (Statement) */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold mb-1 block">
            【命题陈述】
          </span>
          <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/30 font-serif leading-relaxed text-xs overflow-x-auto break-words border border-black/5 dark:border-white/5">
            <MathRenderer content={item.statement} />
          </div>
        </div>

        {/* Section 2: 证明思路 (Proof Sketch) */}
        {item.proof_sketch && (
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold mb-1 block">
              【证明思路】
            </span>
            <div className="p-2 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 text-[11px] font-serif leading-relaxed opacity-90 overflow-x-auto break-words">
              <MathRenderer content={item.proof_sketch} />
            </div>
          </div>
        )}

        {/* Section 3: 命题严格证明 (Full Proof) - Collapsible */}
        {item.full_proof && (
          <div>
            <button
              type="button"
              onClick={() => setIsProofExpanded(!isProofExpanded)}
              className="flex items-center space-x-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline py-0.5 select-none"
            >
              {isProofExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>【严格证明】{isProofExpanded ? '收起推导' : '点击展开分步推导'}</span>
            </button>

            {isProofExpanded && (
              <div className="mt-1.5 p-2.5 rounded-lg bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 text-xs font-serif leading-relaxed overflow-x-auto break-words whitespace-pre-wrap animate-in fade-in duration-150">
                <MathRenderer content={item.full_proof} />
              </div>
            )}
          </div>
        )}

        {/* Section 4: 前置依赖拓扑 (Dependencies) */}
        {(item.depends_on_existing_ids.length > 0 || item.depends_on_new_temp_ids.length > 0) && (
          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="opacity-60 flex items-center font-medium">
              <Link className="w-3 h-3 mr-1" /> 前置依赖:
            </span>
            {/* Existing canvas nodes */}
            {item.depends_on_existing_ids.map(id => {
              const existing = existingNodeMap.get(id);
              return (
                <span
                  key={id}
                  className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono flex items-center border border-emerald-500/20"
                >
                  {existing?.title || id} (已有)
                </span>
              );
            })}
            {/* In-batch new nodes */}
            {item.depends_on_new_temp_ids.map(tempId => {
              const targetNew = allExtractedNodes.find(n => n.tempId === tempId);
              return (
                <span
                  key={tempId}
                  className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono flex items-center border border-blue-500/20"
                >
                  <ArrowRight className="w-2.5 h-2.5 mr-0.5" />
                  {targetNew?.title || tempId}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
