import React, { useState } from 'react';
import { DiffProposalState, GraphMutationDiff } from '../../types/copilot';
import { NODE_TYPES } from '../../types';
import { Check, Plus, RefreshCw, Trash2, ArrowRight, CheckCircle2, ChevronDown, ChevronRight, Eye } from 'lucide-react';

interface DiffReviewCardProps {
  proposal: DiffProposalState;
  onApply: (selectedActionIds?: Set<string>) => void;
  onNavigateToNode?: (nodeId: string) => void;
  isDark: boolean;
}

export const DiffReviewCard: React.FC<DiffReviewCardProps> = ({
  proposal,
  onApply,
  onNavigateToNode,
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

  const toggleAction = (id: string) => {
    if (proposal.applied) return;
    setSelectedIds(prev => {
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

  const totalActionsCount = allActionIds.length;
  if (totalActionsCount === 0) return null;

  return (
    <div
      className={`my-2.5 rounded-lg border text-xs overflow-hidden transition-all shadow-sm ${
        isDark
          ? 'bg-[#1F1F23] border-[#333338] text-zinc-200'
          : 'bg-stone-50 border-stone-200 text-stone-800'
      }`}
    >
      {/* 头部摘要栏 */}
      <div
        className={`px-3 py-2 flex items-center justify-between border-b cursor-pointer select-none ${
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
          <span className="font-semibold font-serif">
            📦 图谱变更建议 ({totalActionsCount} 项操作)
          </span>
          {proposal.applied && (
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              <span>已应用</span>
            </span>
          )}
        </div>
        <span className="text-[11px] opacity-60">
          {diff.summary || (proposal.applied ? '已生效至画布' : '待审查')}
        </span>
      </div>

      {/* 展开的变更明细列表 */}
      {isDetailsExpanded && (
        <div className="p-3 space-y-3">
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
                <span className="text-[11px]">全选 / 反选 ({selectedIds.size}/{totalActionsCount})</span>
              </label>
              <span className="text-[10px] opacity-50">点击节点名称可平滑聚焦定位</span>
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
                    className={`flex items-start space-x-2 p-1.5 rounded border transition-colors cursor-pointer ${
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
                      className="mt-0.5 rounded border-gray-400 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="font-serif font-medium line-through text-rose-400">
                          {item.title}
                        </span>
                        {onNavigateToNode && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onNavigateToNode(item.id); }}
                            className="opacity-50 hover:opacity-100 p-0.5"
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

          {/* 2. 修改命题 */}
          {diff.update_nodes && diff.update_nodes.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500 flex items-center space-x-1">
                <RefreshCw className="w-3 h-3" />
                <span>重构优化命题 ({diff.update_nodes.length})</span>
              </div>
              {diff.update_nodes.map(item => {
                const actionId = `upd_${item.id}`;
                const isChecked = selectedIds.has(actionId);
                return (
                  <label
                    key={actionId}
                    className={`flex items-start space-x-2 p-1.5 rounded border transition-colors cursor-pointer ${
                      isChecked
                        ? isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'
                        : 'border-transparent opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={proposal.applied}
                      onChange={() => toggleAction(actionId)}
                      className="mt-0.5 rounded border-gray-400 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="font-serif font-medium text-amber-300 dark:text-amber-200">
                          {item.title || `命题 [${item.id}]`}
                        </span>
                        {onNavigateToNode && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onNavigateToNode(item.id); }}
                            className="opacity-50 hover:opacity-100 p-0.5"
                            title="在画布中定位"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {item.change_summary && (
                        <div className="text-[11px] opacity-70 mt-0.5">{item.change_summary}</div>
                      )}
                      {item.statement && (
                        <div className="text-[10px] font-serif opacity-80 mt-1 line-clamp-2 bg-black/5 dark:bg-white/5 p-1 rounded">
                          {item.statement}
                        </div>
                      )}
                    </div>
                  </label>
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
                    className={`flex items-start space-x-2 p-1.5 rounded border transition-colors cursor-pointer ${
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
                      className="mt-0.5 rounded border-gray-400 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                        <span className={isAdd ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                          {isAdd ? '+ 建立依赖' : '- 解除依赖'}:
                        </span>
                        <span className="truncate">{item.from}</span>
                        <ArrowRight className="w-3 h-3 opacity-50 shrink-0" />
                        <span className="truncate">{item.to}</span>
                      </div>
                      {item.reason && (
                        <div className="text-[10px] opacity-70 mt-0.5">{item.reason}</div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* 4. 新增命题 */}
          {diff.add_nodes && diff.add_nodes.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 flex items-center space-x-1">
                <Plus className="w-3 h-3" />
                <span>新增录入命题 ({diff.add_nodes.length})</span>
              </div>
              {diff.add_nodes.map(item => {
                const actionId = `add_${item.id}`;
                const isChecked = selectedIds.has(actionId);
                const typeCfg = NODE_TYPES[item.type] || NODE_TYPES.theorem;
                return (
                  <label
                    key={actionId}
                    className={`flex items-start space-x-2 p-1.5 rounded border transition-colors cursor-pointer ${
                      isChecked
                        ? isDark ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'
                        : 'border-transparent opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={proposal.applied}
                      onChange={() => toggleAction(actionId)}
                      className="mt-0.5 rounded border-gray-400 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="text-[9px] px-1 py-0.2 uppercase font-mono border"
                          style={{
                            backgroundColor: isDark ? typeCfg.darkBgColor : typeCfg.bgColor,
                            color: isDark ? typeCfg.darkColor : typeCfg.color,
                            borderColor: isDark ? typeCfg.darkBorderColor : typeCfg.borderColor
                          }}
                        >
                          {typeCfg.label}
                        </span>
                        <span className="font-serif font-medium text-emerald-400">
                          {item.title}
                        </span>
                      </div>
                      <div className="text-[10px] font-serif opacity-80 mt-1 line-clamp-2 bg-black/5 dark:bg-white/5 p-1 rounded">
                        {item.statement}
                      </div>
                      {item.depends_on && item.depends_on.length > 0 && (
                        <div className="text-[10px] opacity-60 mt-0.5">
                          依赖前置: [{item.depends_on.join(', ')}]
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* 底部应用按钮 */}
          <div className="pt-2 border-t border-inherit flex items-center justify-between">
            <span className="text-[11px] opacity-60">
              {proposal.applied ? '改动已加入撤销栈 (Ctrl+Z 可恢复)' : `已勾选 ${selectedIds.size} 项变更`}
            </span>
            <button
              onClick={handleApplyClick}
              disabled={proposal.applied || selectedIds.size === 0}
              className={`px-3 py-1.5 rounded font-serif font-medium transition-all shadow-sm ${
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
    </div>
  );
};
