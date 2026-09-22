import React from 'react';
import { Trash2, Plus, ChevronDown, ChevronRight, Sparkles, ArrowDownRight } from 'lucide-react';
import { PropositionNode } from '../../types';
import { latexToUnicode, formatSingleLineFormulaTitle } from '../../utils/latexToUnicode';
import { MathRenderer } from '../MathRenderer';
import { FieldLatexPreview } from './FieldLatexPreview';
import { PrerequisitePicker } from './PrerequisitePicker';

interface NodeEditViewProps {
  formData: PropositionNode;
  setFormData: React.Dispatch<React.SetStateAction<PropositionNode | null>>;
  isDark: boolean;
  errorMessage: string | null;
  activeField: string;
  setActiveField: (field: string) => void;
  recordCursor: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement> | React.SyntheticEvent) => void;
  allNodes: PropositionNode[];
  downstreamNodes: PropositionNode[];
  onNavigateToNode: (id: string) => void;
  onTogglePrereq: (id: string) => void;
  isFullProofExpanded: boolean;
  onToggleFullProof: () => void;
  onTriggerCopilot?: (prompt: string) => void;
}

export const NodeEditView: React.FC<NodeEditViewProps> = ({
  formData,
  setFormData,
  isDark,
  errorMessage,
  activeField: _activeField,
  setActiveField,
  recordCursor,
  allNodes,
  downstreamNodes,
  onNavigateToNode,
  onTogglePrereq,
  isFullProofExpanded,
  onToggleFullProof,
  onTriggerCopilot
}) => {
  // Multi-Example Handlers
  const handleAddExample = () => {
    const currentExamples = formData.examples || [];
    const updatedExamples = [...currentExamples, ''];
    setFormData({
      ...formData,
      examples: updatedExamples
    });
    setActiveField(`example_${updatedExamples.length - 1}`);
  };

  const handleUpdateExample = (index: number, value: string) => {
    const currentExamples = [...(formData.examples || [])];
    currentExamples[index] = value;
    setFormData({
      ...formData,
      examples: currentExamples
    });
  };

  const handleRemoveExample = (index: number) => {
    const currentExamples = formData.examples || [];
    const updatedExamples = currentExamples.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      examples: updatedExamples.length > 0 ? updatedExamples : undefined
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {errorMessage && (
        <div className="p-2.5 text-xs bg-red-500/10 border border-red-500/30 text-red-500 font-serif">
          {errorMessage}
        </div>
      )}

      {/* Title Input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-semibold opacity-70 font-serif">
            命题标题 <span className="text-red-500">*</span>
          </label>
          <span className="text-[10px] opacity-40 font-mono">Enter 或 \\ 换行 · 支持 LaTeX</span>
        </div>
        <textarea
          value={formData.title}
          rows={Math.min(3, Math.max(1, (formData.title.match(/\n/g) || []).length + 1))}
          onFocus={e => {
            setActiveField('title');
            recordCursor(e);
          }}
          onClick={recordCursor}
          onKeyUp={recordCursor}
          onSelect={recordCursor}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          placeholder="如: T5: 加法消去律 ($a+c=b+c \implies a=b$)"
          className={`w-full text-sm font-serif font-bold p-2.5 border focus:outline-none resize-none leading-relaxed ${
            isDark
              ? 'bg-[#121214] border-[#2E2E33] text-white'
              : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
          }`}
        />
        <FieldLatexPreview
          label="标题渲染预览"
          content={formData.title}
          isDark={isDark}
          className="font-serif font-bold"
        />
      </div>

      {/* Tags Configuration */}
      <div>
        <div className="text-[11px] font-semibold opacity-70 mb-1 font-serif">
          自由标签 (Tags，用逗号或空格分隔)
        </div>
        <input
          type="text"
          value={(formData.tags || []).join(', ')}
          onChange={e => {
            const raw = e.target.value;
            const parsed = raw.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean);
            setFormData({ ...formData, tags: parsed });
          }}
          placeholder="如: 反例, 期末考点, 拓扑闭包"
          className={`w-full text-xs p-2.5 border font-mono focus:outline-none ${
            isDark
              ? 'bg-[#121214] border-[#2E2E33] text-white placeholder-zinc-500'
              : 'bg-white border-[#D4CDC0] text-[#2C2B29] placeholder-stone-400'
          }`}
        />
      </div>

      {/* Statement Input */}
      <div>
        <div className="text-[11px] font-semibold opacity-70 mb-1 font-serif">
          命题陈述 (Statement)
        </div>
        <textarea
          value={formData.statement}
          onFocus={e => {
            setActiveField('statement');
            recordCursor(e);
          }}
          onClick={recordCursor}
          onKeyUp={recordCursor}
          onSelect={recordCursor}
          onChange={e => setFormData({ ...formData, statement: e.target.value })}
          rows={3}
          placeholder="支持 LaTeX 语法，如 $x \in \mathbb{N}$ 或 $$a+b=b+a$$"
          className={`w-full p-2.5 text-xs font-serif border focus:outline-none leading-relaxed resize-none ${
            isDark
              ? 'bg-[#121214] border-[#2E2E33] text-white'
              : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
          }`}
        />
        <FieldLatexPreview
          label="陈述渲染预览"
          content={formData.statement}
          isDark={isDark}
          className="font-serif"
        />
      </div>

      {/* Proof Sketch Input */}
      <div>
        <div className="text-[11px] font-semibold opacity-70 mb-1 font-serif">
          证明思路概括 (Proof Sketch)
        </div>
        <textarea
          value={formData.proof_sketch}
          onFocus={e => {
            setActiveField('proof_sketch');
            recordCursor(e);
          }}
          onClick={recordCursor}
          onKeyUp={recordCursor}
          onSelect={recordCursor}
          onChange={e => setFormData({ ...formData, proof_sketch: e.target.value })}
          rows={2}
          placeholder="一两句话概述推导核心思路..."
          className={`w-full p-2.5 text-xs border focus:outline-none resize-none ${
            isDark
              ? 'bg-[#121214] border-[#2E2E33] text-white'
              : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
          }`}
        />
        <FieldLatexPreview
          label="思路渲染预览"
          content={formData.proof_sketch}
          isDark={isDark}
          className="font-serif italic"
        />
      </div>

      {/* Full Proof Input (Collapsible) */}
      <div className="border-t border-inherit pt-3">
        <div className="flex items-center justify-between mb-1">
          <button
            type="button"
            onClick={onToggleFullProof}
            className="flex items-center space-x-1 text-xs font-semibold font-serif text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            {isFullProofExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>完整严格证明 (Full Proof)</span>
            {formData.full_proof && <span className="text-[10px] opacity-60 font-mono">({formData.full_proof.length} 字符)</span>}
          </button>

          {onTriggerCopilot && !formData.full_proof && (
            <button
              type="button"
              onClick={() => onTriggerCopilot(`请为命题【${formData.title}】补充完整严谨的分步数学推导证明，并更新其完整证明。`)}
              className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-serif border transition-all cursor-pointer ${
                isDark
                  ? 'border-[#E07A5F]/40 bg-[#E07A5F]/10 hover:bg-[#E07A5F]/20 text-[#F28482]'
                  : 'border-[#E07A5F]/40 bg-[#FFF5F2] hover:bg-[#FFEAE5] text-[#C45D40]'
              }`}
              title="唤起 Copilot 为该命题生成完整数学证明"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI 补充证明</span>
            </button>
          )}
        </div>

        {isFullProofExpanded && (
          <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
            <textarea
              value={formData.full_proof || ''}
              onFocus={e => {
                setActiveField('full_proof');
                recordCursor(e);
              }}
              onClick={recordCursor}
              onKeyUp={recordCursor}
              onSelect={recordCursor}
              onChange={e => setFormData({ ...formData, full_proof: e.target.value })}
              rows={5}
              placeholder="严格分步推导与证明细节..."
              className={`w-full p-2.5 text-xs font-serif border focus:outline-none resize-none leading-relaxed ${
                isDark
                  ? 'bg-[#121214] border-[#2E2E33] text-white'
                  : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
              }`}
            />
            <FieldLatexPreview
              label="证明渲染预览"
              content={formData.full_proof || ''}
              isDark={isDark}
            />
          </div>
        )}
      </div>

      {/* Multi-Example Dynamic Editor (典型实例 / 算例) */}
      <div className="border-t border-inherit pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold opacity-70 font-serif">
              典型实例 / 算例 (Examples)
            </span>
            {formData.examples && formData.examples.length > 0 && (
              <span className="text-[10px] font-mono opacity-50">
                ({formData.examples.length})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddExample}
            className={`inline-flex items-center space-x-1 px-2 py-0.5 text-xs border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#2E2E33] hover:border-blue-500 bg-[#121214] text-zinc-300 hover:text-white'
                : 'border-[#D4CDC0] hover:border-blue-600 bg-white text-stone-700 hover:text-blue-600'
            }`}
          >
            <Plus className="w-3 h-3" />
            <span>添加实例</span>
          </button>
        </div>

        {formData.examples && formData.examples.length > 0 ? (
          <div className="space-y-3">
            {formData.examples.map((ex, idx) => (
              <div
                key={idx}
                className={`p-3 border space-y-2 ${
                  isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-white border-[#D4CDC0]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold opacity-70">
                    例 {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExample(idx)}
                    className="p-1 text-red-500/70 hover:text-red-500 transition-colors cursor-pointer"
                    title="删除此实例"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={ex}
                  rows={2}
                  onFocus={e => {
                    setActiveField(`example_${idx}`);
                    recordCursor(e);
                  }}
                  onClick={recordCursor}
                  onKeyUp={recordCursor}
                  onSelect={recordCursor}
                  onChange={e => handleUpdateExample(idx, e.target.value)}
                  placeholder="输入具体算例、应用示范或特例反例，支持 LaTeX..."
                  className={`w-full p-2 text-xs font-serif border focus:outline-none resize-none leading-relaxed ${
                    isDark
                      ? 'bg-[#18181B] border-[#2E2E33] text-white'
                      : 'bg-[#FAF8F5] border-[#D4CDC0] text-[#2C2B29]'
                  }`}
                />
                <FieldLatexPreview
                  label={`例 ${idx + 1} 渲染预览`}
                  content={ex}
                  isDark={isDark}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs opacity-40 font-serif italic py-1">
            暂无实例。可点击右上角「添加实例」补充具体算例、应用范例或特例反例。
          </div>
        )}
      </div>

      {/* Prerequisites Picker */}
      <PrerequisitePicker
        allNodes={allNodes}
        currentNodeId={formData.id}
        selectedPrereqIds={formData.depends_on}
        onTogglePrereq={onTogglePrereq}
        isDark={isDark}
      />

      {/* Downstream Nodes */}
      {downstreamNodes.length > 0 && (
        <div className="border-t border-inherit pt-3">
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-60 font-serif mb-2">
            下游推论应用 ({downstreamNodes.length})
          </div>
          <div className="space-y-1">
            {downstreamNodes.map(down => (
              <button
                key={down.id}
                type="button"
                onClick={() => onNavigateToNode(down.id)}
                className={`w-full text-left p-2 border flex items-center justify-between text-xs group transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#121214] hover:bg-[#202024] border-[#2E2E33] hover:border-blue-500'
                    : 'bg-white hover:bg-[#F2EFE9] border-[#D4CDC0] hover:border-blue-600'
                }`}
              >
                <div
                  className="font-serif font-medium truncate min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap [&_*]:!inline [&_*]:!whitespace-nowrap [&_*]:!m-0 [&_*]:!p-0 [&_.katex-display]:!inline [&_.katex-display]:!m-0"
                  title={latexToUnicode(down.title.replace(/[\r\n]+/g, ' · '))}
                >
                  <MathRenderer content={formatSingleLineFormulaTitle(down.title)} />
                </div>
                <ArrowDownRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Personal Note Input */}
      <div className="border-t border-inherit pt-3">
        <div className="text-[11px] font-semibold opacity-70 mb-1 font-serif">
          个人批注 (Personal Note)
        </div>
        <textarea
          value={formData.note || ''}
          onFocus={e => {
            setActiveField('note');
            recordCursor(e);
          }}
          onClick={recordCursor}
          onKeyUp={recordCursor}
          onSelect={recordCursor}
          onChange={e => setFormData({ ...formData, note: e.target.value })}
          rows={2}
          placeholder="添加学习心得、疑问或关联想法..."
          className={`w-full p-2.5 text-xs border focus:outline-none resize-none ${
            isDark
              ? 'bg-[#121214] border-[#2E2E33] text-white'
              : 'bg-white border-[#D4CDC0] text-[#2C2B29]'
          }`}
        />
      </div>
    </div>
  );
};
