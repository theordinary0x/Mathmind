import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Link, ArrowRight, Edit3, Check, X } from 'lucide-react';
import { PropositionNode, PropositionType, NODE_TYPES } from '../../types';
import { ExtractedProposition } from '../../types/ai';
import { MathRenderer } from '../MathRenderer';

interface ExtractedNodeCardProps {
  item: ExtractedProposition;
  isSelected: boolean;
  onToggleSelect: (tempId: string) => void;
  onUpdateItem: (updated: ExtractedProposition) => void;
  existingNodeMap: Map<string, PropositionNode>;
  allExtractedNodes: ExtractedProposition[];
  isDark: boolean;
}

export const ExtractedNodeCard: React.FC<ExtractedNodeCardProps> = ({
  item,
  isSelected,
  onToggleSelect,
  onUpdateItem,
  existingNodeMap,
  allExtractedNodes,
  isDark
}) => {
  const [isProofExpanded, setIsProofExpanded] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // Local edit state
  const [editTitle, setEditTitle] = useState(item.title);
  const [editType, setEditType] = useState<PropositionType>(item.type);
  const [editStatement, setEditStatement] = useState(item.statement);
  const [editProofSketch, setEditProofSketch] = useState(item.proof_sketch);
  const [editFullProof, setEditFullProof] = useState(item.full_proof);

  const typeMeta = NODE_TYPES[item.type] || { label: item.type, color: 'bg-zinc-500' };

  const handleStartEdit = () => {
    setEditTitle(item.title);
    setEditType(item.type);
    setEditStatement(item.statement);
    setEditProofSketch(item.proof_sketch);
    setEditFullProof(item.full_proof);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const updated: ExtractedProposition = {
      ...item,
      title: editTitle.trim() || item.title,
      type: editType,
      statement: editStatement,
      proof_sketch: editProofSketch,
      full_proof: editFullProof
    };
    onUpdateItem(updated);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div
      className={`p-3.5 border text-xs transition-all ${
        isSelected
          ? isDark
            ? 'bg-blue-950/20 border-blue-500/60 shadow-xs'
            : 'bg-blue-50/70 border-blue-500/70 shadow-xs'
          : isDark
            ? 'bg-[#18181B] border-[#2E2E33] hover:border-[#3F3F46]'
            : 'bg-white border-[#D4CDC0] hover:border-[#B8B0A2]'
      }`}
    >
      {/* Header: Select Checkbox, Type Badge, Title, and Action Buttons */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start space-x-2.5 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.tempId)}
            className="w-4 h-4 accent-blue-600 cursor-pointer shrink-0 mt-0.5"
          />
          <span className={`px-2 py-0.5 text-[10px] text-white font-medium shrink-0 ${typeMeta.color}`}>
            {typeMeta.label}
          </span>
          {!isEditing ? (
            <h4 className="font-serif font-bold text-sm leading-snug break-words min-w-0 flex-1">
              <MathRenderer content={item.title} />
            </h4>
          ) : (
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="命题标题（支持 LaTeX）"
                  className={`flex-1 px-2 py-1 text-xs font-serif font-bold border focus:outline-none ${
                    isDark ? 'bg-[#121214] border-[#2E2E33] text-white' : 'bg-white border-[#D4CDC0] text-stone-900'
                  }`}
                />
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value as PropositionType)}
                  className={`px-2 py-1 text-xs border focus:outline-none ${
                    isDark ? 'bg-[#121214] border-[#2E2E33] text-white' : 'bg-white border-[#D4CDC0] text-stone-900'
                  }`}
                >
                  <option value="axiom">公理</option>
                  <option value="definition">定义</option>
                  <option value="proposition">命题</option>
                  <option value="theorem">定理</option>
                  <option value="corollary">推论</option>
                  <option value="remark">注记</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 shrink-0">
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className={`flex items-center space-x-1 px-2 py-1 text-[11px] font-medium border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#2E2E33] hover:border-blue-500 text-zinc-300 hover:text-white bg-[#202024]'
                  : 'border-[#D4CDC0] hover:border-blue-600 text-stone-700 hover:text-blue-600 bg-stone-50'
              }`}
              title="在卡片内直接修改本命题"
            >
              <Edit3 className="w-3 h-3" />
              <span>修改</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors cursor-pointer shadow-xs"
                title="保存就地修改"
              >
                <Check className="w-3 h-3" />
                <span>保存</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className={`p-1 border transition-colors cursor-pointer ${
                  isDark ? 'border-[#2E2E33] hover:bg-white/5 text-zinc-400' : 'border-[#D4CDC0] hover:bg-black/5 text-stone-600'
                }`}
                title="取消修改"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="mt-2.5 pl-6.5 space-y-2.5">
        {/* Section 1: 命题陈述 (Statement) */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold mb-1 block">
            【命题陈述】
          </span>
          {!isEditing ? (
            <div className={`p-2.5 font-serif leading-relaxed text-xs overflow-x-auto break-words border ${
              isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-[#FAF8F5] border-[#D4CDC0]'
            }`}>
              <MathRenderer content={item.statement} />
            </div>
          ) : (
            <div className="space-y-1">
              <textarea
                value={editStatement}
                onChange={e => setEditStatement(e.target.value)}
                rows={3}
                placeholder="命题陈述（支持 LaTeX）"
                className={`w-full p-2 text-xs font-serif border focus:outline-none leading-relaxed resize-none ${
                  isDark ? 'bg-[#121214] border-[#2E2E33] text-white' : 'bg-white border-[#D4CDC0] text-stone-900'
                }`}
              />
              <div className={`p-2 text-xs font-serif border ${isDark ? 'bg-[#18181B] border-[#2E2E33]' : 'bg-[#FAF8F5] border-[#D4CDC0]'}`}>
                <span className="text-[10px] opacity-50 block mb-0.5">实时预览:</span>
                <MathRenderer content={editStatement || '（空）'} />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: 证明思路 (Proof Sketch) */}
        {(!isEditing && item.proof_sketch) || isEditing ? (
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold mb-1 block">
              【证明思路】
            </span>
            {!isEditing ? (
              <div className="p-2 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-[11px] font-serif leading-relaxed opacity-90 overflow-x-auto break-words">
                <MathRenderer content={item.proof_sketch} />
              </div>
            ) : (
              <textarea
                value={editProofSketch}
                onChange={e => setEditProofSketch(e.target.value)}
                rows={2}
                placeholder="简述证明思路..."
                className={`w-full p-2 text-xs font-serif border focus:outline-none resize-none ${
                  isDark ? 'bg-[#121214] border-[#2E2E33] text-white' : 'bg-white border-[#D4CDC0] text-stone-900'
                }`}
              />
            )}
          </div>
        ) : null}

        {/* Section 3: 命题严格证明 (Full Proof) */}
        {(!isEditing && item.full_proof) || isEditing ? (
          <div>
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsProofExpanded(!isProofExpanded)}
                  className="flex items-center space-x-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline py-0.5 select-none cursor-pointer"
                >
                  {isProofExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>【严格证明】{isProofExpanded ? '收起推导' : '点击展开分步推导'}</span>
                </button>

                {isProofExpanded && (
                  <div className="mt-1.5 p-2.5 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 text-xs font-serif leading-relaxed overflow-x-auto break-words whitespace-pre-wrap animate-in fade-in duration-150">
                    <MathRenderer content={item.full_proof || ''} />
                  </div>
                )}
              </>
            ) : (
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold mb-1 block">
                  【严格分步证明】
                </span>
                <textarea
                  value={editFullProof}
                  onChange={e => setEditFullProof(e.target.value)}
                  rows={4}
                  placeholder="严格分步推导与证明细节..."
                  className={`w-full p-2 text-xs font-serif border focus:outline-none resize-none ${
                    isDark ? 'bg-[#121214] border-[#2E2E33] text-white' : 'bg-white border-[#D4CDC0] text-stone-900'
                  }`}
                />
              </div>
            )}
          </div>
        ) : null}

        {/* Section 4: 前置依赖拓扑 (Dependencies) */}
        {(item.depends_on_existing_ids.length > 0 || item.depends_on_new_temp_ids.length > 0) && (
          <div className="pt-2 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="opacity-60 flex items-center font-medium">
              <Link className="w-3 h-3 mr-1" /> 前置依赖:
            </span>
            {/* Existing canvas nodes */}
            {item.depends_on_existing_ids.map(id => {
              const existing = existingNodeMap.get(id);
              return (
                <span
                  key={id}
                  className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono flex items-center border border-emerald-500/20"
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
                  className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono flex items-center border border-blue-500/20"
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
