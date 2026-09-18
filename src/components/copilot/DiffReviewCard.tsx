import React, { useState } from 'react';
import { DiffProposalState, GraphMutationDiff } from '../../types/copilot';
import { NODE_TYPES, PropositionNode } from '../../types';
import { MathRenderer } from '../MathRenderer';
import { DiffProposalEditorModal, EditableProposalItem } from './DiffProposalEditorModal';
import { 
  Check, 
  Plus, 
  RefreshCw, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  Edit3 
} from 'lucide-react';

interface DiffReviewCardProps {
  proposal: DiffProposalState;
  onApply: (selectedActionIds?: Set<string>) => void;
  onNavigateToNode?: (nodeId: string) => void;
  onUpdateDiff?: (updatedDiff: GraphMutationDiff) => void;
  allNodes?: PropositionNode[];
  isDark: boolean;
}

export const DiffReviewCard: React.FC<DiffReviewCardProps> = ({
  proposal,
  onApply,
  onNavigateToNode,
  onUpdateDiff,
  allNodes = [],
  isDark
}) => {
  const diff = proposal.diff;

  // 收集所有可操作 item 的 ID
  const allActionIds: string[] = [];
  if (diff.add_nodes) {
    diff.add_nodes.forEach(n => allActionIds.push(`add_${n.id}`));
  }
  if (diff.update_nodes) {
    diff.update_nodes.forEach(n => allActionIds.push(`upd_${n.id}`));
  }
  if (diff.delete_nodes) {
    diff.delete_nodes.forEach(n => allActionIds.push(`del_${n.id}`));
  }
  if (diff.rewire_edges) {
    diff.rewire_edges.forEach(e => allActionIds.push(`edge_${e.from}_${e.to}_${e.action}`));
  }

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(allActionIds));
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [expandedProofIds, setExpandedProofIds] = useState<Set<string>>(new Set());
  const [editingProposalItem, setEditingProposalItem] = useState<EditableProposalItem | null>(null);

  const toggleAction = (id: string) => {
    if (proposal.applied) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleProof = (id: string) => {
    setExpandedProofIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (proposal.applied) return;
    if (selectedIds.size === allActionIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allActionIds));
    }
  };

  const handleApplyClick = () => {
    onApply(selectedIds);
  };

  const handleSaveEditedItem = (updatedItem: EditableProposalItem) => {
    let updatedDiff: GraphMutationDiff = { ...diff };
    if (updatedItem.kind === 'add') {
      updatedDiff = {
        ...updatedDiff,
        add_nodes: (diff.add_nodes || []).map(n =>
          n.id === updatedItem.node.id ? updatedItem.node : n
        )
      };
    } else {
      updatedDiff = {
        ...updatedDiff,
        update_nodes: (diff.update_nodes || []).map(n =>
          n.id === updatedItem.node.id ? updatedItem.node : n
        )
      };
    }
    onUpdateDiff?.(updatedDiff);
  };

  const totalActionsCount = allActionIds.length;
  if (totalActionsCount === 0) return null;

  return (
    <div
      className={`my-2.5 rounded-xl border text-xs overflow-hidden transition-all shadow-sm ${
        isDark
          ? 'bg-[#1F1F23] border-[#333338] text-zinc-200'
          : 'bg-stone-50 border-stone-200 text-stone-800'
      }`}
    >
      {/* 头部摘要栏 */}
      <div
        className={`px-3.5 py-2.5 flex items-center justify-between border-b cursor-pointer select-none ${
          isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-black/5'
        }`}
        onClick={() => setIsDetailsExpanded(prev => !prev)}
      >
        <div className="flex items-center space-x-2">
          {isDetailsExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          )}
          <span className="font-semibold font-serif text-xs">
            📦 图谱变更建议 ({totalActionsCount} 项操作)
          </span>
          {proposal.applied && (
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              <span>已生效至画布</span>
            </span>
          )}
        </div>
        <span className="text-[11px] opacity-60 font-serif truncate max-w-[180px]">
          {diff.summary || (proposal.applied ? '已应用' : '待审查')}
        </span>
      </div>

      {/* 展开的变更明细列表 */}
      {isDetailsExpanded && (
        <div className="p-3 space-y-3.5">
          {/* 全选操作栏 */}
          {!proposal.applied && (
            <div className="flex items-center justify-between pb-2 border-b border-inherit">
              <label className="flex items-center space-x-2 cursor-pointer opacity-80 hover:opacity-100">
                <input
                  type="checkbox"
                  checked={selectedIds.size === allActionIds.length && allActionIds.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-400 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-[11px] font-sans">
                  全选 / 反选 ({selectedIds.size}/{totalActionsCount})
                </span>
              </label>
              <span className="text-[10px] opacity-50 font-sans">
                支持点击「微调」直接修改公式与证明
              </span>
            </div>
          )}

          {/* 1. 删除节点 */}
          {diff.delete_nodes && diff.delete_nodes.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-rose-500 flex items-center space-x-1">
                <Trash2 className="w-3 h-3" />
                <span>移除冗余命题 ({diff.delete_nodes.length})</span>
              </div>
              {diff.delete_nodes.map(item => {
                const actionId = `del_${item.id}`;
                const isChecked = selectedIds.has(actionId);
                return (
                  <label
                    key={actionId}
                    className={`flex items-start space-x-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                      isChecked
                        ? isDark ? 'bg-rose-950/20 border-rose-800/40' : 'bg-rose-50 border-rose-200'
                        : 'border-transparent opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={proposal.applied}
                      onChange={() => toggleAction(actionId)}
                      className="mt-0.5 rounded border-gray-400 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-serif font-medium line-through text-rose-400">
                          {item.title}
                        </span>
                        {onNavigateToNode && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onNavigateToNode(item.id); }}
                            className="opacity-50 hover:opacity-100 p-0.5 cursor-pointer"
                            title="在画布中定位"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-[11px] opacity-70 mt-0.5">理由: {item.reason}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* 2. 修改命题 (支持富卡片与微调) */}
          {diff.update_nodes && diff.update_nodes.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500 flex items-center space-x-1">
                <RefreshCw className="w-3 h-3" />
                <span>重构优化命题 ({diff.update_nodes.length})</span>
              </div>
              {diff.update_nodes.map(item => {
                const actionId = `upd_${item.id}`;
                const isChecked = selectedIds.has(actionId);
                const isProofExpanded = expandedProofIds.has(item.id);
                const typeCfg = item.type ? NODE_TYPES[item.type] : undefined;

                return (
                  <div
                    key={actionId}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isChecked
                        ? isDark
                          ? 'bg-amber-950/20 border-amber-700/50 shadow-xs'
                          : 'bg-amber-50/80 border-amber-300 shadow-xs'
                        : 'border-inherit opacity-60'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-2">
                      <label className="flex items-start space-x-2 min-w-0 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={proposal.applied}
                          onChange={() => toggleAction(actionId)}
                          className="mt-0.5 rounded border-gray-400 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 shrink-0 cursor-pointer"
                        />
                        {typeCfg && (
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-semibold shrink-0"
                            style={{
                              backgroundColor: isDark ? typeCfg.darkBgColor : typeCfg.bgColor,
                              color: isDark ? typeCfg.darkColor : typeCfg.color,
                              border: `1px solid ${isDark ? typeCfg.darkBorderColor : typeCfg.borderColor}`
                            }}
                          >
                            {typeCfg.label}
                          </span>
                        )}
                        <h4 className="font-serif font-bold text-xs text-amber-500 dark:text-amber-300 leading-snug break-words flex-1">
                          {item.title || `命题 [${item.id}]`}
                        </h4>
                      </label>

                      <div className="flex items-center space-x-1 shrink-0">
                        {onNavigateToNode && (
                          <button
                            type="button"
                            onClick={() => onNavigateToNode(item.id)}
                            className="opacity-50 hover:opacity-100 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            title="在画布中定位"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!proposal.applied && (
                          <button
                            type="button"
                            onClick={() => setEditingProposalItem({ kind: 'update', node: item })}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-sans font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/30 transition-colors cursor-pointer"
                            title="微调优化内容或公式"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>微调</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Change Summary */}
                    {item.change_summary && (
                      <div className="mt-1.5 ml-6 text-[11px] opacity-80 font-sans text-amber-600 dark:text-amber-300">
                        💡 {item.change_summary}
                      </div>
                    )}

                    {/* Statement Preview with MathRenderer */}
                    <div className="mt-2 ml-6 space-y-1.5">
                      {item.statement && (
                        <div>
                          <div className="text-[9px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold mb-0.5">
                            【优化陈述】
                          </div>
                          <div className="p-2 rounded-lg bg-black/5 dark:bg-black/30 font-serif leading-relaxed text-xs overflow-x-auto break-words border border-black/5 dark:border-white/5">
                            <MathRenderer content={item.statement} />
                          </div>
                        </div>
                      )}

                      {/* Proof Sketch Preview */}
                      {item.proof_sketch && (
                        <div>
                          <div className="text-[9px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold mb-0.5">
                            【优化思路】
                          </div>
                          <div className="p-1.5 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 text-[11px] font-serif leading-relaxed opacity-90 overflow-x-auto break-words">
                            <MathRenderer content={item.proof_sketch} />
                          </div>
                        </div>
                      )}

                      {/* Full Proof Collapsible */}
                      {item.full_proof && (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleProof(item.id)}
                            className="flex items-center space-x-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline select-none cursor-pointer"
                          >
                            {isProofExpanded ? (
                              <ChevronDown className="w-3 h-3 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 shrink-0" />
                            )}
                            <span>【严格证明】{isProofExpanded ? '收起推导' : '点击展开分步证明'}</span>
                          </button>
                          {isProofExpanded && (
                            <div className="mt-1 p-2 rounded-lg bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 text-xs font-serif leading-relaxed overflow-x-auto break-words animate-in fade-in duration-150">
                              <MathRenderer content={item.full_proof} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. 连线调整 */}
          {diff.rewire_edges && diff.rewire_edges.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-500 flex items-center space-x-1">
                <ArrowRight className="w-3 h-3" />
                <span>推导连线调整 ({diff.rewire_edges.length})</span>
              </div>
              {diff.rewire_edges.map(item => {
                const actionId = `edge_${item.from}_${item.to}_${item.action}`;
                const isChecked = selectedIds.has(actionId);
                const isAdd = item.action === 'add';
                return (
                  <label
                    key={actionId}
                    className={`flex items-start space-x-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                      isChecked
                        ? isDark ? 'bg-blue-950/20 border-blue-800/40' : 'bg-blue-50 border-blue-200'
                        : 'border-transparent opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={proposal.applied}
                      onChange={() => toggleAction(actionId)}
                      className="mt-0.5 rounded border-gray-400 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                        <span className={isAdd ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                          {isAdd ? '+ 建立推导依赖' : '- 解除推导依赖'}:
                        </span>
                        <span className="truncate">{item.from}</span>
                        <ArrowRight className="w-3 h-3 opacity-50 shrink-0" />
                        <span className="truncate">{item.to}</span>
                      </div>
                      {item.reason && (
                        <div className="text-[10px] opacity-70 mt-0.5 font-serif">{item.reason}</div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* 4. 新增命题 (对齐原版富卡片预览与微调) */}
          {diff.add_nodes && diff.add_nodes.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 flex items-center space-x-1">
                <Plus className="w-3 h-3" />
                <span>新增录入命题 ({diff.add_nodes.length})</span>
              </div>
              {diff.add_nodes.map(item => {
                const actionId = `add_${item.id}`;
                const isChecked = selectedIds.has(actionId);
                const typeCfg = NODE_TYPES[item.type] || NODE_TYPES.theorem;
                const isProofExpanded = expandedProofIds.has(item.id);

                return (
                  <div
                    key={actionId}
                    className={`p-3 rounded-xl border transition-all ${
                      isChecked
                        ? isDark
                          ? 'bg-emerald-950/20 border-emerald-700/50 shadow-xs'
                          : 'bg-emerald-50/80 border-emerald-400/80 shadow-xs'
                        : 'border-inherit opacity-60'
                    }`}
                  >
                    {/* Top Row: Checkbox, Badge, Title, Fine-tune button */}
                    <div className="flex items-start justify-between gap-2">
                      <label className="flex items-start space-x-2.5 min-w-0 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={proposal.applied}
                          onChange={() => toggleAction(actionId)}
                          className="mt-0.5 rounded border-gray-400 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 shrink-0 cursor-pointer"
                        />
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold shrink-0"
                          style={{
                            backgroundColor: isDark ? typeCfg.darkBgColor : typeCfg.bgColor,
                            color: isDark ? typeCfg.darkColor : typeCfg.color,
                            border: `1px solid ${isDark ? typeCfg.darkBorderColor : typeCfg.borderColor}`
                          }}
                        >
                          {typeCfg.label}
                        </span>
                        <h4 className="font-serif font-bold text-xs leading-snug break-words flex-1 text-emerald-600 dark:text-emerald-400">
                          {item.title}
                        </h4>
                      </label>

                      {!proposal.applied && (
                        <button
                          type="button"
                          onClick={() => setEditingProposalItem({ kind: 'add', node: item })}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-sans font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/30 transition-colors shrink-0 cursor-pointer"
                          title="微调命题公式、证明或依赖"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>微调</span>
                        </button>
                      )}
                    </div>

                    {/* Statement Preview with MathRenderer */}
                    <div className="mt-2 pl-6 space-y-2">
                      {item.statement && (
                        <div>
                          <div className="text-[9px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold mb-0.5">
                            【命题陈述】
                          </div>
                          <div className="p-2 rounded-lg bg-black/5 dark:bg-black/30 font-serif leading-relaxed text-xs overflow-x-auto break-words border border-black/5 dark:border-white/5">
                            <MathRenderer content={item.statement} />
                          </div>
                        </div>
                      )}

                      {/* Proof Sketch */}
                      {item.proof_sketch && (
                        <div>
                          <div className="text-[9px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold mb-0.5">
                            【证明思路】
                          </div>
                          <div className="p-1.5 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 text-[11px] font-serif leading-relaxed opacity-90 overflow-x-auto break-words">
                            <MathRenderer content={item.proof_sketch} />
                          </div>
                        </div>
                      )}

                      {/* Full Proof Collapsible */}
                      {item.full_proof && (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleProof(item.id)}
                            className="flex items-center space-x-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline select-none cursor-pointer"
                          >
                            {isProofExpanded ? (
                              <ChevronDown className="w-3 h-3 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 shrink-0" />
                            )}
                            <span>【严格证明】{isProofExpanded ? '收起推导' : '点击展开分步推导'}</span>
                          </button>
                          {isProofExpanded && (
                            <div className="mt-1 p-2 rounded-lg bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 text-xs font-serif leading-relaxed overflow-x-auto break-words animate-in fade-in duration-150">
                              <MathRenderer content={item.full_proof} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dependencies */}
                      {item.depends_on && item.depends_on.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1 pt-1">
                          <span className="text-[10px] opacity-60 font-mono">前置依赖:</span>
                          {item.depends_on.map(depId => (
                            <span
                              key={depId}
                              className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20"
                            >
                              &larr; {depId}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 底部应用按钮 */}
          <div className="pt-2.5 border-t border-inherit flex items-center justify-between">
            <span className="text-[11px] opacity-60 font-serif">
              {proposal.applied ? '改动已加入撤销栈 (Ctrl+Z 可恢复)' : `已勾选 ${selectedIds.size} 项变更`}
            </span>
            <button
              onClick={handleApplyClick}
              disabled={proposal.applied || selectedIds.size === 0}
              className={`px-3.5 py-1.5 rounded-lg font-serif font-medium transition-all shadow-sm ${
                proposal.applied
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 cursor-default'
                  : selectedIds.size > 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95'
                  : 'bg-zinc-700/50 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {proposal.applied ? '✓ 已应用至画布' : `一键应用选中变更 (${selectedIds.size})`}
            </button>
          </div>
        </div>
      )}

      {/* 微调编辑弹窗 */}
      <DiffProposalEditorModal
        isOpen={!!editingProposalItem}
        item={editingProposalItem}
        allNodes={allNodes}
        onSave={handleSaveEditedItem}
        onClose={() => setEditingProposalItem(null)}
        isDark={isDark}
      />
    </div>
  );
};
