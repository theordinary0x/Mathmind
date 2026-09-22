import React from 'react';
import { ChevronDown, ChevronRight, Sparkles, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { PropositionNode, NODE_TYPES } from '../../types';
import { latexToUnicode, formatSingleLineFormulaTitle } from '../../utils/latexToUnicode';
import { MathRenderer } from '../MathRenderer';

interface NodeReadViewProps {
  formData: PropositionNode;
  isDark: boolean;
  isFullProofExpanded: boolean;
  onToggleFullProof: () => void;
  prereqNodes: PropositionNode[];
  downstreamNodes: PropositionNode[];
  onNavigateToNode: (id: string) => void;
  onTriggerCopilot?: (prompt: string) => void;
  onSwitchToEdit: (field?: string) => void;
}

export const NodeReadView: React.FC<NodeReadViewProps> = ({
  formData,
  isDark,
  isFullProofExpanded,
  onToggleFullProof,
  prereqNodes,
  downstreamNodes,
  onNavigateToNode,
  onTriggerCopilot,
  onSwitchToEdit
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title & Tags */}
      <div>
        <h2 className="text-lg sm:text-xl font-serif font-bold tracking-tight leading-snug">
          <MathRenderer content={formData.title} />
        </h2>
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {formData.tags.map((tag, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 text-[11px] font-mono border ${
                  isDark
                    ? 'bg-zinc-800/60 border-zinc-700 text-zinc-300'
                    : 'bg-stone-100 border-stone-300 text-stone-700'
                }`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Statement Section */}
      <div
        className={`p-4 border ${
          isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-white border-[#D4CDC0]'
        }`}
      >
        <div className="text-[11px] uppercase tracking-wider font-semibold opacity-50 font-serif mb-2">
          命题陈述 (Statement)
        </div>
        <div className="font-serif text-sm sm:text-base leading-relaxed">
          <MathRenderer content={formData.statement} />
        </div>
      </div>

      {/* Proof Sketch (if present) */}
      {formData.proof_sketch && (
        <div
          className={`p-4 border border-dashed ${
            isDark ? 'bg-white/[0.02] border-white/15 text-zinc-300' : 'bg-[#FAF6F0] border-black/15 text-stone-800'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-50 font-serif mb-1.5">
            证明思路概括 (Proof Sketch)
          </div>
          <div className="font-serif text-xs sm:text-sm italic leading-relaxed">
            <MathRenderer content={formData.proof_sketch} />
          </div>
        </div>
      )}

      {/* Full Proof (Collapsible) */}
      <div className="border-t border-inherit pt-4">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={onToggleFullProof}
            className="flex items-center space-x-1.5 text-xs font-semibold font-serif text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            {isFullProofExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>完整严格证明 (Full Proof)</span>
            {formData.full_proof && (
              <span className="text-[11px] opacity-60 font-mono">({formData.full_proof.length} 字符)</span>
            )}
          </button>

          {onTriggerCopilot && !formData.full_proof && (
            <button
              type="button"
              onClick={() => onTriggerCopilot(`请为命题【${formData.title}】补充完整严谨的分步数学推导证明。`)}
              className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-serif border transition-all cursor-pointer ${
                isDark
                  ? 'border-[#E07A5F]/40 bg-[#E07A5F]/10 hover:bg-[#E07A5F]/20 text-[#F28482]'
                  : 'border-[#E07A5F]/40 bg-[#FFF5F2] hover:bg-[#FFEAE5] text-[#C45D40]'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>AI 补充证明</span>
            </button>
          )}
        </div>

        {isFullProofExpanded && (
          <div
            className={`mt-2 p-4 border animate-in fade-in duration-150 ${
              isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-white border-[#D4CDC0]'
            }`}
          >
            {formData.full_proof ? (
              <div className="font-serif text-xs sm:text-sm leading-relaxed space-y-2">
                <MathRenderer content={formData.full_proof} />
              </div>
            ) : (
              <div className="text-xs opacity-50 font-serif italic py-2">
                暂未录入完整详细证明推导。
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multi-Example Section (典型实例 / 算例) */}
      <div className="border-t border-inherit pt-4">
        <div className="text-[11px] uppercase tracking-wider font-semibold opacity-60 font-serif mb-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>典型实例 / 算例 (Examples)</span>
            {formData.examples && formData.examples.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono border rounded-xs opacity-75">
                {formData.examples.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onSwitchToEdit('examples')}
            className="flex items-center space-x-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>添加实例</span>
          </button>
        </div>

        {formData.examples && formData.examples.length > 0 ? (
          <div className="space-y-3">
            {formData.examples.map((example, idx) => (
              <div
                key={idx}
                className={`p-3.5 border transition-colors ${
                  isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-white border-[#D4CDC0]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-semibold opacity-60 uppercase">
                    例 {idx + 1}
                  </span>
                </div>
                <div className="font-serif text-xs sm:text-sm leading-relaxed">
                  <MathRenderer content={example} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs opacity-40 font-serif italic py-1">
            暂无典型实例或反例说明。
          </div>
        )}
      </div>

      {/* Prerequisites (Clickable to switch reading node) */}
      {prereqNodes.length > 0 && (
        <div className="border-t border-inherit pt-4">
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-60 font-serif mb-2 flex items-center justify-between">
            <span>前置依赖前提 ({prereqNodes.length})</span>
            <span className="text-[10px] opacity-40 font-mono">点击直接阅读对应命题</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {prereqNodes.map(prereq => {
              const pType = NODE_TYPES[prereq.type] || NODE_TYPES.theorem;
              return (
                <button
                  key={prereq.id}
                  type="button"
                  onClick={() => onNavigateToNode(prereq.id)}
                  className={`p-2.5 border text-left flex items-center justify-between group transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#121214] hover:bg-[#202024] border-[#2E2E33] hover:border-blue-500'
                      : 'bg-white hover:bg-[#F2EFE9] border-[#D4CDC0] hover:border-blue-600'
                  }`}
                  title={`跳转至前置命题：${prereq.title}`}
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span
                      className="w-1.5 h-1.5 shrink-0"
                      style={{ backgroundColor: isDark ? pType.darkBorderColor : pType.borderColor }}
                    />
                    <div
                      className="font-serif text-xs font-medium truncate min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap [&_*]:!inline [&_*]:!whitespace-nowrap [&_*]:!m-0 [&_*]:!p-0 [&_.katex-display]:!inline [&_.katex-display]:!m-0"
                      title={latexToUnicode(prereq.title.replace(/[\r\n]+/g, ' · '))}
                    >
                      <MathRenderer content={formatSingleLineFormulaTitle(prereq.title)} />
                    </div>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Downstream Nodes (Clickable to switch reading node) */}
      {downstreamNodes.length > 0 && (
        <div className="border-t border-inherit pt-4">
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-60 font-serif mb-2 flex items-center justify-between">
            <span>下游推论应用 ({downstreamNodes.length})</span>
            <span className="text-[10px] opacity-40 font-mono">点击直接阅读对应命题</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {downstreamNodes.map(down => {
              const dType = NODE_TYPES[down.type] || NODE_TYPES.theorem;
              return (
                <button
                  key={down.id}
                  type="button"
                  onClick={() => onNavigateToNode(down.id)}
                  className={`p-2.5 border text-left flex items-center justify-between group transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#121214] hover:bg-[#202024] border-[#2E2E33] hover:border-blue-500'
                      : 'bg-white hover:bg-[#F2EFE9] border-[#D4CDC0] hover:border-blue-600'
                  }`}
                  title={`跳转至下游推论：${down.title}`}
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span
                      className="w-1.5 h-1.5 shrink-0"
                      style={{ backgroundColor: isDark ? dType.darkBorderColor : dType.borderColor }}
                    />
                    <div
                      className="font-serif text-xs font-medium truncate min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap [&_*]:!inline [&_*]:!whitespace-nowrap [&_*]:!m-0 [&_*]:!p-0 [&_.katex-display]:!inline [&_.katex-display]:!m-0"
                      title={latexToUnicode(down.title.replace(/[\r\n]+/g, ' · '))}
                    >
                      <MathRenderer content={formatSingleLineFormulaTitle(down.title)} />
                    </div>
                  </div>
                  <ArrowDownRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal Note */}
      <div className="border-t border-inherit pt-4">
        <div className="text-[11px] uppercase tracking-wider font-semibold opacity-60 font-serif mb-2 flex items-center justify-between">
          <span>个人研读批注 (Personal Note)</span>
          {!formData.note && (
            <button
              type="button"
              onClick={() => onSwitchToEdit('note')}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              + 添加批注
            </button>
          )}
        </div>
        {formData.note ? (
          <div
            className={`p-3.5 border font-serif text-xs leading-relaxed ${
              isDark
                ? 'bg-amber-500/5 border-amber-500/20 text-amber-200/90'
                : 'bg-amber-50/70 border-amber-200/70 text-amber-950'
            }`}
          >
            <MathRenderer content={formData.note} />
          </div>
        ) : (
          <div className="text-xs opacity-40 font-serif italic py-1">
            暂无个人心得批注。
          </div>
        )}
      </div>
    </div>
  );
};
